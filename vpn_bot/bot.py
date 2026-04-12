import telebot
from telebot import types
import requests
import pymysql
import uuid
import time
import logging
import traceback
from datetime import datetime
import json
import urllib3
import urllib.parse
import qrcode
import io
import config
import pricing_db
import os
from typing import Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("vpn_bot")

# threaded=False — обработка updates последовательно, меньше гонок с callback_query
bot = telebot.TeleBot(config.BOT_TOKEN, threaded=False)

# Wrap answer_callback_query to avoid crashing when Telegram reports
# "query is too old" or invalid callback IDs. This monkeypatch logs the error
# and continues execution instead of raising.
_orig_answer_callback = bot.answer_callback_query
def _safe_answer_callback(callback_query_id, text=None, show_alert=False, url=None, cache_time=None):
    try:
        return _orig_answer_callback(callback_query_id, text, show_alert, url, cache_time)
    except Exception as e:
        logger.debug("answer_callback_query failed: %s", e)
        return None
bot.answer_callback_query = _safe_answer_callback

MENU_PHOTO_ID_PATH = "menu_photo_id.txt"

def _read_menu_photo_id() -> Optional[str]:
    try:
        with open(MENU_PHOTO_ID_PATH, "r", encoding="utf-8") as f:
            val = f.read().strip()
            return val or None
    except FileNotFoundError:
        return None
    except Exception:
        return None

def _write_menu_photo_id(file_id: Optional[str]) -> None:
    try:
        with open(MENU_PHOTO_ID_PATH, "w", encoding="utf-8") as f:
            f.write((file_id or "").strip())
    except Exception:
        pass

def get_db_connection():
    return pymysql.connect(
        host=config.DB_HOST,
        user=config.DB_USER,
        password=config.DB_PASS,
        database=config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    conn = get_db_connection()
    with conn.cursor() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tg_id BIGINT UNIQUE,
            uuid TEXT,
            port INT,
            expire_time BIGINT,
            short_id VARCHAR(16),
            balance INT DEFAULT 0,
            language VARCHAR(10) DEFAULT 'ru'
        )''')
        # lightweight migrations
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_username VARCHAR(64) NULL")
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_first_name VARCHAR(128) NULL")
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_last_name VARCHAR(128) NULL")
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_lang_code VARCHAR(16) NULL")
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP")
        c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
        
        # Tickets table
        c.execute('''CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tg_id BIGINT,
            message TEXT,
            answer TEXT NULL,
            status VARCHAR(20) DEFAULT 'open',
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        )''')
    conn.commit()
    conn.close()

init_db()

_PRICING_TTL_SEC = 60
_pricing_bundle: Optional[tuple[int, list]] = None
_pricing_bundle_at: float = 0.0


def get_pricing_bundle() -> tuple[int, list]:
    global _pricing_bundle, _pricing_bundle_at
    now = time.time()
    if _pricing_bundle is None or now - _pricing_bundle_at > _PRICING_TTL_SEC:
        _pricing_bundle = pricing_db.load_pricing_plans(
            config.DB_HOST,
            config.DB_USER,
            config.DB_PASS,
            config.PRICING_DB_NAME,
        )
        _pricing_bundle_at = now
    return _pricing_bundle


def human_duration_ru(duration_seconds: int) -> str:
    if duration_seconds <= 7 * 86400 + 1:
        return "7 дней"
    months = max(1, round(duration_seconds / (30 * 86400)))
    return f"≈ {months} мес."


def tariff_button_label(plan: dict) -> str:
    """Подпись кнопки тарифа: цена и процент скидки из pricing_plan_terms.discount_rate."""
    m = int(plan["months"])
    pr = int(plan["price_rub"])
    star = "⭐ " if m == 12 else ""
    dr = float(plan.get("discount_rate") or 0)
    if dr >= 0.005:
        pct = int(round(dr * 100))
        return f"{star}{m} мес — {pr}₽ (−{pct}%)"
    return f"{star}{m} мес — {pr}₽"


def moneta_checkout_configured() -> bool:
    return bool(
        getattr(config, "SITE_API_BASE", "").strip()
        and getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    )


# Синхронизируйте с MONETA_BALANCE_TOPUP_AMOUNTS_RUB в lib/payments/external-checkout.ts (Next.js).
TOPUP_MONETA_AMOUNTS_RUB = (100, 300, 500, 1000, 3000)


def request_moneta_checkout_url(tg_id: int, plan_months: int) -> tuple[Optional[str], str]:
    """POST на Next.js → та же Moneta-ссылка, что на сайте. (ok_url, reason)."""
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return None, "not_configured"
    url = f"{base}/api/internal/bot-payment/create-session"
    try:
        r = requests.post(
            url,
            json={"telegramUserId": tg_id, "planMonths": plan_months, "locale": "ru"},
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("moneta checkout POST failed")
        return None, "network"
    if r.status_code != 200:
        logger.error("moneta checkout POST returned HTTP %s: %s", r.status_code, r.text)
        # try to parse JSON anyway for a structured reason
    try:
        data = r.json()
    except Exception:
        logger.exception("moneta checkout: failed to parse JSON response: %s", getattr(r, "text", "<no-text>"))
        return None, "server"
    # Successful structured response expected: { ok: true, redirectUrl: "..." }
    if data.get("ok") and data.get("redirectUrl"):
        return str(data["redirectUrl"]), "ok"
    logger.error("moneta checkout: unexpected response: %s", data)
    return None, str(data.get("reason") or "server")


def request_moneta_balance_topup_url(
    tg_id: int, amount_rub: int
) -> tuple[Optional[str], str]:
    """Пополнение balance в боте через Moneta (POST create-balance-session)."""
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return None, "not_configured"
    if amount_rub not in TOPUP_MONETA_AMOUNTS_RUB:
        return None, "validation"
    url = f"{base}/api/internal/bot-payment/create-balance-session"
    try:
        r = requests.post(
            url,
            json={
                "telegramUserId": tg_id,
                "amountRub": int(amount_rub),
                "locale": "ru",
            },
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("moneta balance top-up POST failed")
        return None, "network"
    if r.status_code != 200:
        logger.error("moneta balance top-up POST returned HTTP %s: %s", r.status_code, r.text)
    try:
        data = r.json()
    except Exception:
        logger.exception("moneta balance top-up: failed to parse JSON response: %s", getattr(r, "text", "<no-text>"))
        return None, "server"
    if data.get("ok") and data.get("redirectUrl"):
        return str(data["redirectUrl"]), "ok"
    logger.error("moneta balance top-up: unexpected response: %s", data)
    return None, str(data.get("reason") or "server")


def checkout_error_message_ru(reason: str) -> str:
    site = (getattr(config, "SITE_API_BASE", "").strip() or "https://free24internet.vip").rstrip("/")
    messages = {
        "not_configured": (
            "Онлайн-оплата из бота не настроена на сервере. Оплатите с баланса или обратитесь в поддержку."
        ),
        "forbidden": "Ошибка доступа к оплате. Обратитесь в поддержку.",
        "validation": "Некорректные данные (тариф, сумма или запрос).",
        "no_site_user": (
            f"Не найден аккаунт на сайте с этим Telegram. "
            f"Зайдите на {site}, войдите в аккаунт и привяжите бота в профиле."
        ),
        "not_eligible": (
            "Онлайн-оплата (карта / СБП, как в кабинете на сайте) для вашего аккаунта сейчас недоступна. "
            "Пополните баланс в боте или напишите в поддержку."
        ),
        "plan_unavailable": (
            "Для этого срока на сайте нет цены в прайсе (тариф отключён или изменился). "
            "Выберите другой срок или оплатите с баланса бота."
        ),
        "no_telegram": (
            "В профиле на сайте не привязан Telegram — без этого пополнить баланс бота нельзя."
        ),
        "no_auth_url": "На сайте не задан AUTH_URL — ссылку на оплату сформировать нельзя.",
        "network": "Не удалось связаться с сайтом. Попробуйте позже.",
        "server": "Сервер вернул ошибку. Попробуйте позже или обратитесь в поддержку.",
    }
    return messages.get(reason, messages["server"])


def user_has_vpn_row(user) -> bool:
    """В БД бота уже сохранён клиент 3X-UI (один профиль на Telegram)."""
    if not user:
        return False
    u = user.get("uuid")
    if u is None:
        return False
    return len(str(u).strip()) > 0


def ensure_user_from_telegram(tg_user):
    """Create/update a user row from Telegram user object."""
    tg_id = tg_user.id
    username = getattr(tg_user, "username", None)
    first_name = getattr(tg_user, "first_name", None)
    last_name = getattr(tg_user, "last_name", None)
    lang_code = getattr(tg_user, "language_code", None)

    conn = get_db_connection()
    with conn.cursor() as c:
        c.execute("INSERT IGNORE INTO users (tg_id) VALUES (%s)", (tg_id,))
        c.execute(
            "UPDATE users SET tg_username=%s, tg_first_name=%s, tg_last_name=%s, tg_lang_code=%s WHERE tg_id=%s",
            (username, first_name, last_name, lang_code, tg_id),
        )
    conn.commit()
    conn.close()

def get_panel_session():
    """Авторизация в панели 3X-UI и получение сессии"""
    session = requests.Session()
    login_data = {
        "username": config.PANEL_USER,
        "password": config.PANEL_PASS
    }
    if hasattr(config, 'PANEL_SECRET') and config.PANEL_SECRET:
        login_data["LoginSecret"] = config.PANEL_SECRET
        
    try:
        response = session.post(f"{config.PANEL_URL}/login", data=login_data, timeout=5, verify=False)
        if response.status_code == 200 and response.json().get('success'):
            return session
    except Exception as e:
        print(f"Ошибка авторизации: {e}")
    return None

def add_inbound(session, user_id, port, duration_seconds: Optional[int] = None):
    """Создание нового Inbound для пользователя. По умолчанию срок — 7 дней."""
    if duration_seconds is None:
        duration_seconds = 7 * 24 * 60 * 60
    client_uuid = str(uuid.uuid4())
    expire_time = int((time.time() + duration_seconds) * 1000)
    
    # Генерируем уникальный shortId
    short_id = os.urandom(8).hex()
    
    # Настройки клиента
    client_settings = {
        "id": client_uuid,
        "flow": "xtls-rprx-vision",
        "email": str(user_id),      # Email в панели - просто номер по порядку
        "limitIp": 1,               # Ограничение на 1 устройство
        "totalGB": 0,
        "expiryTime": expire_time,
        "enable": True,
        "tgId": "",
        "subId": ""
    }
    
    # Настройки Inbound (VLESS Reality)
    payload = {
        "up": 0,
        "down": 0,
        "total": 0,
        "remark": f"User_{user_id}",
        "enable": True,
        "expiryTime": expire_time,
        "listen": "",
        "port": port,
        "protocol": "vless",
        "settings": json.dumps({
            "clients": [client_settings],
            "decryption": "none",
            "fallbacks": []
        }),
        "streamSettings": json.dumps({
            "network": "tcp",
            "security": "reality",
            "realitySettings": {
                "show": False,
                "xver": 0,
                "dest": "yahoo.com:443",
                "serverNames": ["yahoo.com", "www.yahoo.com"],
                "privateKey": "EPtPI6Ic8Pjd2ujXF6DkyNIzDL-NFs3qHZyqlD6Ichk",
                "minClient": "",
                "maxClient": "",
                "maxTimediff": 0,
                "shortIds": [short_id],
                "settings": {
                    "publicKey": "VrMFfSvBarPYCL9BvVin31qyKnUrowgFBm_8okubhUc",
                    "fingerprint": "chrome",
                    "serverName": "",
                    "spiderX": "/"
                }
            },
            "tcpSettings": {
                "acceptProxyProtocol": False,
                "header": {"type": "none"}
            }
        }),
        "sniffing": json.dumps({
            "enabled": True,
            "destOverride": ["http", "tls"]
        }),
        "allocate": json.dumps({
            "strategy": "always",
            "refresh": 5,
            "concurrency": 3
        })
    }
    
    try:
        response = session.post(f"{config.PANEL_URL}/panel/api/inbounds/add", json=payload, timeout=5, verify=False)
        if response.status_code == 200 and response.json().get('success'):
            return client_uuid, expire_time, short_id
        else:
            print(f"Ошибка добавления Inbound: {response.text}")
    except Exception as e:
        print(f"Ошибка добавления Inbound: {e}")
    return None, None, None


def extend_inbound_client_subscription(session, port: int, client_uuid: str, duration_seconds: int):
    """
    Продлевает expiryTime клиента в существующем inbound (порт в панели = port).
    Новая дата = max(сейчас, текущий expiry в панели) + duration_seconds.
    Возвращает (new_expire_ms, None) или (None, текст_ошибки).
    """
    try:
        r = session.get(
            f"{config.PANEL_URL}/panel/api/inbounds/list",
            timeout=15,
            verify=False,
        )
    except Exception:
        logger.exception("inbounds list failed")
        return None, "Не удалось связаться с панелью (список inbound)."

    if r.status_code != 200:
        return None, f"Панель: список inbound, HTTP {r.status_code}."

    try:
        js = r.json()
    except Exception:
        return None, "Панель: неверный ответ при списке inbound."

    if not js.get("success"):
        return None, "Панель отклонила запрос списка inbound."

    inbounds = js.get("obj")
    if not isinstance(inbounds, list):
        return None, "Панель: неожиданный формат списка inbound."

    inbound = None
    for ib in inbounds:
        p = ib.get("port")
        if p is not None and int(p) == int(port):
            inbound = ib
            break

    if not inbound:
        return (
            None,
            "Не найден ваш inbound в панели (возможно, его удалили). Напишите в поддержку.",
        )

    inbound_id = inbound.get("id")
    if inbound_id is None:
        return None, "У inbound нет идентификатора в панели."

    settings_raw = inbound.get("settings")
    if isinstance(settings_raw, str):
        try:
            settings = json.loads(settings_raw)
        except json.JSONDecodeError:
            return None, "Не удалось разобрать настройки inbound в панели."
    elif isinstance(settings_raw, dict):
        settings = settings_raw
    else:
        return None, "Неверный формат settings у inbound."

    clients = settings.get("clients") or []
    old_client = None
    cu = str(client_uuid).strip().lower()
    for cl in clients:
        if not isinstance(cl, dict):
            continue
        cid = cl.get("id")
        if cid is not None and str(cid).strip().lower() == cu:
            old_client = dict(cl)
            break

    if not old_client:
        return None, "Клиент не найден в inbound. Напишите в поддержку."

    now_ms = int(time.time() * 1000)
    try:
        cur_exp = int(old_client.get("expiryTime") or 0)
    except (TypeError, ValueError):
        cur_exp = 0
    base_ms = max(now_ms, cur_exp)
    new_expire = base_ms + int(duration_seconds * 1000)
    old_client["expiryTime"] = new_expire

    new_settings_obj = {
        "clients": [old_client],
        "decryption": settings.get("decryption", "none"),
        "fallbacks": settings.get("fallbacks") if isinstance(settings.get("fallbacks"), list) else [],
    }

    payload = {"id": inbound_id, "settings": json.dumps(new_settings_obj)}

    try:
        ur = session.post(
            f"{config.PANEL_URL}/panel/api/inbounds/updateClient/{client_uuid}",
            json=payload,
            timeout=15,
            verify=False,
        )
    except Exception:
        logger.exception("updateClient failed")
        return None, "Не удалось отправить продление в панель."

    if ur.status_code != 200:
        return None, f"Панель: продление, HTTP {ur.status_code}."

    try:
        uj = ur.json()
    except Exception:
        return None, "Панель: неверный ответ при продлении."

    if not uj.get("success"):
        return None, "Панель не подтвердила продление подписки."

    return new_expire, None


def generate_vless_link(client_uuid, port, short_id, user_id):
    """Генерация VLESS ссылки для подключения (Reality)"""
    ip = getattr(config, 'VPN_DOMAIN', "185.216.87.152")
    pbk = "VrMFfSvBarPYCL9BvVin31qyKnUrowgFBm_8okubhUc"
    sni = "yahoo.com"
    fp = "chrome"
    spx = urllib.parse.quote("/")
    flow = "xtls-rprx-vision"
    name = urllib.parse.quote(f"User_{user_id}")
    
    link = f"vless://{client_uuid}@{ip}:{port}?type=tcp&security=reality&pbk={pbk}&fp={fp}&sni={sni}&sid={short_id}&spx={spx}&flow={flow}#{name}"
    return link

def generate_qr(data):
    """Генерация QR-кода в памяти"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    bio = io.BytesIO()
    bio.name = 'qr.png'
    img.save(bio, 'PNG')
    bio.seek(0)
    return bio

def show_account(chat_id, tg_id, message_id_to_delete=None):
    if message_id_to_delete is not None:
        try:
            bot.delete_message(chat_id, message_id_to_delete)
        except Exception:
            pass

    conn = get_db_connection()
    with conn.cursor() as c:
        c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
        user = c.fetchone()

        if not user:
            c.execute("INSERT INTO users (tg_id) VALUES (%s)", (tg_id,))
            conn.commit()
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()

        balance = user.get('balance', 0)
        lang = "🇷🇺 RU" if user.get('language') == 'ru' else "🇬🇧 EN"

        text = (
            f"👤 *Ваш профиль*\n\n"
            f"💵 Баланс: `{balance} ₽`\n"
            f"🌐 Язык: `{lang}`"
        )

        profile_markup = types.InlineKeyboardMarkup(row_width=1)
        profile_markup.add(types.InlineKeyboardButton("💰 Пополнить баланс", callback_data="topup"))
        profile_markup.add(types.InlineKeyboardButton("🌐 Сменить язык", callback_data="change_lang"))
        profile_markup.add(types.InlineKeyboardButton("◀️ Назад в меню", callback_data="main_menu"))

        bot.send_message(chat_id, text, parse_mode="Markdown", reply_markup=profile_markup)
    conn.close()

def get_main_menu():
    """Создание клавиатуры главного меню"""
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    btn1 = types.KeyboardButton("Главное меню")
    markup.add(btn1)
    return markup

def get_inline_menu():
    """Создание инлайн-клавиатуры для главного меню"""
    markup = types.InlineKeyboardMarkup(row_width=2)
    
    btn1 = types.InlineKeyboardButton("🛡 Купить доступ", callback_data="buy_vpn")
    btn2 = types.InlineKeyboardButton("🧦 Купить прокси", callback_data="buy_proxy")
    btn3 = types.InlineKeyboardButton("🌐 Мои услуги", callback_data="my_services")
    btn4 = types.InlineKeyboardButton("⚙️ Аккаунт", callback_data="account")
    btn5 = types.InlineKeyboardButton("💰 Пополнить", callback_data="topup")
    btn6 = types.InlineKeyboardButton("🆘 Помощь", callback_data="help")
    btn8 = types.InlineKeyboardButton("👥 О нас", callback_data="about")
    btn9 = types.InlineKeyboardButton("🎁 Подари другу", callback_data="gift")
    btn_website = types.InlineKeyboardButton("💻 Наш сайт", url="https://free24internet.vip")
    
    markup.add(btn1, btn2)
    markup.add(btn3, btn4)
    markup.add(btn5, btn6)
    markup.add(btn8, btn9)
    markup.add(btn_website)
    
    return markup

def send_main_menu(chat_id):
    """Отправка сообщения с главным меню"""
    text = (
        "🌍 *Свободный Интернет* — ваш надежный проводник в мир безопасности!\n\n"
        "⚡️ *Высокая скорость* — смотрите видео в 4K без задержек.\n"
        "🔒 *Полная анонимность* — надежное шифрование ваших данных.\n"
        "📱 *Любые устройства* — работает на iOS, Android, Windows и macOS.\n\n"
        "Обеспечьте себе стабильность и защиту. Подключайтесь в 1 клик и наслаждайтесь по-настоящему безопасным интернетом!"
    )
    
    cached_photo_id = _read_menu_photo_id()
    if cached_photo_id:
        try:
            bot.send_photo(chat_id, cached_photo_id, caption=text, reply_markup=get_inline_menu(), parse_mode="Markdown")
            return
        except Exception:
            _write_menu_photo_id(None)

    try:
        with open("vpn_menu.png", "rb") as photo:
            msg = bot.send_photo(chat_id, photo, caption=text, reply_markup=get_inline_menu(), parse_mode="Markdown")
            try:
                if getattr(msg, "photo", None):
                    _write_menu_photo_id(msg.photo[-1].file_id)
            except Exception:
                pass
    except Exception as e:
        print(f"Ошибка отправки фото: {e}")
        bot.send_message(chat_id, text, reply_markup=get_inline_menu(), parse_mode="Markdown")

@bot.message_handler(commands=['start'])
def start_message(message):
    ensure_user_from_telegram(message.from_user)
    bot.send_message(
        message.chat.id, 
        "👋 *Добро пожаловать!*\n\n"
        "Я бот для выдачи персонального безопасного доступа.\n\n"
        "Продолжая использование бота, вы принимаете [Пользовательское соглашение](https://free24internet.vip/terms) и [Политику конфиденциальности](https://free24internet.vip/privacy).\n\n"
        "Используйте кнопку ниже для открытия главного меню 👇", 
        reply_markup=get_main_menu(),
        parse_mode="Markdown",
        disable_web_page_preview=True
    )
    send_main_menu(message.chat.id)


@bot.message_handler(commands=['menu'])
def menu_command(message):
    """Повторно открыть главное меню (удобно, если инлайн-кнопки «зависли»)."""
    ensure_user_from_telegram(message.from_user)
    send_main_menu(message.chat.id)

def process_ticket_message(message):
    if not message.text:
        bot.send_message(message.chat.id, "❌ Пожалуйста, отправьте текстовое сообщение.")
        return

    tg_id = message.from_user.id
    text = message.text

    conn = get_db_connection()
    with conn.cursor() as c:
        c.execute("INSERT INTO tickets (tg_id, message) VALUES (%s, %s)", (tg_id, text))
        conn.commit()
        ticket_id = c.lastrowid
    conn.close()

    bot.send_message(message.chat.id, f"✅ *Ваш тикет #{ticket_id} успешно создан!*\n\nТехническая поддержка ответит вам в ближайшее время.", parse_mode="Markdown")

    # Уведомляем администратора, если он задан
    if hasattr(config, 'ADMIN_ID') and config.ADMIN_ID:
        admin_text = (
            f"🔔 *Новый тикет #{ticket_id}*\n\n"
            f"👤 От пользователя: [{message.from_user.first_name}](tg://user?id={tg_id})\n"
            f"📝 *Сообщение:*\n{text}\n\n"
            f"Для ответа используйте команду:\n`/reply {ticket_id} ваш текст ответа`"
        )
        try:
            bot.send_message(config.ADMIN_ID, admin_text, parse_mode="Markdown")
        except Exception as e:
            print(f"Не удалось отправить уведомление администратору: {e}")

@bot.message_handler(commands=['reply'])
def reply_ticket(message):
    if not hasattr(config, 'ADMIN_ID') or message.from_user.id != config.ADMIN_ID:
        return

    parts = message.text.split(' ', 2)
    if len(parts) < 3:
        bot.send_message(message.chat.id, "Использование: `/reply <номер_тикета> <текст_ответа>`", parse_mode="Markdown")
        return

    try:
        ticket_id = int(parts[1])
    except ValueError:
        bot.send_message(message.chat.id, "Номер тикета должен быть числом.")
        return

    answer_text = parts[2]

    conn = get_db_connection()
    with conn.cursor() as c:
        c.execute("SELECT tg_id, status FROM tickets WHERE id=%s", (ticket_id,))
        ticket = c.fetchone()
        
        if not ticket:
            bot.send_message(message.chat.id, "❌ Тикет не найден.")
            conn.close()
            return
            
        c.execute("UPDATE tickets SET answer=%s, status='answered' WHERE id=%s", (answer_text, ticket_id))
        conn.commit()
    conn.close()

    try:
        bot.send_message(
            ticket['tg_id'], 
            f"📩 *Ответ технической поддержки на ваш тикет #{ticket_id}:*\n\n{answer_text}", 
            parse_mode="Markdown"
        )
        bot.send_message(message.chat.id, f"✅ Ответ на тикет #{ticket_id} успешно отправлен!")
    except Exception as e:
        bot.send_message(message.chat.id, f"❌ Ошибка отправки ответа пользователю: {e}")

@bot.message_handler(func=lambda m: m.content_type == "text" and m.text == "Главное меню")
def handle_main_menu_button(message):
    send_main_menu(message.chat.id)


@bot.callback_query_handler(func=lambda call: True)
def handle_callback(call):
    try:
        _handle_callback_impl(call)
    except Exception:
        logger.error("callback_data=%s\n%s", getattr(call, "data", None), traceback.format_exc())
        try:
            bot.answer_callback_query(
                call.id,
                "Произошла ошибка. Попробуйте /menu или кнопку «Главное меню».",
                show_alert=True,
            )
        except Exception:
            pass


def _vpn_tariff_payment_markup(months: int, price_rub: int, bal: int) -> types.InlineKeyboardMarkup:
    kb = types.InlineKeyboardMarkup(row_width=1)
    need = max(0, price_rub - bal)
    if bal >= price_rub:
        kb.add(
            types.InlineKeyboardButton(
                f"💰 Списать с баланса (−{price_rub} ₽)",
                callback_data=f"vpn_pay_balance:{months}",
            ),
        )
    else:
        kb.add(
            types.InlineKeyboardButton(
                f"💰 С баланса (не хватает {need} ₽)",
                callback_data=f"vpn_pay_balance:{months}",
            ),
        )
    # Show Moneta/site payment as a payment *method* (not a tariff) when configured.
    if moneta_checkout_configured():
        kb.add(
            types.InlineKeyboardButton(
                "💳 Moneta",
                callback_data=f"vpn_checkout:{months}",
            ),
        )
    kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
    return kb


def _send_vpn_tariff_payment_offer(chat_id, months, price_rub, bal, will_renew: bool):
    subtitle = "продление" if will_renew else "новый доступ"
    if bal >= price_rub:
        bal_line = f"💵 Баланс: *{bal} ₽* — *хватает* для списания *{price_rub} ₽*.\n\n"
    else:
        bal_line = f"💵 Баланс: *{bal} ₽* — до тарифа не хватает *{price_rub - bal} ₽*.\n\n"
    text = (
        "💳 *Способ оплаты*\n\n"
        f"Тариф *{months} мес.* — *{price_rub} ₽* ({subtitle}).\n"
        f"{bal_line}"
        "Выберите, как оплатить:\n"
        "• *С баланса* — спишем сумму в боте и сразу выдадим или продлим VPN.\n"
    )
    bot.send_message(
        chat_id,
        text,
        parse_mode="Markdown",
        reply_markup=_vpn_tariff_payment_markup(months, price_rub, bal),
    )


def _run_vpn_plan_provision(chat_id, tg_id, months, duration_sec, price_rub):
    conn_early = get_db_connection()
    try:
        with conn_early.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user_early = c.fetchone()
    finally:
        conn_early.close()

    renewing_preview = user_has_vpn_row(user_early)
    progress = bot.send_message(
        chat_id,
        "⏳ Продлеваю подписку в панели…"
        if renewing_preview
        else "⏳ Создаю персональный доступ в панели…",
    )

    session = get_panel_session()
    if not session:
        bot.edit_message_text(
            "❌ Ошибка авторизации в панели 3X-UI. Обратитесь к администратору.",
            chat_id,
            progress.message_id,
        )
        return

    did_renew = False
    client_uuid = None
    expire_time = None
    short_id = None
    port = None
    user_id = None

    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()
            if not user:
                c.execute("INSERT INTO users (tg_id) VALUES (%s)", (tg_id,))
                conn.commit()
                c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                user = c.fetchone()
            user_id = user["id"]
            renew = user_has_vpn_row(user)

            if price_rub > 0:
                bal = int(user.get("balance") or 0)
                if bal < price_rub:
                    try:
                        bot.delete_message(chat_id, progress.message_id)
                    except Exception:
                        pass
                    _send_vpn_tariff_payment_offer(chat_id, months, price_rub, bal, renew)
                    return

            default_port = config.START_PORT + user_id
            stored_port = int(user.get("port") or default_port)

            if renew:
                did_renew = True
                client_uuid = str(user.get("uuid") or "").strip()
                if not client_uuid:
                    bot.edit_message_text(
                        "❌ В базе бота нет идентификатора ключа. Напишите в поддержку.",
                        chat_id,
                        progress.message_id,
                    )
                    return
                new_exp, ext_err = extend_inbound_client_subscription(
                    session,
                    stored_port,
                    client_uuid,
                    duration_sec,
                )
                if ext_err:
                    bot.edit_message_text(
                        f"❌ {ext_err}",
                        chat_id,
                        progress.message_id,
                    )
                    return
                expire_time = new_exp
                short_id = user.get("short_id") or "8c8b17de0242"
                port = stored_port

                if price_rub > 0:
                    c.execute(
                        "UPDATE users SET balance = COALESCE(balance, 0) - %s "
                        "WHERE id = %s AND COALESCE(balance, 0) >= %s",
                        (price_rub, user_id, price_rub),
                    )
                    if c.rowcount != 1:
                        conn.rollback()
                        bot.edit_message_text(
                            "❌ Не удалось списать баланс. Напишите в поддержку.",
                            chat_id,
                            progress.message_id,
                        )
                        return

                c.execute(
                    "UPDATE users SET expire_time=%s WHERE id=%s",
                    (expire_time, user_id),
                )
            else:
                port = default_port
                client_uuid, expire_time, short_id = add_inbound(
                    session,
                    user_id,
                    port,
                    duration_seconds=duration_sec,
                )
                if not client_uuid:
                    bot.edit_message_text(
                        "❌ Ошибка при создании подключения в панели.",
                        chat_id,
                        progress.message_id,
                    )
                    return

                if price_rub > 0:
                    c.execute(
                        "UPDATE users SET balance = COALESCE(balance, 0) - %s "
                        "WHERE id = %s AND COALESCE(balance, 0) >= %s",
                        (price_rub, user_id, price_rub),
                    )
                    if c.rowcount != 1:
                        conn.rollback()
                        bot.edit_message_text(
                            "❌ Не удалось списать баланс. Напишите в поддержку.",
                            chat_id,
                            progress.message_id,
                        )
                        return

                c.execute(
                    "UPDATE users SET uuid=%s, port=%s, expire_time=%s, short_id=%s WHERE id=%s",
                    (client_uuid, port, expire_time, short_id, user_id),
                )
        conn.commit()
    except Exception:
        conn.rollback()
        logger.exception("vpn_plan provision failed")
        try:
            bot.edit_message_text(
                "❌ Внутренняя ошибка. Попробуйте позже.",
                chat_id,
                progress.message_id,
            )
        except Exception:
            pass
        return
    finally:
        conn.close()

    vless_link = generate_vless_link(client_uuid, port, short_id, user_id)
    qr_image = generate_qr(vless_link)
    dur_txt = human_duration_ru(duration_sec)
    paid_line = f"💰 Списано с баланса: `{price_rub} ₽`\n" if price_rub else ""
    expire_h = datetime.fromtimestamp(expire_time / 1000).strftime("%d.%m.%Y %H:%M")
    if did_renew:
        caption = (
            f"✅ *Подписка продлена!*\n\n"
            f"👤 Пользователь: `User_{user_id}`\n"
            f"➕ Добавлено: *{dur_txt}*\n"
            f"📅 Новая дата окончания: `{expire_h}`\n"
            f"{paid_line}"
            f"📱 Лимит: 1 устройство.\n\n"
            f"🔗 *Ссылка (без изменений):*\n`{vless_link}`\n\n"
            f"Скопируйте ссылку или отсканируйте QR."
        )
    else:
        caption = (
            f"✅ *Доступ готов!*\n\n"
            f"👤 Пользователь: `User_{user_id}`\n"
            f"⏳ Срок: *{dur_txt}*\n"
            f"📅 До: `{expire_h}`\n"
            f"{paid_line}"
            f"📱 Лимит: 1 устройство.\n\n"
            f"🔗 *Ссылка для подключения:*\n`{vless_link}`\n\n"
            f"Скопируйте ссылку или отсканируйте QR (v2rayN, Hiddify, Shadowrocket и др.)."
        )
    try:
        bot.delete_message(chat_id, progress.message_id)
    except Exception:
        pass
    bot.send_photo(chat_id, qr_image, caption=caption, parse_mode="Markdown")


def _handle_callback_impl(call):
    tg_id = call.from_user.id
    
    if call.data == "buy_vpn":
        bot.answer_callback_query(call.id)
        conn = get_db_connection()
        try:
            with conn.cursor() as c:
                c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                user = c.fetchone()
        finally:
            conn.close()

        has_vpn = user_has_vpn_row(user)
        _, plans = get_pricing_bundle()
        # Build the buy/renew text without presenting "Карта / СБП" as a tariff option.
        if has_vpn:
            text = (
                "🛡 *Купить / продлить доступ*\n\n"
                "Выберите тариф — оплаченный срок *добавится к текущей дате окончания* "
                "(если подписка уже истекла — отсчёт от сегодня).\n\n"
                "На кнопках — *скидка в %* от полной суммы без скидки.\n\n"
                "*Пробный период 7 дней* доступен только при *первом* подключении — "
                "ниже только платные тарифы."
            )
        else:
            text = (
                "🛡 *Купить доступ*\n\n"
                "Выберите тариф — цены как на сайте. "
                "На кнопках — *скидка в %* от полной суммы без скидки.\n\n"
                "Или оформите *бесплатный пробный период* на 7 дней."
            )

        markup = types.InlineKeyboardMarkup(row_width=1)
        for p in plans:
            m = int(p["months"])
            markup.add(
                types.InlineKeyboardButton(
                    tariff_button_label(p),
                    callback_data=f"vpn_plan:{m}",
                ),
            )
        if not has_vpn:
            markup.add(
                types.InlineKeyboardButton(
                    "🎁 Пробный период — 0₽ (7 дней)",
                    callback_data="vpn_plan:0",
                ),
            )
        # Do not add a direct "Карта / СБП" button here — it's a payment method, not a tariff.
        markup.add(types.InlineKeyboardButton("◀️ В главное меню", callback_data="main_menu"))
        bot.send_message(
            call.message.chat.id,
            text,
            parse_mode="Markdown",
            reply_markup=markup,
        )

    elif call.data == "vpn_checkout_menu":
        bot.answer_callback_query(call.id)
        if not moneta_checkout_configured():
            bot.send_message(
                call.message.chat.id,
                "💳 Онлайн-оплата (карта / СБП) из бота не подключена. "
                "Оплатите с баланса в боте или обратитесь в поддержку.",
            )
            return
        _, plans = get_pricing_bundle()
        intro = (
            "💳 *Оплата как на сайте*\n\n"
            "Тот же способ, что в личном кабинете: *карта или СБП* (Moneta / PayAnyWay).\n\n"
            "Нужен *аккаунт на сайте* с привязанным *этим* Telegram и правом оплаты на сайте "
            "(как при нажатии «Перейти к оплате» в кабинете).\n\n"
            "После успешной оплаты подписка продлится *на сайте* (как при оплате с сайта). "
            "Ключ VPN в боте по-прежнему выдаётся и продлевается с *баланса бота*.\n\n"
            "Выберите срок:"
        )
        cm = types.InlineKeyboardMarkup(row_width=1)
        for p in plans:
            m = int(p["months"])
            cm.add(
                types.InlineKeyboardButton(
                    f"{tariff_button_label(p)} · 💳",
                    callback_data=f"vpn_checkout:{m}",
                ),
            )
        cm.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
        bot.send_message(call.message.chat.id, intro, parse_mode="Markdown", reply_markup=cm)

    elif call.data.startswith("vpn_checkout:"):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        try:
            co_months = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректные данные", show_alert=True)
            return
        _, plans = get_pricing_bundle()
        co_plan = pricing_db.plan_by_months(plans, co_months)
        if not co_plan:
            bot.answer_callback_query(call.id, "Тариф недоступен", show_alert=True)
            return
        bot.answer_callback_query(call.id)
        pay_url, reason = request_moneta_checkout_url(tg_id, co_months)
        if pay_url:
            pay_kb = types.InlineKeyboardMarkup()
            # Prefer opening payment in Telegram Web App if supported by client
            try:
                webinfo = types.WebAppInfo(url=pay_url)
                pay_kb.add(types.InlineKeyboardButton("💳 Оплата (в приложении)", web_app=webinfo))
            except Exception:
                pay_kb.add(types.InlineKeyboardButton("💳 Перейти к оплате", url=pay_url))
            pay_kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
            pr = int(co_plan["price_rub"])
            bot.send_message(
                call.message.chat.id,
                f"💳 *Оплата: {co_months} мес.* — *{pr} ₽*\n\n"
                "Нажмите кнопку ниже — откроется страница оплаты (как на сайте). "
                "После оплаты вы вернётесь в личный кабинет; подписка на сайте обновится автоматически.",
                parse_mode="Markdown",
                reply_markup=pay_kb,
            )
        else:
            bot.send_message(call.message.chat.id, checkout_error_message_ru(reason))

    elif call.data.startswith("vpn_pay_balance:"):
        try:
            pb_months = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректные данные", show_alert=True)
            return
        if pb_months <= 0 or pb_months > 120:
            bot.answer_callback_query(call.id, "Некорректный тариф", show_alert=True)
            return
        _, plans_pb = get_pricing_bundle()
        pl = pricing_db.plan_by_months(plans_pb, pb_months)
        if not pl:
            bot.answer_callback_query(call.id, "Тариф недоступен", show_alert=True)
            return
        pb_price = int(pl["price_rub"])
        pb_duration = int(pb_months) * 30 * 86400
        conn_pb = get_db_connection()
        try:
            with conn_pb.cursor() as c:
                c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                urow = c.fetchone()
                if not urow:
                    c.execute("INSERT INTO users (tg_id) VALUES (%s)", (tg_id,))
                    conn_pb.commit()
                    c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                    urow = c.fetchone()
                pb_bal = int(urow.get("balance") or 0)
        finally:
            conn_pb.close()
        if pb_bal < pb_price:
            bot.answer_callback_query(
                call.id,
                f"На балансе {pb_bal} ₽, для тарифа нужно {pb_price} ₽. "
                "Нажмите «Карта / СБП» или дождитесь пополнения баланса в боте.",
                show_alert=True,
            )
            return
        bot.answer_callback_query(call.id)
        _run_vpn_plan_provision(call.message.chat.id, tg_id, pb_months, pb_duration, pb_price)

    elif call.data.startswith("vpn_plan:"):
        try:
            months = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректные данные", show_alert=True)
            return
        if months < 0 or months > 120:
            bot.answer_callback_query(call.id, "Некорректный тариф", show_alert=True)
            return

        conn_early = get_db_connection()
        try:
            with conn_early.cursor() as c:
                c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                user_early = c.fetchone()
        finally:
            conn_early.close()

        if months == 0 and user_has_vpn_row(user_early):
            bot.answer_callback_query(
                call.id,
                "Пробный период только при первом подключении. Для продления выберите платный тариф.",
                show_alert=True,
            )
            return

        _, plans = get_pricing_bundle()
        if months == 0:
            duration_sec = 7 * 86400
            price_rub = 0
        else:
            plan = pricing_db.plan_by_months(plans, months)
            if not plan:
                bot.answer_callback_query(call.id, "Этот тариф сейчас недоступен", show_alert=True)
                return
            duration_sec = int(months) * 30 * 86400
            price_rub = int(plan["price_rub"])

        bot.answer_callback_query(call.id)

        if price_rub > 0:
            conn_bal = get_db_connection()
            try:
                with conn_bal.cursor() as c:
                    c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                    urow = c.fetchone()
                    if not urow:
                        c.execute("INSERT INTO users (tg_id) VALUES (%s)", (tg_id,))
                        conn_bal.commit()
                        c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                        urow = c.fetchone()
                    bal = int(urow.get("balance") or 0)
            finally:
                conn_bal.close()
            _send_vpn_tariff_payment_offer(
                call.message.chat.id,
                months,
                price_rub,
                bal,
                user_has_vpn_row(user_early),
            )
            return

        _run_vpn_plan_provision(call.message.chat.id, tg_id, months, duration_sec, 0)

    elif call.data == "account":
        bot.answer_callback_query(call.id)
        show_account(call.message.chat.id, tg_id, message_id_to_delete=call.message.message_id)

    elif call.data == "my_services":
        bot.answer_callback_query(call.id)
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        conn = get_db_connection()
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()
            
            if user_has_vpn_row(user):
                services_markup = types.InlineKeyboardMarkup(row_width=1)
                services_markup.add(types.InlineKeyboardButton("🛡 Доступ (1 устройство)", callback_data="service_vpn"))
                services_markup.add(types.InlineKeyboardButton("◀️ Назад в меню", callback_data="main_menu"))
                
                bot.send_message(call.message.chat.id, "📦 *Мои услуги*\n\nВыберите услугу для управления:", parse_mode="Markdown", reply_markup=services_markup)
            else:
                bot.send_message(call.message.chat.id, "❌ У вас еще нет активных услуг. Нажмите «Купить доступ», чтобы создать.", parse_mode="Markdown")
        conn.close()

    elif call.data == "service_vpn":
        bot.answer_callback_query(call.id)
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        conn = get_db_connection()
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()
            
            if user_has_vpn_row(user):
                expire_date = datetime.fromtimestamp(user['expire_time'] / 1000).strftime('%d.%m.%Y %H:%M')
                short_id = user.get('short_id') or "8c8b17de0242"
                
                vless_link = generate_vless_link(user['uuid'], user['port'], short_id, user['id'])
                qr_image = generate_qr(vless_link)
                
                caption = (
                    f"🛡 *Услуга: Доступ*\n\n"
                    f"🆔 Логин: `User_{user['id']}`\n"
                    f"🔌 Порт: `{user['port']}`\n"
                    f"⏳ Истекает: `{expire_date}`\n"
                    f"📱 Лимит: 1 устройство.\n\n"
                    f"🔗 *Ваша ссылка для подключения:*\n"
                    f"`{vless_link}`"
                )
                
                vpn_markup = types.InlineKeyboardMarkup(row_width=1)
                vpn_markup.add(types.InlineKeyboardButton("◀️ Назад к услугам", callback_data="my_services"))
                
                bot.send_photo(call.message.chat.id, qr_image, caption=caption, parse_mode="Markdown", reply_markup=vpn_markup)
            else:
                bot.send_message(call.message.chat.id, "❌ Услуга не найдена.", parse_mode="Markdown")
        conn.close()

    elif call.data == "change_lang":
        bot.answer_callback_query(call.id)
        lang_markup = types.InlineKeyboardMarkup(row_width=2)
        lang_markup.add(
            types.InlineKeyboardButton("🇷🇺 Русский", callback_data="set_lang_ru"),
            types.InlineKeyboardButton("🇬🇧 English", callback_data="set_lang_en")
        )
        lang_markup.add(types.InlineKeyboardButton("◀️ Назад", callback_data="account"))
        # edit_message_text нельзя вызвать для сообщения с фото — только для текста
        try:
            if call.message.content_type == "photo":
                try:
                    bot.delete_message(call.message.chat.id, call.message.message_id)
                except Exception:
                    pass
                bot.send_message(
                    call.message.chat.id,
                    "🌐 Выберите язык / Choose language:",
                    reply_markup=lang_markup,
                )
            else:
                bot.edit_message_text(
                    "🌐 Выберите язык / Choose language:",
                    call.message.chat.id,
                    call.message.message_id,
                    reply_markup=lang_markup,
                )
        except Exception:
            bot.send_message(
                call.message.chat.id,
                "🌐 Выберите язык / Choose language:",
                reply_markup=lang_markup,
            )
        
    elif call.data.startswith("set_lang_"):
        lang = call.data.split("_")[2]
        conn = get_db_connection()
        with conn.cursor() as c:
            c.execute("INSERT IGNORE INTO users (tg_id) VALUES (%s)", (tg_id,))
            c.execute("UPDATE users SET language=%s WHERE tg_id=%s", (lang, tg_id))
        conn.commit()
        conn.close()

        bot.answer_callback_query(call.id, "Язык изменён")
        show_account(call.message.chat.id, tg_id, message_id_to_delete=call.message.message_id)

    elif call.data == "topup":
        bot.answer_callback_query(call.id)
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass

        topup_markup = types.InlineKeyboardMarkup(row_width=2)
        if moneta_checkout_configured():
            for amt in TOPUP_MONETA_AMOUNTS_RUB:
                topup_markup.add(
                    types.InlineKeyboardButton(
                        f"{amt} ₽ · 💳",
                        callback_data=f"topup_moneta:{amt}",
                    ),
                )
        topup_markup.add(types.InlineKeyboardButton("◀️ Назад", callback_data="account"))
        intro = (
            "💳 *Пополнение баланса*\n\n"
            "Деньги зачислятся на *баланс в этом боте* (списание при покупке VPN).\n"
        )
        if moneta_checkout_configured():
            intro += (
                "Нужен аккаунт на сайте с привязанным Telegram и доступом к оплате Moneta "
                "(как «Карта / СБП» в личном кабинете).\n\n"
                "Выберите сумму:"
            )
        else:
            intro += (
                "Онлайн-оплата из бота сейчас не подключена на сервере "
                "(SITE_API_BASE и BOT_PAYMENT_SECRET в настройках бота)."
            )
        bot.send_message(call.message.chat.id, intro, parse_mode="Markdown", reply_markup=topup_markup)

    elif call.data.startswith("topup_moneta:"):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        try:
            amt = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        if amt not in TOPUP_MONETA_AMOUNTS_RUB:
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        bot.answer_callback_query(call.id)
        pay_url, reason = request_moneta_balance_topup_url(tg_id, amt)
        if pay_url:
            pay_kb = types.InlineKeyboardMarkup()
            # Prefer opening payment in Telegram Web App if supported by client
            try:
                webinfo = types.WebAppInfo(url=pay_url)
                pay_kb.add(types.InlineKeyboardButton("💳 Оплата (в приложении)", web_app=webinfo))
            except Exception:
                pay_kb.add(types.InlineKeyboardButton("💳 Перейти к оплате", url=pay_url))
            pay_kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
            bot.send_message(
                call.message.chat.id,
                f"💳 *Пополнение баланса* — *{amt} ₽*\n\n"
                "После успешной оплаты средства появятся на балансе в боте в течение минуты.\n"
                "Если баланс не обновился — напишите в поддержку.",
                parse_mode="Markdown",
                reply_markup=pay_kb,
            )
        else:
            bot.send_message(call.message.chat.id, checkout_error_message_ru(reason))

    elif call.data == "main_menu":
        bot.answer_callback_query(call.id)
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
        send_main_menu(call.message.chat.id)

    elif call.data == "help":
        bot.answer_callback_query(call.id)
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        help_text = (
            "ℹ️ *Справка по использованию сервиса*\n\n"
            "1️⃣ Нажмите «Купить доступ», чтобы сгенерировать персональный доступ.\n"
            "2️⃣ Скопируйте полученную ссылку (начинается с `vless://`).\n"
            "3️⃣ Скачайте приложение для вашего устройства:\n"
            "   • *iOS*: Shadowrocket, Streisand, V2Ray Tun\n"
            "   • *Android*: v2rayNG, Hiddify, NekoBox\n"
            "   • *Windows*: v2rayN, Hiddify\n"
            "   • *macOS*: v2rayN, Hiddify\n"
            "4️⃣ Откройте приложение и добавьте сервер из буфера обмена (или отсканируйте QR-код).\n"
            "5️⃣ Включите подключение и наслаждайтесь свободным интернетом!"
        )
        
        help_markup = types.InlineKeyboardMarkup(row_width=1)
        help_markup.add(types.InlineKeyboardButton("✉️ Создать тикет (Техподдержка)", callback_data="create_ticket"))
        help_markup.add(types.InlineKeyboardButton("◀️ Назад в меню", callback_data="main_menu"))
        
        bot.send_message(call.message.chat.id, help_text, parse_mode="Markdown", reply_markup=help_markup)
        
    elif call.data == "create_ticket":
        bot.answer_callback_query(call.id)
        msg = bot.send_message(call.message.chat.id, "📝 *Создание тикета*\n\nПожалуйста, подробно опишите вашу проблему или вопрос в одном сообщении ниже:", parse_mode="Markdown")
        bot.register_next_step_handler(msg, process_ticket_message)
        
    elif call.data == "about":
        bot.answer_callback_query(call.id)
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        about_text = (
            "🌍 *О нас*\n\n"
            "Свободный Интернет — это сервис, созданный для тех, кто ценит скорость, безопасность и стабильность.\n\n"
            "Мы помогаем пользователям по всему миру получать надежный и защищенный доступ к сети.\n\n"
            "⚡ Наш приоритет — простота: подключение в 1 клик\n"
            "🔒 Безопасность: защита данных и приватности\n"
            "🚀 Скорость: быстрые и стабильные сервера\n\n"
            "Мы делаем интернет таким, каким он должен быть — безопасным и стабильным."
        )
        
        about_markup = types.InlineKeyboardMarkup(row_width=1)
        about_markup.add(types.InlineKeyboardButton("📜 Пользовательское соглашение", callback_data="terms"))
        about_markup.add(types.InlineKeyboardButton("🔒 Политика конфиденциальности", callback_data="privacy"))
        about_markup.add(types.InlineKeyboardButton("◀️ Назад в меню", callback_data="main_menu"))
        
        bot.send_message(call.message.chat.id, about_text, parse_mode="Markdown", reply_markup=about_markup)
        
    elif call.data in ["terms", "privacy"]:
        bot.answer_callback_query(call.id)
        filename = "terms.txt" if call.data == "terms" else "privacy.txt"
        filepath = os.path.join(os.path.dirname(__file__), filename)
        title = "Пользовательское соглашение" if call.data == "terms" else "Политика конфиденциальности"
        
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                text = f.read()
        except:
            text = "Документ не найден."
            
        markup = types.InlineKeyboardMarkup()
        markup.add(types.InlineKeyboardButton("◀️ Назад", callback_data="about"))
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        bot.send_message(call.message.chat.id, f"*{title}*", parse_mode="Markdown")
        
        if not text:
            bot.send_message(call.message.chat.id, "Текст пуст.", reply_markup=markup)
        else:
            parts = [text[i:i+4000] for i in range(0, len(text), 4000)]
            for i, part in enumerate(parts):
                if i == len(parts) - 1:
                    bot.send_message(call.message.chat.id, part, reply_markup=markup)
                else:
                    bot.send_message(call.message.chat.id, part)

    elif call.data == "buy_proxy":
        bot.answer_callback_query(call.id, "Раздел «Прокси» в разработке.", show_alert=True)

    elif call.data == "gift":
        bot.answer_callback_query(call.id, "Раздел «Подари другу» в разработке.", show_alert=True)
        
    else:
        bot.answer_callback_query(call.id, "Раздел в разработке.", show_alert=True)

if __name__ == '__main__':
    print("Бот запущен...")
    # Long polling и webhook на одном токене взаимоисключающи; сбрасываем webhook (например после register-telegram-webhook на сайте).
    bot.remove_webhook()
    # Явно запрашиваем callback_query (после webhook у Telegram мог остаться узкий allowed_updates).
    bot.polling(
        none_stop=True,
        skip_pending=True,
        allowed_updates=["message", "edited_message", "callback_query"],
    )