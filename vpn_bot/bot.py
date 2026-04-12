import telebot
from telebot import types
import requests
import pymysql
import uuid
import time
from datetime import datetime
import json
import urllib3
import urllib.parse
import qrcode
import io
import config
import os
from typing import Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

bot = telebot.TeleBot(config.BOT_TOKEN)

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

def add_inbound(session, user_id, port):
    """Создание нового Inbound для пользователя"""
    client_uuid = str(uuid.uuid4())
    # 7 дней в миллисекундах
    expire_time = int((time.time() + 7 * 24 * 60 * 60) * 1000)
    
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

@bot.message_handler(content_types=['text'])
def handle_text(message):
    if message.text == "Главное меню":
        send_main_menu(message.chat.id)

@bot.callback_query_handler(func=lambda call: True)
def handle_callback(call):
    tg_id = call.from_user.id
    
    if call.data == "buy_vpn":
        conn = get_db_connection()
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()
            
            if user and user['uuid']:
                bot.answer_callback_query(call.id, "⚠️ Вы уже получали доступ! Зайдите в раздел «Мои услуги».", show_alert=True)
            else:
                bot.answer_callback_query(call.id)
                msg = bot.send_message(call.message.chat.id, "⏳ Генерирую для вас персональный доступ на 7 дней (лимит: 1 устройство)...")
                
                session = get_panel_session()
                if session:
                    if not user:
                        c.execute("INSERT INTO users (tg_id) VALUES (%s)", (tg_id,))
                        conn.commit()
                        user_id = c.lastrowid
                    else:
                        user_id = user['id']
                    
                    port = config.START_PORT + user_id
                    client_uuid, expire_time, short_id = add_inbound(session, user_id, port)
                    
                    if client_uuid:
                        c.execute("UPDATE users SET uuid=%s, port=%s, expire_time=%s, short_id=%s WHERE id=%s", 
                                  (client_uuid, port, expire_time, short_id, user_id))
                        conn.commit()
                        
                        vless_link = generate_vless_link(client_uuid, port, short_id, user_id)
                        qr_image = generate_qr(vless_link)
                        
                        caption = (
                            f"✅ *Ваш доступ готов!*\n\n"
                            f"👤 Пользователь: `User_{user_id}`\n"
                            f"⏳ Доступ активен ровно 7 дней.\n"
                            f"📱 Лимит: 1 устройство.\n\n"
                            f"🔗 *Ваша ссылка для подключения:*\n"
                            f"`{vless_link}`\n\n"
                            f"Скопируйте ссылку выше или отсканируйте QR-код в приложении (v2rayN, Shadowrocket, Hiddify, NekoBox, Streisand и др.)."
                        )
                        bot.delete_message(call.message.chat.id, msg.message_id)
                        bot.send_photo(call.message.chat.id, qr_image, caption=caption, parse_mode="Markdown")
                    else:
                        bot.edit_message_text("❌ Произошла ошибка при создании подключения в панели.", call.message.chat.id, msg.message_id)
                else:
                    bot.edit_message_text("❌ Ошибка авторизации в панели 3X-UI. Обратитесь к администратору.", call.message.chat.id, msg.message_id)
        conn.close()

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
            
            if user and user['uuid']:
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
            
            if user and user['uuid']:
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
        bot.edit_message_text("🌐 Выберите язык / Choose language:", call.message.chat.id, call.message.message_id, reply_markup=lang_markup)
        
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
            
        topup_markup = types.InlineKeyboardMarkup()
        topup_markup.add(types.InlineKeyboardButton("◀️ Назад", callback_data="account"))
        bot.send_message(call.message.chat.id, "💳 *Пополнение баланса*\n\nВыберите метод оплаты (в разработке).", parse_mode="Markdown", reply_markup=topup_markup)

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
        
    else:
        bot.answer_callback_query(call.id, "Раздел в разработке!", show_alert=False)

if __name__ == '__main__':
    print("Бот запущен...")
    # Long polling и webhook на одном токене взаимоисключающи; сбрасываем webhook (например после register-telegram-webhook на сайте).
    bot.remove_webhook()
    bot.polling(none_stop=True)