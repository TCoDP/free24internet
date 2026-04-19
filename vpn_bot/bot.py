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
import html
import os
import re
import secrets
import string
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
MANUALS_URL = "https://free24internet.vip/manuals"

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


# Если API сайта недоступен — те же суммы, что по умолчанию в Laravel BalanceTopupAmounts.
TOPUP_BALANCE_AMOUNTS_RUB_DEFAULT = (100, 300, 500, 1000, 3000)


def balance_topup_amounts_rub_from_site(tg_id: int, caps: Optional[dict] = None) -> tuple[int, ...]:
    """Суммы пополнения с Laravel /capabilities (как на сайте)."""
    c = caps if caps is not None else fetch_payment_capabilities(tg_id)
    xs = c.get("balanceTopupAmountsRub") if isinstance(c, dict) else None
    if isinstance(xs, list) and xs:
        out: list[int] = []
        for x in xs:
            try:
                n = int(x)
                if n > 0:
                    out.append(n)
            except (TypeError, ValueError):
                continue
        if out:
            return tuple(out)
    return TOPUP_BALANCE_AMOUNTS_RUB_DEFAULT


def _payment_redirect_markup(pay_url: str) -> types.InlineKeyboardMarkup:
    """Оплата только обычной ссылкой: Web App открывает страницу поверх чата — кажется, что выбора не было."""
    kb = types.InlineKeyboardMarkup(row_width=1)
    kb.add(types.InlineKeyboardButton("💳 Перейти к оплате (браузер)", url=pay_url))
    return kb


def _vpn_checkout_provider_keyboard(months: int, caps: dict) -> types.InlineKeyboardMarkup:
    """Способы оплаты тарифа — те же подписи, что при пополнении баланса."""
    kb = types.InlineKeyboardMarkup(row_width=1)
    platega = bool(caps.get("platega"))
    platega_crypto = bool(caps.get("platega_crypto"))
    moneta = bool(caps.get("moneta"))
    if platega and platega_crypto:
        kb.add(
            types.InlineKeyboardButton(
                "Platega — СБП (+11%)",
                callback_data=f"vpn_checkout_platega:{months}",
            )
        )
    elif platega:
        kb.add(
            types.InlineKeyboardButton(
                "Platega",
                callback_data=f"vpn_checkout_platega:{months}",
            )
        )
    if platega_crypto:
        kb.add(
            types.InlineKeyboardButton(
                "Platega — Криптовалюта (+5%)",
                callback_data=f"vpn_checkout_platega_crypto:{months}",
            )
        )
    if moneta:
        kb.add(
            types.InlineKeyboardButton(
                "Moneta — (СБП/ карта)",
                callback_data=f"vpn_checkout_moneta:{months}",
            )
        )
    kb.add(types.InlineKeyboardButton("◀️ Другой срок", callback_data="vpn_checkout_menu"))
    kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
    return kb


def _topup_payment_methods_keyboard(amount: int, caps: dict) -> types.InlineKeyboardMarkup:
    """Подписи кнопок как в личном кабинете (laravel/resources/js/messages/ru.ts — plansPay*)."""
    kb = types.InlineKeyboardMarkup(row_width=1)
    platega = bool(caps.get("platega"))
    platega_crypto = bool(caps.get("platega_crypto"))
    moneta = bool(caps.get("moneta"))
    if platega and platega_crypto:
        kb.add(
            types.InlineKeyboardButton(
                "Platega — СБП (+11%)",
                callback_data=f"topup_platega:{amount}",
            )
        )
    elif platega:
        kb.add(
            types.InlineKeyboardButton(
                "Platega",
                callback_data=f"topup_platega:{amount}",
            )
        )
    if platega_crypto:
        kb.add(
            types.InlineKeyboardButton(
                "Platega — Криптовалюта (+5%)",
                callback_data=f"topup_platega_crypto:{amount}",
            )
        )
    if moneta:
        kb.add(
            types.InlineKeyboardButton(
                "Moneta — (СБП/ карта)",
                callback_data=f"topup_moneta:{amount}",
            )
        )
    kb.add(types.InlineKeyboardButton("◀️ Другая сумма", callback_data="topup"))
    kb.add(types.InlineKeyboardButton("◀️ Назад", callback_data="account"))
    return kb


def _topup_provider_display_label(provider: str, caps: dict) -> str:
    """Текст для сообщения после выбора способа (согласован с кнопками)."""
    platega = bool(caps.get("platega"))
    platega_crypto = bool(caps.get("platega_crypto"))
    if provider == "platega_crypto":
        return "Platega — Криптовалюта (+5%)"
    if provider == "platega":
        if platega and platega_crypto:
            return "Platega — СБП (+11%)"
        return "Platega"
    if provider == "moneta":
        return "Moneta — (СБП/ карта)"
    return provider


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
    if amount_rub not in balance_topup_amounts_rub_from_site(tg_id):
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


def fetch_payment_capabilities(tg_id: int) -> dict:
    """Провайдеры и каталог (суммы пополнения, сроки тарифов) с Laravel /api/internal/bot-payment/capabilities."""
    out = {
        "moneta": False,
        "platega": False,
        "platega_crypto": False,
        "balanceTopupAmountsRub": None,
        "planMonthsAvailable": None,
    }
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return out
    url = f"{base}/api/internal/bot-payment/capabilities"
    try:
        r = requests.post(
            url,
            json={"telegramUserId": tg_id},
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=15,
            verify=True,
        )
        data = r.json()
        if data.get("ok"):
            out["moneta"] = bool(data.get("moneta"))
            out["platega"] = bool(data.get("platega"))
            out["platega_crypto"] = bool(data.get("platega_crypto"))
            xs = data.get("balanceTopupAmountsRub")
            if isinstance(xs, list) and xs:
                out["balanceTopupAmountsRub"] = xs
            pm = data.get("planMonthsAvailable")
            if isinstance(pm, list) and pm:
                out["planMonthsAvailable"] = pm
    except Exception:
        logger.exception("payment capabilities POST failed")
    return out


def fetch_vpn_display_from_site(tg_id: int) -> dict:
    """
    VPN с Laravel (как в кабинете «Тарифы»): vpnAccess, subscriptionImportUrl, primaryShareUrl для QR.
    Нужны SITE_API_BASE и BOT_PAYMENT_SECRET (= BOT_PAYMENT_SESSION_SECRET на сайте).
    Пустой dict при ошибке или если не настроено.
    """
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return {}
    url = f"{base}/api/internal/bot-vpn-display"
    try:
        r = requests.post(
            url,
            json={"telegramUserId": int(tg_id)},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=12,
            verify=True,
        )
        if r.status_code != 200:
            logger.warning("bot-vpn-display HTTP %s for tg_id=%s", r.status_code, tg_id)
            return {}
        data = r.json()
        if not isinstance(data, dict) or not data.get("ok"):
            return {}
        return data
    except Exception:
        logger.exception("bot-vpn-display POST failed for tg_id=%s", tg_id)
        return {}


def _primary_share_or_vless(
    tg_id: int,
    site: Optional[dict],
    client_uuid,
    port,
    short_id,
    user_id,
) -> str:
    """Ссылка для QR/подписи: primaryShareUrl с Laravel или локальный VLESS."""
    if site is None:
        site = fetch_vpn_display_from_site(tg_id)
    primary = (site.get("primaryShareUrl") or "").strip()
    if primary:
        return primary
    return generate_vless_link(client_uuid, port, short_id, user_id)


def _vpn_caption_link_heading(share_link: str) -> str:
    if str(share_link).lower().startswith(("http://", "https://")):
        return "🔗 *Ссылка подписки:*"
    return "🔗 *Ссылка для подключения:*"


def _vpn_share_link_for_tg(tg_id: int, site: Optional[dict] = None) -> Optional[str]:
    """Ссылка на подключение (primaryShareUrl с сайта или VLESS). None — нет активного доступа."""
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
            user = c.fetchone()
        if not user_has_vpn_row(user):
            return None
        short_id = user.get("short_id") or "8c8b17de0242"
        if site is None:
            site = fetch_vpn_display_from_site(tg_id)
        return _primary_share_or_vless(
            tg_id, site, user["uuid"], user["port"], short_id, user["id"]
        )
    finally:
        conn.close()


def request_platega_checkout_url(
    tg_id: int, plan_months: int, use_crypto: bool = False
) -> tuple[Optional[str], str]:
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return None, "not_configured"
    url = f"{base}/api/internal/bot-payment/platega/create-session"
    payload = {"telegramUserId": tg_id, "planMonths": plan_months, "locale": "ru"}
    if use_crypto:
        payload["useCrypto"] = True
    try:
        r = requests.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("platega checkout POST failed")
        return None, "network"
    if r.status_code != 200:
        logger.error("platega checkout POST returned HTTP %s: %s", r.status_code, r.text)
    try:
        data = r.json()
    except Exception:
        logger.exception("platega checkout: failed to parse JSON response: %s", getattr(r, "text", "<no-text>"))
        return None, "server"
    if data.get("ok") and data.get("redirectUrl"):
        return str(data["redirectUrl"]), "ok"
    logger.error("platega checkout: unexpected response: %s", data)
    return None, str(data.get("reason") or "server")


def request_platega_balance_topup_url(
    tg_id: int, amount_rub: int, use_crypto: bool = False
) -> tuple[Optional[str], str]:
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return None, "not_configured"
    if amount_rub not in balance_topup_amounts_rub_from_site(tg_id):
        return None, "validation"
    url = f"{base}/api/internal/bot-payment/platega/create-balance-session"
    payload = {
        "telegramUserId": tg_id,
        "amountRub": int(amount_rub),
        "locale": "ru",
    }
    if use_crypto:
        payload["useCrypto"] = True
    try:
        r = requests.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("platega balance top-up POST failed")
        return None, "network"
    if r.status_code != 200:
        logger.error("platega balance top-up POST returned HTTP %s: %s", r.status_code, r.text)
    try:
        data = r.json()
    except Exception:
        logger.exception("platega balance top-up: failed to parse JSON response: %s", getattr(r, "text", "<no-text>"))
        return None, "server"
    if data.get("ok") and data.get("redirectUrl"):
        return str(data["redirectUrl"]), "ok"
    logger.error("platega balance top-up: unexpected response: %s", data)
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
            f"Не удалось подготовить оплату для этого Telegram. "
            f"Попробуйте позже или зайдите на {site} и привяжите бота в профиле, если входите с почты."
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


_REF_CODE_CHARS = string.ascii_uppercase + string.digits


def _generate_unique_referral_code(cursor) -> str:
    for _ in range(64):
        code = "".join(secrets.choice(_REF_CODE_CHARS) for _ in range(8))
        cursor.execute("SELECT 1 FROM users WHERE referral_code=%s LIMIT 1", (code,))
        if not cursor.fetchone():
            return code
    raise RuntimeError("referral_code")


def _referral_bot_invite_url(code: str) -> Optional[str]:
    """Ссылка для друга: открыть бота с /start ref_<код> (как deep-link Telegram)."""
    u = (getattr(config, "TELEGRAM_BOT_USERNAME", None) or "").strip().lstrip("@")
    if not u or not code:
        return None
    safe = re.sub(r"[^A-Za-z0-9]", "", str(code)).upper()
    if not safe:
        return None
    return f"https://t.me/{u}?start=ref_{safe}"


def try_apply_referral_by_code_for_tg(tg_id: int, code: str) -> tuple[bool, str]:
    """Сохранить referred_by_user_id по реферальному коду (как на сайте). (ok, reason)."""
    code = re.sub(r"[^A-Za-z0-9]", "", (code or "")).upper()
    if not code or len(code) > 32:
        return False, "empty"
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute(
                "SELECT id, referred_by_user_id FROM users WHERE tg_id=%s",
                (tg_id,),
            )
            me = c.fetchone()
            if not me:
                return False, "invalid"
            if me.get("referred_by_user_id"):
                return False, "already"
            my_id = int(me["id"])
            c.execute("SELECT id FROM users WHERE referral_code=%s", (code,))
            ref = c.fetchone()
            if not ref:
                return False, "invalid"
            rid = int(ref["id"])
            if rid == my_id:
                return False, "self"
            c.execute(
                "UPDATE users SET referred_by_user_id=%s WHERE id=%s AND referred_by_user_id IS NULL",
                (rid, my_id),
            )
            conn.commit()
            if c.rowcount == 0:
                return False, "already"
        return True, ""
    finally:
        conn.close()


def _referral_apply_start_notice(ok: bool, reason: str) -> str:
    if ok:
        return "✅ *Код пригласившего сохранён.*\n\n"
    if reason == "already":
        return ""
    if reason == "self":
        return "⚠️ *Нельзя использовать свой реферальный код.*\n\n"
    if reason == "invalid":
        return "⚠️ *Реферальный код не найден.* Проверьте ссылку или попросите код у пригласившего.\n\n"
    return ""


def ensure_referral_bundle_for_tg(tg_id: int) -> tuple[int, str, str, int, int, bool]:
    """Как в кабинете сайта: код, счётчики, язык. referral_code создаём при отсутствии."""
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute(
                "SELECT id, referral_code, language, referred_by_user_id FROM users WHERE tg_id=%s",
                (tg_id,),
            )
            row = c.fetchone()
            if not row:
                c.execute("INSERT IGNORE INTO users (tg_id) VALUES (%s)", (tg_id,))
                conn.commit()
                c.execute(
                    "SELECT id, referral_code, language, referred_by_user_id FROM users WHERE tg_id=%s",
                    (tg_id,),
                )
                row = c.fetchone()
            if not row:
                raise RuntimeError("no_user_row")
            uid = int(row["id"])
            code = row.get("referral_code")
            code = (str(code).strip() if code else "") or None
            lang = (row.get("language") or "ru").strip().lower()
            if not lang:
                lang = "ru"
            referred_by = row.get("referred_by_user_id")
            if not code:
                code = _generate_unique_referral_code(c)
                c.execute("UPDATE users SET referral_code=%s WHERE id=%s", (code, uid))
                conn.commit()
            c.execute(
                "SELECT COUNT(*) AS n FROM users WHERE referred_by_user_id=%s",
                (uid,),
            )
            invited = int((c.fetchone() or {}).get("n") or 0)
            bonus = 0
            try:
                c.execute(
                    "SELECT COALESCE(SUM(bonus_days), 0) AS s FROM referral_rewards WHERE referrer_user_id=%s",
                    (uid,),
                )
                br = c.fetchone()
                if br:
                    bonus = int(br.get("s") or 0)
            except Exception:
                logger.exception("referral_rewards sum failed")
            has_referrer = bool(referred_by)
            return uid, code, lang, invited, bonus, has_referrer
    finally:
        conn.close()


def send_referral_gift_screen(chat_id: int, tg_id: int):
    """Тексты как на странице «Рефералы» сайта (RU/EN по полю users.language). HTML — без ошибок Markdown из-за символов _ *."""
    uid, code, lang, invited, bonus, has_referrer = ensure_referral_bundle_for_tg(tg_id)
    share = _referral_bot_invite_url(code)
    en = lang.startswith("en")

    def esc(s: str) -> str:
        return html.escape(str(s), quote=False)

    if en:
        title = "🎁 Invite a friend"
        blurb = (
            "Share your link or code. When a friend pays for 1 month or longer and enters your code "
            "at checkout in this bot, you get free days — the longer their plan, the more days you receive."
        )
        your_code = "Your referral code"
        share_lbl = "Link for your friend (opens this bot)"
        inv_lbl = "Users registered with your link"
        bonus_lbl = "Bonus days credited (total)"
        table_title = "Your reward after your friend pays"
        rows = [
            "1 month (60₽) — you get +7 days",
            "3 months (171₽, −5%) — you get +12 days",
            "6 months (324₽, −10%) — you get +18 days",
            "12 months (612₽, −15%) — you get +30 days",
        ]
        how = (
            "Your friend opens the link above — the bot starts with your referral saved. "
            "They can also enter your code when paying for a plan in the bot."
        )
        apply_h = "Enter inviter code"
        apply_b = (
            "If someone gave you a code, you can save it once on the website under Account → Referrals "
            "(before your first payment), or open an invite link from a friend."
        )
        linked = "An inviter is already saved on your profile."
        back = "◀️ Back to menu"
        copy_btn = "📋 Copy invite link"
        missing_bot = (
            "\n\n⚠️ Set <code>TELEGRAM_BOT_USERNAME</code> in the bot .env (same as on the site) — "
            "then the invite link will work."
        )
    else:
        title = "🎁 Пригласите друга"
        blurb = (
            "Поделитесь ссылкой или кодом. Когда друг оплатит тариф от 1 месяца и укажет ваш код "
            "при оплате (в боте), вы получите бесплатные дни доступа — чем дольше срок его оплаты, тем больше дней вам начислим."
        )
        your_code = "Ваш реферальный код"
        share_lbl = "Ссылка для друга (открывает этого бота)"
        inv_lbl = "Зарегистрировалось по вашей ссылке"
        bonus_lbl = "Бонусных дней начислено (всего)"
        table_title = "Сколько дней вы получите после оплаты друга"
        rows = [
            "1 месяц (60₽) — вам +7 дней",
            "3 месяца (171₽, −5%) — вам +12 дней",
            "6 месяцев (324₽, −10%) — вам +18 дней",
            "12 месяцев (612₽, −15%) — вам +30 дней",
        ]
        how = (
            "Друг открывает ссылку выше — бот запустится с уже сохранённым приглашением. "
            "Код можно также ввести при оплате тарифа в боте."
        )
        apply_h = "Указать код пригласившего"
        apply_b = (
            "Если вам дали код, сохраните его один раз в личном кабинете на сайте: раздел «Рефералы» "
            "(до первой оплаты) или перейдите по пригласительной ссылке из бота."
        )
        linked = "Пригласивший уже сохранён в профиле."
        back = "◀️ Назад в меню"
        copy_btn = "📋 Скопировать ссылку"
        missing_bot = (
            "\n\n⚠️ В <code>vpn_bot/.env</code> задайте <code>TELEGRAM_BOT_USERNAME</code> (username бота без @, "
            "как на сайте) — тогда появится рабочая ссылка-приглашение."
        )

    parts = [
        f"<b>{esc(title)}</b>",
        "",
        esc(blurb),
        "",
        f"<b>{esc(your_code)}</b>",
        f"<code>{esc(code)}</code>",
        "",
        f"<b>{esc(share_lbl)}</b>",
    ]
    if share:
        parts.append(f'<a href="{html.escape(share, quote=True)}">{esc(share)}</a>')
    else:
        parts.append("—")
    parts.extend(
        [
            "",
            f"📊 <b>{esc(inv_lbl)}</b>: {int(invited)}",
            f"🎁 <b>{esc(bonus_lbl)}</b>: {int(bonus)}",
            "",
            f"<b>{esc(table_title)}</b>",
        ]
    )
    for r in rows:
        parts.append(f"• {esc(r)}")
    parts.extend(["", esc(how), "", f"<b>{esc(apply_h)}</b>", esc(apply_b)])
    if has_referrer:
        parts.extend(["", f"✅ {esc(linked)}"])
    if not share:
        parts.append(missing_bot)
    text = "\n".join(parts)

    kb = types.InlineKeyboardMarkup(row_width=1)
    kb.add(types.InlineKeyboardButton(copy_btn, callback_data="gift_copy_link"))
    kb.add(types.InlineKeyboardButton(back, callback_data="main_menu"))

    bot.send_message(
        chat_id,
        text,
        parse_mode="HTML",
        reply_markup=kb,
        disable_web_page_preview=True,
    )


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def get_site_credential_gaps(tg_id: int) -> tuple[bool, bool]:
    """(need_email, need_password) — что не хватает для входа на сайт."""
    conn = get_db_connection()
    try:
        with conn.cursor() as c:
            c.execute(
                "SELECT email, password_hash FROM users WHERE tg_id=%s",
                (tg_id,),
            )
            row = c.fetchone()
    finally:
        conn.close()
    if not row:
        return True, True
    em = (row.get("email") or "").strip()
    ph = row.get("password_hash") or ""
    has_em = bool(em)
    has_ph = bool(str(ph).strip())
    return (not has_em, not has_ph)


def user_has_site_credentials(tg_id: int) -> bool:
    """Есть ли у пользователя email и пароль для входа на сайт."""
    need_e, need_p = get_site_credential_gaps(tg_id)
    return not need_e and not need_p


def site_login_incomplete(tg_id: int) -> bool:
    """Нужен ли полный вход на сайт для оплат из бота (при подключённом SITE_API)."""
    if not moneta_checkout_configured():
        return False
    need_e, need_p = get_site_credential_gaps(tg_id)
    return need_e or need_p


def notify_site_registration_required(chat_id: int, callback_query_id: Optional[str] = None):
    """
    Единое напоминание: регистрацию завершают через /register или кнопку «Завершить регистрацию».
    Не запускает мастер сам — чтобы оплата и пополнение не уводили в сценарий регистрации.
    """
    if callback_query_id:
        try:
            bot.answer_callback_query(callback_query_id, "Сначала завершите регистрацию")
        except Exception:
            pass
    bot.send_message(
        chat_id,
        "🔒 *Сначала завершите регистрацию*\n\n"
        "Нужны *email* и *пароль* для личного кабинета на сайте.\n"
        "Отправьте команду */register* или нажмите *«Завершить регистрацию»* в меню / профиле.\n\n"
        "Пока регистрация не завершена, недоступны: *пополнение баланса*, *покупка/оплата тарифа* "
        "и другие разделы главного меню (остаются справка, «О нас» и сайт).",
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )


def request_bot_site_register(
    tg_id: int,
    *,
    email: Optional[str] = None,
    password: Optional[str] = None,
) -> tuple[bool, str, Optional[dict]]:
    """POST Laravel /api/internal/bot-register → (ok, reason, errors_dict?)."""
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return False, "not_configured", None
    url = f"{base}/api/internal/bot-register"
    payload: dict = {"telegramUserId": tg_id}
    if email is not None:
        payload["email"] = email
    if password is not None:
        payload["password"] = password
        payload["password_confirmation"] = password
    try:
        r = requests.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("bot-register POST failed")
        return False, "network", None
    try:
        data = r.json()
    except Exception:
        return False, "server", None
    if data.get("ok"):
        return True, "", None
    reason = str(data.get("reason") or "server")
    errs = data.get("errors")
    if isinstance(errs, dict):
        return False, reason, errs
    return False, reason, None


def _parse_start_deep_link_arg(message) -> Optional[str]:
    """Аргумент deep-link t.me/bot?start=… (команда /start TOKEN)."""
    text = (getattr(message, "text", None) or "").strip()
    if not text.startswith("/start"):
        return None
    parts = text.split(maxsplit=1)
    if len(parts) < 2:
        return None
    arg = parts[1].strip()
    if "@" in arg and not arg.startswith("link_"):
        arg = arg.split("@", 1)[0].strip()
    if not arg:
        return None
    return arg.split()[0]


def request_consume_telegram_link(tg_id: int, token: str, tg_user) -> tuple[bool, str]:
    """POST Laravel /api/internal/bot-consume-telegram-link — привязка кабинета на сайте к этому Telegram."""
    base = getattr(config, "SITE_API_BASE", "").strip().rstrip("/")
    secret = getattr(config, "BOT_PAYMENT_SECRET", "").strip()
    if not base or not secret:
        return False, "not_configured"
    url = f"{base}/api/internal/bot-consume-telegram-link"
    payload: dict = {"telegramUserId": tg_id, "token": token}
    uname = getattr(tg_user, "username", None)
    if uname:
        payload["tgUsername"] = str(uname).strip()[:64]
    try:
        r = requests.post(
            url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-Bot-Payment-Secret": secret,
            },
            timeout=25,
            verify=True,
        )
    except Exception:
        logger.exception("bot-consume-telegram-link POST failed")
        return False, "network"
    try:
        data = r.json()
    except Exception:
        return False, "server"
    if data.get("ok"):
        return True, ""
    return False, str(data.get("reason") or "failed")


def _telegram_link_error_text(reason: str) -> str:
    m = {
        "not_configured": "Сервер не настроен для привязки (SITE_API_BASE / BOT_PAYMENT_SECRET).",
        "network": "Нет связи с сайтом. Повторите позже.",
        "server": "Ошибка ответа сайта. Повторите позже.",
        "forbidden": "Ошибка секрета бот↔сайт. Напишите в поддержку.",
        "invalid_token": "Ссылка привязки недействительна. Запросите новую в личном кабинете на сайте.",
        "token_used_or_missing": "Ссылка уже использована или устарела. Откройте кабинет и нажмите «Привязать Telegram» снова.",
        "token_expired": "Срок ссылки истёк. Откройте кабинет на сайте и сгенерируйте новую.",
        "account_has_other_telegram": "Этот аккаунт на сайте уже привязан к другому Telegram.",
        "telegram_bound_to_other_account": "Этот Telegram уже привязан к другому аккаунту на сайте (с логином). Напишите в поддержку, если это вы.",
        "failed": "Не удалось привязать. Попробуйте снова из личного кабинета.",
    }
    return m.get(reason, "Не удалось привязать аккаунт. Попробуйте снова из личного кабинета или напишите в поддержку.")


def _humanize_validation_fragment(msg: str, field: str) -> str:
    """Laravel без lang/validation может отдавать ключи вида validation.unique — показываем по-русски."""
    s = (msg or "").strip()
    if not s:
        return "Проверьте введённые данные."
    if s.startswith("validation.") or s in _LARAVEL_VALIDATION_KEYS:
        if field == "email" and s in ("validation.unique", "unique"):
            return "Этот email уже занят — введите другой."
        if field == "email" and s in ("validation.email", "email"):
            return "Некорректный формат email."
        if field == "password" and s in ("validation.confirmed", "confirmed"):
            return "Пароль и подтверждение не совпадают."
        if field == "password" and "min" in s:
            return "Пароль слишком короткий (минимум 8 символов)."
        return _LARAVEL_VALIDATION_KEYS.get(s, s)
    return s


_LARAVEL_VALIDATION_KEYS = {
    "validation.unique": "Значение уже занято.",
    "validation.email": "Некорректный формат.",
    "validation.required": "Обязательное поле.",
    "validation.confirmed": "Подтверждение не совпадает.",
    "validation.min.string": "Слишком короткая строка.",
}


def _format_validation_errors(errs: dict) -> str:
    lines = []
    for k, v in (errs or {}).items():
        if isinstance(v, list) and v:
            for item in v:
                lines.append(f"• {k}: {_humanize_validation_fragment(str(item), k)}")
        elif isinstance(v, str):
            lines.append(f"• {k}: {_humanize_validation_fragment(v, k)}")
    return "\n".join(lines) if lines else "Проверьте email и пароль."


def _send_register_error(message_chat_id: int, reason: str, errs: Optional[dict]):
    if reason == "already_registered":
        bot.send_message(message_chat_id, "У вас уже есть вход на сайт — откройте «Вход».")
        return
    if reason == "validation" and errs:
        bot.send_message(
            message_chat_id,
            "❌ Проверка на сервере:\n" + _format_validation_errors(errs),
        )
        return
    if reason == "not_configured":
        bot.send_message(message_chat_id, "Сервер не настроен. Напишите в поддержку.")
        return
    if reason == "forbidden":
        bot.send_message(message_chat_id, "Ошибка секрета бот↔сайт. Напишите в поддержку.")
        return
    bot.send_message(message_chat_id, f"❌ Ошибка: {reason}")


def begin_site_register_wizard(chat_id: int, tg_user):
    """Те же данные, что на странице регистрации сайта: email и пароль (дозапрос только недостающего)."""
    if not moneta_checkout_configured():
        bot.send_message(
            chat_id,
            "❌ Регистрация с бота недоступна: задайте SITE_API_BASE и BOT_PAYMENT_SECRET "
            "(те же переменные, что для оплат).",
        )
        return
    if user_has_site_credentials(tg_user.id):
        bot.send_message(
            chat_id,
            "✅ У вас уже есть *email и пароль* для входа на сайт.\n"
            "Кабинет: https://free24internet.vip/account",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        return
    need_email, need_password = get_site_credential_gaps(tg_user.id)
    if need_email and need_password:
        msg = bot.send_message(
            chat_id,
            "📝 *Регистрация для сайта*\n\n"
            "*Шаг 1 из 3.* Введите *email*.",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        bot.register_next_step_handler(msg, register_wizard_email_full, tg_user)
        return
    if need_email and not need_password:
        msg = bot.send_message(
            chat_id,
            "📝 *Дозаполнение для сайта*\n\n"
            "В базе уже есть пароль для входа, но не указан *email*.\n\n"
            "Введите *email* для входа в кабинет на сайте.",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        bot.register_next_step_handler(msg, register_wizard_email_only, tg_user)
        return
    if need_password and not need_email:
        msg = bot.send_message(
            chat_id,
            "📝 *Дозаполнение для сайта*\n\n"
            "Уже указан *email*, но не задан *пароль* для входа на сайте.\n\n"
            "*Шаг 1 из 2.* Придумайте пароль (не короче 8 символов).",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        bot.register_next_step_handler(msg, register_wizard_password_partial, tg_user)
        return


def register_wizard_email_full(message, tg_user):
    email = (getattr(message, "text", None) or "").strip().lower()
    if not EMAIL_RE.match(email):
        msg = bot.reply_to(message, "Похоже, это не email. Повторите ввод.")
        bot.register_next_step_handler(msg, register_wizard_email_full, tg_user)
        return
    msg = bot.send_message(
        message.chat.id,
        "✅ Email принят.\n\n"
        "*Шаг 2 из 3.* Придумайте *пароль* (не короче 8 символов).",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, register_wizard_password_full, tg_user, email)


def register_wizard_password_full(message, tg_user, email: str):
    pw = getattr(message, "text", None) or ""
    if len(pw) < 8:
        msg = bot.reply_to(message, "Минимум 8 символов. Введите пароль ещё раз.")
        bot.register_next_step_handler(msg, register_wizard_password_full, tg_user, email)
        return
    msg = bot.send_message(
        message.chat.id,
        "*Шаг 3 из 3.* Повторите тот же пароль.",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, register_wizard_confirm_full, tg_user, email, pw)


def register_wizard_confirm_full(message, tg_user, email: str, password: str):
    if (getattr(message, "text", None) or "") != password:
        bot.send_message(
            message.chat.id,
            "❌ Пароли не совпали. Начните снова: /register",
        )
        return
    ok, reason, errs = request_bot_site_register(
        tg_user.id, email=email, password=password
    )
    if ok:
        bot.send_message(
            message.chat.id,
            "✅ *Регистрация выполнена*\n\n"
            f"Логин: `{email}`\n\n"
            "Аккаунт привязан к этому Telegram.\n"
            "Кабинет: https://free24internet.vip/account",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        send_main_menu(message.chat.id, tg_user.id)
        return
    _send_register_error(message.chat.id, reason, errs)


def register_wizard_email_only(message, tg_user):
    email = (getattr(message, "text", None) or "").strip().lower()
    if not EMAIL_RE.match(email):
        msg = bot.reply_to(message, "Похоже, это не email. Повторите ввод.")
        bot.register_next_step_handler(msg, register_wizard_email_only, tg_user)
        return
    ok, reason, errs = request_bot_site_register(tg_user.id, email=email)
    if ok:
        bot.send_message(
            message.chat.id,
            "✅ *Email сохранён*\n\n"
            f"Логин: `{email}`\n\n"
            "Кабинет: https://free24internet.vip/account",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        send_main_menu(message.chat.id, tg_user.id)
        return
    _send_register_error(message.chat.id, reason, errs)


def register_wizard_password_partial(message, tg_user):
    pw = getattr(message, "text", None) or ""
    if len(pw) < 8:
        msg = bot.reply_to(message, "Минимум 8 символов. Введите пароль ещё раз.")
        bot.register_next_step_handler(msg, register_wizard_password_partial, tg_user)
        return
    msg = bot.send_message(
        message.chat.id,
        "*Шаг 2 из 2.* Повторите тот же пароль.",
        parse_mode="Markdown",
    )
    bot.register_next_step_handler(msg, register_wizard_confirm_partial, tg_user, pw)


def register_wizard_confirm_partial(message, tg_user, password: str):
    if (getattr(message, "text", None) or "") != password:
        bot.send_message(
            message.chat.id,
            "❌ Пароли не совпали. Начните снова: /register",
        )
        return
    ok, reason, errs = request_bot_site_register(tg_user.id, password=password)
    if ok:
        bot.send_message(
            message.chat.id,
            "✅ *Пароль для сайта сохранён*\n\n"
            "Аккаунт привязан к этому Telegram.\n"
            "Кабинет: https://free24internet.vip/account",
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )
        send_main_menu(message.chat.id, tg_user.id)
        return
    _send_register_error(message.chat.id, reason, errs)


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


def _panel_inbounds_list(session):
    try:
        r = session.get(
            f"{config.PANEL_URL}/panel/api/inbounds/list",
            timeout=15,
            verify=False,
        )
    except Exception:
        logger.exception("inbounds list failed")
        return None
    if r.status_code != 200:
        return None
    try:
        js = r.json()
    except Exception:
        return None
    if not js.get("success"):
        return None
    obj = js.get("obj")
    return obj if isinstance(obj, list) else None


def _inbound_settings_dict(inbound):
    raw = inbound.get("settings")
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    if isinstance(raw, dict):
        return raw
    return None


def _extract_short_id_from_inbound_dict(inbound):
    raw = inbound.get("streamSettings")
    if isinstance(raw, str):
        try:
            stream = json.loads(raw)
        except json.JSONDecodeError:
            return "8c8b17de0242"
    elif isinstance(raw, dict):
        stream = raw
    else:
        return "8c8b17de0242"
    ids = stream.get("realitySettings", {}).get("shortIds") or []
    if ids and isinstance(ids[0], str) and ids[0]:
        return ids[0]
    return "8c8b17de0242"


def _find_shared_inbound(inbounds, port: int, remark: str):
    remark = (remark or "").strip()
    for ib in inbounds:
        if not isinstance(ib, dict):
            continue
        p = ib.get("port")
        if p is None or int(p) != int(port):
            continue
        if str(ib.get("remark") or "").strip() == remark:
            return ib
    return None


def _inbound_on_port_foreign(inbounds, port: int, expected_remark: str):
    """Inbound на порту, но с другим remark — порт занят не тем профилем."""
    for ib in inbounds:
        if not isinstance(ib, dict):
            continue
        p = ib.get("port")
        if p is None or int(p) != int(port):
            continue
        if str(ib.get("remark") or "").strip() != str(expected_remark).strip():
            return ib
    return None


def create_shared_pool_inbound(session, first_bot_user_id: int, duration_seconds: Optional[int] = None):
    """
    Первый inbound общего пула (один порт, remark Shared_VLESS).
    Возвращает (client_uuid, expire_time_ms, short_id) или (None, None, None).
    """
    if duration_seconds is None:
        duration_seconds = 7 * 24 * 60 * 60
    port = int(config.SHARED_VLESS_PORT)
    remark = getattr(config, "SHARED_INBOUND_REMARK", "Shared_VLESS")
    client_uuid = str(uuid.uuid4())
    expire_time = int((time.time() + duration_seconds) * 1000)
    short_id = os.urandom(8).hex()
    client_settings = {
        "id": client_uuid,
        "flow": "xtls-rprx-vision",
        "email": str(first_bot_user_id),
        "limitIp": 1,
        "totalGB": 0,
        "expiryTime": expire_time,
        "enable": True,
        "tgId": "",
        "subId": "",
    }
    payload = {
        "up": 0,
        "down": 0,
        "total": 0,
        "remark": remark,
        "enable": True,
        "expiryTime": expire_time,
        "listen": "",
        "port": port,
        "protocol": "vless",
        "settings": json.dumps({
            "clients": [client_settings],
            "decryption": "none",
            "fallbacks": [],
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
                    "spiderX": "/",
                },
            },
            "tcpSettings": {
                "acceptProxyProtocol": False,
                "header": {"type": "none"},
            },
        }),
        "sniffing": json.dumps({
            "enabled": True,
            "destOverride": ["http", "tls"],
        }),
        "allocate": json.dumps({
            "strategy": "always",
            "refresh": 5,
            "concurrency": 3,
        }),
    }
    try:
        response = session.post(
            f"{config.PANEL_URL}/panel/api/inbounds/add",
            json=payload,
            timeout=15,
            verify=False,
        )
        if response.status_code == 200 and response.json().get("success"):
            return client_uuid, expire_time, short_id
        print(f"Ошибка добавления общего Inbound: {response.text}")
    except Exception as e:
        print(f"Ошибка добавления общего Inbound: {e}")
    return None, None, None


def add_client_to_shared_inbound(session, inbound_id: int, bot_user_id: int, duration_seconds: int):
    """
    POST /panel/api/inbounds/addClient — новый клиент в существующем inbound.
    Возвращает (client_uuid, expire_time_ms, err_text).
    """
    client_uuid = str(uuid.uuid4())
    expire_time = int((time.time() + duration_seconds) * 1000)
    client_settings = {
        "id": client_uuid,
        "flow": "xtls-rprx-vision",
        "email": str(bot_user_id),
        "limitIp": 1,
        "totalGB": 0,
        "expiryTime": expire_time,
        "enable": True,
        "tgId": "",
        "subId": "",
    }
    payload = {
        "id": inbound_id,
        "settings": json.dumps({"clients": [client_settings]}),
    }
    try:
        r = session.post(
            f"{config.PANEL_URL}/panel/api/inbounds/addClient",
            json=payload,
            timeout=15,
            verify=False,
        )
        if r.status_code == 200 and r.json().get("success"):
            return client_uuid, expire_time, None
        return None, None, (r.text or "addClient failed")[:500]
    except Exception as e:
        logger.exception("addClient failed")
        return None, None, str(e)


def sync_bot_user_on_shared_inbound(
    session,
    bot_user_id: int,
    existing_uuid: Optional[str],
    duration_sec: int,
    is_renewal: bool,
):
    """
    Один общий порт (SHARED_VLESS_PORT): продление по UUID, привязка по email = id строки в БД бота,
    иначе новый клиент. Возвращает (uuid, expire_ms, short_id, err_text).
    """
    port = int(config.SHARED_VLESS_PORT)
    remark = getattr(config, "SHARED_INBOUND_REMARK", "Shared_VLESS")
    max_c = int(getattr(config, "SHARED_INBOUND_MAX_CLIENTS", 100))
    inbounds = _panel_inbounds_list(session)
    if inbounds is None:
        return None, None, None, "Не удалось связаться с панелью (список inbound)."
    inbound = _find_shared_inbound(inbounds, port, remark)
    if inbound is None:
        foreign = _inbound_on_port_foreign(inbounds, port, remark)
        if foreign is not None:
            return (
                None,
                None,
                None,
                f"Порт {port} занят inbound «{foreign.get('remark', '')}». "
                f"Освободите порт или задайте другой SHARED_VLESS_PORT / переименуйте inbound в «{remark}».",
            )
        cu, exp, sid = create_shared_pool_inbound(session, bot_user_id, duration_sec)
        if not cu:
            return None, None, None, "Не удалось создать общий inbound в панели."
        return cu, exp, sid, None

    inbound_id = inbound.get("id")
    if inbound_id is None:
        return None, None, None, "У общего inbound нет id в панели."
    short_id = _extract_short_id_from_inbound_dict(inbound)
    settings = _inbound_settings_dict(inbound)
    if settings is None:
        return None, None, None, "Не удалось разобрать настройки inbound."
    clients = settings.get("clients") or []
    if not isinstance(clients, list):
        clients = []

    for cl in clients:
        if not isinstance(cl, dict):
            continue
        if str(cl.get("email") or "").strip() != str(bot_user_id):
            continue
        cid = str(cl.get("id") or "").strip()
        if not cid:
            continue
        new_exp, err = extend_inbound_client_subscription(session, port, cid, duration_sec)
        if err:
            return None, None, None, err
        return cid, new_exp, short_id, None

    eu = (existing_uuid or "").strip().lower()
    if is_renewal and eu:
        for cl in clients:
            if not isinstance(cl, dict):
                continue
            cid = str(cl.get("id") or "").strip().lower()
            if cid == eu:
                new_exp, err = extend_inbound_client_subscription(session, port, existing_uuid, duration_sec)
                if err:
                    return None, None, None, err
                return existing_uuid, new_exp, short_id, None

    if len(clients) >= max_c:
        return (
            None,
            None,
            None,
            f"На общем VPN сейчас максимум {max_c} подключений. Напишите в поддержку.",
        )
    cu, exp, err = add_client_to_shared_inbound(session, int(inbound_id), bot_user_id, duration_sec)
    if err:
        return None, None, None, f"Панель: не удалось добавить клиента ({err})."
    return cu, exp, short_id, None


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


# Подпись узла в VLESS (#fragment) — как в Laravel config('vpn.vless_display_name')
VLESS_DISPLAY_NAME = "🇳🇱 Нидерланды"


def generate_vless_link(client_uuid, port, short_id, user_id):
    """Генерация VLESS ссылки для подключения (Reality)"""
    ip = getattr(config, 'VPN_DOMAIN', "185.216.87.152")
    pbk = "VrMFfSvBarPYCL9BvVin31qyKnUrowgFBm_8okubhUc"
    sni = "yahoo.com"
    fp = "chrome"
    spx = urllib.parse.quote("/")
    flow = "xtls-rprx-vision"
    name = urllib.parse.quote(VLESS_DISPLAY_NAME)
    
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

        em = (user.get("email") or "").strip()
        ph = user.get("password_hash") or ""
        has_pw = bool(str(ph).strip())
        if user_has_site_credentials(tg_id):
            site_line = f"\n📧 *Сайт:* `{em}` — вход в кабинет настроен."
        elif em and not has_pw:
            site_line = (
                "\n📝 *Сайт:* указан email — задайте пароль для входа "
                "(/register или регистрация на https://free24internet.vip/register)."
            )
        elif has_pw and not em:
            site_line = (
                "\n📝 *Сайт:* пароль задан — укажите *email* для входа в кабинет "
                "(напишите в поддержку или https://free24internet.vip/register)."
            )
        else:
            site_line = (
                "\n📝 *Сайт:* вход в кабинет ещё не настроен — "
                "зарегистрируйтесь: https://free24internet.vip/register"
            )
        gate_hint = ""
        if site_login_incomplete(tg_id):
            gate_hint = (
                "\n\n🔐 *Сначала завершите регистрацию* — команда /register. "
                "Пока регистрация не завершена, *пополнение баланса* в профиле недоступно."
            )
        text = (
            f"👤 *Ваш профиль*\n\n"
            f"💵 Баланс: `{balance} ₽`\n"
            f"🌐 Язык: `{lang}`"
            f"{site_line}"
            f"{gate_hint}"
        )

        profile_markup = types.InlineKeyboardMarkup(row_width=1)
        if site_login_incomplete(tg_id):
            profile_markup.add(
                types.InlineKeyboardButton(
                    "📝 Завершить регистрацию (/register)",
                    callback_data="finish_site_register",
                )
            )
        else:
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

def get_inline_menu(tg_id: Optional[int] = None):
    """Инлайн-меню главного экрана. При незавершённой регистрации — только завершение регистрации и справка."""
    if tg_id is not None and site_login_incomplete(tg_id):
        markup = types.InlineKeyboardMarkup(row_width=1)
        markup.add(
            types.InlineKeyboardButton(
                "📝 Завершить регистрацию (/register)",
                callback_data="finish_site_register",
            )
        )
        markup.add(types.InlineKeyboardButton("⚙️ Аккаунт", callback_data="account"))
        markup.add(types.InlineKeyboardButton("🆘 Помощь", callback_data="help"))
        markup.add(types.InlineKeyboardButton("👥 О нас", callback_data="about"))
        markup.add(types.InlineKeyboardButton("💻 Наш сайт", url="https://free24internet.vip"))
        markup.add(types.InlineKeyboardButton("📖 Инструкция", url=MANUALS_URL))
        return markup

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
    btn_manual = types.InlineKeyboardButton("📖 Инструкция", url=MANUALS_URL)

    markup.add(btn1, btn2)
    markup.add(btn3, btn4)
    markup.add(btn5, btn6)
    markup.add(btn8, btn9)
    markup.add(btn_website, btn_manual)

    return markup

def send_main_menu(chat_id: int, tg_id: Optional[int] = None):
    """Отправка сообщения с главным меню (tg_id для приватного чата совпадает с chat_id)."""
    if tg_id is None:
        tg_id = chat_id
    text = (
        "🌍 Свободный Интернет — ваш надежный проводник в мир безопасности!\n\n"
        "⚡️ Высокая скорость — смотрите видео в 4K без задержек.\n"
        "🔒 Конфиденциальность — надежное шифрование ваших данных.\n"
        "📱 Любые устройства — работает на iOS, Android, Windows и macOS.\n\n"
        "Обеспечьте себе стабильность и защиту. Подключайтесь в 1 клик и наслаждайтесь безопасным интернетом!"
    )
    if site_login_incomplete(tg_id):
        text += (
            "\n\n🔐 *Завершите регистрацию* (/register), чтобы открыть покупку доступа, "
            "«Мои услуги», пополнение баланса и подарки."
        )

    menu_kb = get_inline_menu(tg_id)
    cached_photo_id = _read_menu_photo_id()
    if cached_photo_id:
        try:
            bot.send_photo(chat_id, cached_photo_id, caption=text, reply_markup=menu_kb, parse_mode="Markdown")
            return
        except Exception:
            _write_menu_photo_id(None)

    try:
        with open("vpn_menu.png", "rb") as photo:
            msg = bot.send_photo(chat_id, photo, caption=text, reply_markup=menu_kb, parse_mode="Markdown")
            try:
                if getattr(msg, "photo", None):
                    _write_menu_photo_id(msg.photo[-1].file_id)
            except Exception:
                pass
    except Exception as e:
        print(f"Ошибка отправки фото: {e}")
        bot.send_message(chat_id, text, reply_markup=menu_kb, parse_mode="Markdown")

@bot.message_handler(commands=['start'])
def start_message(message):
    link_arg = _parse_start_deep_link_arg(message)
    tg_user = message.from_user
    if link_arg and link_arg.startswith("link_"):
        ok, reason = request_consume_telegram_link(tg_user.id, link_arg, tg_user)
        ensure_user_from_telegram(tg_user)
        if ok:
            bot.send_message(
                message.chat.id,
                "✅ *Telegram привязан* к аккаунту на сайте.\n\n"
                "Баланс и тарифы — одна учётная запись в боте и в кабинете.",
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
        else:
            bot.send_message(
                message.chat.id,
                _telegram_link_error_text(reason),
                disable_web_page_preview=True,
            )
        send_main_menu(message.chat.id, tg_user.id)
        return

    ensure_user_from_telegram(tg_user)

    ref_notice = ""
    if link_arg and link_arg.lower().startswith("ref_"):
        raw_code = link_arg[4:].strip()
        ok_ref, rsn_ref = try_apply_referral_by_code_for_tg(tg_user.id, raw_code)
        ref_notice = _referral_apply_start_notice(ok_ref, rsn_ref)

    bot.send_message(
        message.chat.id,
        ref_notice
        + "👋 *Добро пожаловать!*\n\n"
        "Я бот для выдачи персонального безопасного доступа.\n\n"
        "Продолжая использование бота, вы принимаете [Пользовательское соглашение](https://free24internet.vip/terms) и [Политику конфиденциальности](https://free24internet.vip/privacy).\n\n"
        "Используйте кнопку ниже для открытия главного меню 👇",
        reply_markup=get_main_menu(),
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )
    send_main_menu(message.chat.id, tg_user.id)


@bot.message_handler(commands=['menu'])
def menu_command(message):
    """Повторно открыть главное меню (удобно, если инлайн-кнопки «зависли»)."""
    ensure_user_from_telegram(message.from_user)
    send_main_menu(message.chat.id, message.from_user.id)


@bot.message_handler(commands=['register'])
def register_command(message):
    """Регистрация для личного кабинета на сайте (email и пароль в чате, как раньше)."""
    ensure_user_from_telegram(message.from_user)
    begin_site_register_wizard(message.chat.id, message.from_user)


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
    send_main_menu(message.chat.id, message.from_user.id)


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


def _vpn_tariff_payment_markup(months: int, price_rub: int, bal: int, tg_id: int) -> types.InlineKeyboardMarkup:
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
    if moneta_checkout_configured():
        caps = fetch_payment_capabilities(tg_id)
        if caps.get("platega") and caps.get("platega_crypto"):
            kb.add(
                types.InlineKeyboardButton(
                    "Platega — СБП (+11%)",
                    callback_data=f"vpn_checkout_platega:{months}",
                ),
            )
        elif caps.get("platega"):
            kb.add(
                types.InlineKeyboardButton(
                    "Platega",
                    callback_data=f"vpn_checkout_platega:{months}",
                ),
            )
        if caps.get("platega_crypto"):
            kb.add(
                types.InlineKeyboardButton(
                    "Platega — Криптовалюта (+5%)",
                    callback_data=f"vpn_checkout_platega_crypto:{months}",
                ),
            )
        if caps.get("moneta"):
            kb.add(
                types.InlineKeyboardButton(
                    "Moneta — (СБП/ карта)",
                    callback_data=f"vpn_checkout_moneta:{months}",
                ),
            )
    kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
    return kb


def _send_vpn_tariff_payment_offer(chat_id, tg_id: int, months, price_rub, bal, will_renew: bool):
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
    )
    bot.send_message(
        chat_id,
        text,
        parse_mode="Markdown",
        reply_markup=_vpn_tariff_payment_markup(months, price_rub, bal, tg_id),
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
                    _send_vpn_tariff_payment_offer(chat_id, tg_id, months, price_rub, bal, renew)
                    return

            shared_port = int(config.SHARED_VLESS_PORT)
            existing_uuid = str(user.get("uuid") or "").strip() if renew else ""

            if renew:
                did_renew = True
                if not existing_uuid:
                    bot.edit_message_text(
                        "❌ В базе бота нет идентификатора ключа. Напишите в поддержку.",
                        chat_id,
                        progress.message_id,
                    )
                    return
                client_uuid, expire_time, short_id, sync_err = sync_bot_user_on_shared_inbound(
                    session,
                    user_id,
                    existing_uuid,
                    duration_sec,
                    is_renewal=True,
                )
                if sync_err:
                    bot.edit_message_text(
                        f"❌ {sync_err}",
                        chat_id,
                        progress.message_id,
                    )
                    return
                port = shared_port

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
            else:
                client_uuid, expire_time, short_id, sync_err = sync_bot_user_on_shared_inbound(
                    session,
                    user_id,
                    None,
                    duration_sec,
                    is_renewal=False,
                )
                if sync_err:
                    bot.edit_message_text(
                        f"❌ {sync_err}",
                        chat_id,
                        progress.message_id,
                    )
                    return
                port = shared_port
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

    share_link = _primary_share_or_vless(tg_id, None, client_uuid, port, short_id, user_id)
    qr_image = generate_qr(share_link)
    dur_txt = human_duration_ru(duration_sec)
    paid_line = f"💰 Списано с баланса: `{price_rub} ₽`\n" if price_rub else ""
    expire_h = datetime.fromtimestamp(expire_time / 1000).strftime("%d.%m.%Y %H:%M")
    link_heading = _vpn_caption_link_heading(share_link)
    if did_renew:
        caption = (
            f"✅ *Подписка продлена!*\n\n"
            f"➕ Добавлено: *{dur_txt}*\n"
            f"📅 Новая дата окончания: `{expire_h}`\n"
            f"{paid_line}\n"
            f"{link_heading}\n`{share_link}`\n\n"
            f"Скопируйте ссылку или отсканируйте QR."
        )
    else:
        caption = (
            f"✅ *Доступ готов!*\n\n"
            f"⏳ Срок: *{dur_txt}*\n"
            f"📅 До: `{expire_h}`\n"
            f"{paid_line}\n"
            f"{link_heading}\n`{share_link}`\n\n"
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
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
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
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id)
        if not moneta_checkout_configured():
            bot.send_message(
                call.message.chat.id,
                "💳 Онлайн-оплата из бота не подключена. "
                "Оплатите с баланса в боте или обратитесь в поддержку.",
            )
            return
        _, plans = get_pricing_bundle()
        intro = (
            "💳 *Оплата*\n\n"
            "Способы оплаты — *как в личном кабинете на сайте* (Platega; Moneta — только у отмеченных аккаунтов).\n\n"
            "Подписка продлится *в общей базе* (и на сайте, и в боте). "
            "Ключ VPN в боте по-прежнему выдаётся и продлевается с *баланса бота*.\n\n"
            "Шаг 1 — выберите *срок*, затем откроется выбор *способа оплаты*."
        )
        cm = types.InlineKeyboardMarkup(row_width=1)
        for p in plans:
            m = int(p["months"])
            cm.add(
                types.InlineKeyboardButton(
                    tariff_button_label(p),
                    callback_data=f"vpn_co_month:{m}",
                )
            )
        cm.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
        bot.send_message(call.message.chat.id, intro, parse_mode="Markdown", reply_markup=cm)

    elif call.data.startswith("vpn_co_month:"):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        try:
            co_m = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректные данные", show_alert=True)
            return
        _, plans_co = get_pricing_bundle()
        co_plan = pricing_db.plan_by_months(plans_co, co_m)
        if not co_plan:
            bot.answer_callback_query(call.id, "Тариф недоступен", show_alert=True)
            return
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        caps = fetch_payment_capabilities(tg_id)
        pr = int(co_plan["price_rub"])
        bot.answer_callback_query(call.id)
        step2 = (
            "💳 *Оплата*\n\n"
            f"Тариф: *{co_m} мес.* — *{pr} ₽*\n\n"
            "Шаг 2 — выберите способ оплаты:"
        )
        bot.send_message(
            call.message.chat.id,
            step2,
            parse_mode="Markdown",
            reply_markup=_vpn_checkout_provider_keyboard(co_m, caps),
        )

    elif (
        call.data.startswith("vpn_checkout_platega_crypto:")
        or call.data.startswith("vpn_checkout_platega:")
        or call.data.startswith("vpn_checkout_moneta:")
        or call.data.startswith("vpn_checkout:")
    ):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        try:
            if call.data.startswith("vpn_checkout_platega_crypto:"):
                provider = "platega_crypto"
                co_months = int(call.data.split(":", 1)[1])
            elif call.data.startswith("vpn_checkout_platega:"):
                provider = "platega"
                co_months = int(call.data.split(":", 1)[1])
            elif call.data.startswith("vpn_checkout_moneta:"):
                provider = "moneta"
                co_months = int(call.data.split(":", 1)[1])
            else:
                provider = "moneta"
                co_months = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректные данные", show_alert=True)
            return
        _, plans = get_pricing_bundle()
        co_plan = pricing_db.plan_by_months(plans, co_months)
        if not co_plan:
            bot.answer_callback_query(call.id, "Тариф недоступен", show_alert=True)
            return
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id)
        if provider == "platega_crypto":
            pay_url, reason = request_platega_checkout_url(tg_id, co_months, use_crypto=True)
        elif provider == "platega":
            pay_url, reason = request_platega_checkout_url(tg_id, co_months, use_crypto=False)
        else:
            pay_url, reason = request_moneta_checkout_url(tg_id, co_months)
        if pay_url:
            pay_kb = _payment_redirect_markup(pay_url)
            pay_kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
            pr = int(co_plan["price_rub"])
            caps_co = fetch_payment_capabilities(tg_id)
            prov_label = _topup_provider_display_label(provider, caps_co)
            bot.send_message(
                call.message.chat.id,
                f"💳 *Оплата*\n*{prov_label}*\n*Тариф:* {co_months} мес. — *{pr} ₽*\n\n"
                "Нажмите кнопку ниже — откроется *внешний браузер*. "
                "Способ вы уже выбрали выше; на стороне банка могут быть дополнительные шаги (СБП, карта и т.д.).\n\n"
                "После оплаты подписка на сайте обновится автоматически.",
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
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
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

        if price_rub > 0 and site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return

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
                tg_id,
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

    elif call.data == "finish_site_register":
        bot.answer_callback_query(call.id)
        begin_site_register_wizard(call.message.chat.id, call.from_user)

    elif call.data == "site_register":
        bot.answer_callback_query(call.id)
        if user_has_site_credentials(tg_id):
            bot.send_message(
                call.message.chat.id,
                "✅ У вас уже есть *email и пароль* для входа на сайт.\n"
                "Кабинет: https://free24internet.vip/account",
                parse_mode="Markdown",
                disable_web_page_preview=True,
            )
        else:
            begin_site_register_wizard(call.message.chat.id, call.from_user)

    elif call.data == "my_services":
        if site_login_incomplete(tg_id):
            conn_gate = get_db_connection()
            try:
                with conn_gate.cursor() as c:
                    c.execute("SELECT * FROM users WHERE tg_id=%s", (tg_id,))
                    user_gate = c.fetchone()
            finally:
                conn_gate.close()
            if not user_has_vpn_row(user_gate):
                notify_site_registration_required(call.message.chat.id, call.id)
                return
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
                site = fetch_vpn_display_from_site(tg_id)
                share_link = _vpn_share_link_for_tg(tg_id, site=site)
                if not share_link:
                    bot.send_message(call.message.chat.id, "❌ Услуга не найдена.", parse_mode="Markdown")
                    conn.close()
                    return
                expire_date = None
                va = site.get("vpnAccess") if isinstance(site, dict) else None
                if isinstance(va, dict):
                    vvpn = va.get("vpn")
                    if isinstance(vvpn, dict) and vvpn.get("expiresAt"):
                        try:
                            exp_iso = str(vvpn["expiresAt"]).replace("Z", "+00:00")
                            expire_date = datetime.fromisoformat(exp_iso).strftime("%d.%m.%Y %H:%M")
                        except Exception:
                            expire_date = None
                if not expire_date:
                    expire_date = datetime.fromtimestamp(
                        user["expire_time"] / 1000
                    ).strftime("%d.%m.%Y %H:%M")
                qr_image = generate_qr(share_link)
                link_heading = _vpn_caption_link_heading(share_link)

                caption = (
                    f"🛡 *Услуга: Доступ*\n\n"
                    f"⏳ Истекает: `{expire_date}`\n\n"
                    f"{link_heading}\n"
                    f"`{share_link}`"
                )
                
                vpn_markup = types.InlineKeyboardMarkup(row_width=1)
                vpn_markup.add(types.InlineKeyboardButton("📋 Скопировать ссылку", callback_data="vpn_copy_link"))
                vpn_markup.add(types.InlineKeyboardButton("📖 Инструкция", url=MANUALS_URL))
                vpn_markup.add(types.InlineKeyboardButton("◀️ Назад к услугам", callback_data="my_services"))
                
                bot.send_photo(call.message.chat.id, qr_image, caption=caption, parse_mode="Markdown", reply_markup=vpn_markup)
            else:
                bot.send_message(call.message.chat.id, "❌ Услуга не найдена.", parse_mode="Markdown")
        conn.close()

    elif call.data == "vpn_copy_link":
        bot.answer_callback_query(call.id)
        share_link = _vpn_share_link_for_tg(tg_id)
        if not share_link:
            bot.send_message(
                call.message.chat.id,
                "❌ Услуга не найдена.",
                parse_mode="Markdown",
            )
        else:
            copy_msg = (
                "<b>Ссылка для подключения</b>\n\n<code>"
                + html.escape(share_link, quote=False)
                + "</code>\n\n"
                "Долгое нажатие на сообщение → «Копировать»."
            )
            bot.send_message(call.message.chat.id, copy_msg, parse_mode="HTML")

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
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id)
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass

        topup_markup = types.InlineKeyboardMarkup(row_width=2)
        if moneta_checkout_configured():
            caps = fetch_payment_capabilities(tg_id)
            amounts_list = list(balance_topup_amounts_rub_from_site(tg_id, caps))
            for i in range(0, len(amounts_list), 2):
                chunk = amounts_list[i : i + 2]
                topup_markup.row(
                    *[
                        types.InlineKeyboardButton(
                            f"{a} ₽",
                            callback_data=f"topup_amount:{a}",
                        )
                        for a in chunk
                    ]
                )
        topup_markup.add(types.InlineKeyboardButton("◀️ Назад", callback_data="account"))
        intro = (
            "💳 *Пополнение баланса*\n\n"
            "Деньги зачислятся на баланс аккаунта.\n"
        )
        if moneta_checkout_configured():
            intro += (
                "Сумма зачислится на баланс после оплаты.\n\n"
                "Сначала выберите *сумму*, затем — способ оплаты."
            )
        else:
            intro += (
                "Онлайн-оплата из бота сейчас не подключена на сервере "
                "(SITE_API_BASE и BOT_PAYMENT_SECRET в настройках бота)."
            )
        bot.send_message(call.message.chat.id, intro, parse_mode="Markdown", reply_markup=topup_markup)

    elif call.data.startswith("topup_amount:"):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        try:
            amt = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        if amt not in balance_topup_amounts_rub_from_site(tg_id):
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        caps = fetch_payment_capabilities(tg_id)
        bot.answer_callback_query(call.id)
        step2 = (
            "💳 *Пополнение баланса*\n\n"
            f"Сумма: *{amt} ₽*\n\n"
            "Выберите способ оплаты:"
        )
        bot.send_message(
            call.message.chat.id,
            step2,
            parse_mode="Markdown",
            reply_markup=_topup_payment_methods_keyboard(amt, caps),
        )

    elif (
        call.data.startswith("topup_platega_crypto:")
        or call.data.startswith("topup_platega:")
        or call.data.startswith("topup_moneta:")
    ):
        if not moneta_checkout_configured():
            bot.answer_callback_query(call.id, "Онлайн-оплата не настроена.", show_alert=True)
            return
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        try:
            if call.data.startswith("topup_platega_crypto:"):
                provider = "platega_crypto"
            elif call.data.startswith("topup_platega:"):
                provider = "platega"
            else:
                provider = "moneta"
            amt = int(call.data.split(":", 1)[1])
        except (ValueError, IndexError):
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        if amt not in balance_topup_amounts_rub_from_site(tg_id):
            bot.answer_callback_query(call.id, "Некорректная сумма", show_alert=True)
            return
        bot.answer_callback_query(call.id)
        if provider == "platega_crypto":
            pay_url, reason = request_platega_balance_topup_url(tg_id, amt, use_crypto=True)
        elif provider == "platega":
            pay_url, reason = request_platega_balance_topup_url(tg_id, amt, use_crypto=False)
        else:
            pay_url, reason = request_moneta_balance_topup_url(tg_id, amt)
        if pay_url:
            pay_kb = _payment_redirect_markup(pay_url)
            pay_kb.add(types.InlineKeyboardButton("◀️ В меню", callback_data="main_menu"))
            caps_pay = fetch_payment_capabilities(tg_id)
            prov_label = _topup_provider_display_label(provider, caps_pay)
            bot.send_message(
                call.message.chat.id,
                f"💳 *Пополнение баланса*\n*{prov_label}*\n*Сумма:* *{amt} ₽*\n\n"
                "Нажмите кнопку ниже — оплата откроется *во внешнем браузере*.\n\n"
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
        send_main_menu(call.message.chat.id, tg_id)

    elif call.data == "help":
        bot.answer_callback_query(call.id)
        
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except Exception:
            pass
            
        help_intro = ""
        if site_login_incomplete(tg_id):
            help_intro = (
                "🔐 Сначала выполните */register* (email и пароль для кабинета) — "
                "тогда в меню появятся покупка доступа и пополнение баланса.\n\n"
            )
        help_text = (
            f"{help_intro}"
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
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id, "Раздел «Прокси» в разработке.", show_alert=True)

    elif call.data == "gift":
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id)
        ensure_user_from_telegram(call.from_user)
        try:
            try:
                bot.delete_message(call.message.chat.id, call.message.message_id)
            except Exception:
                pass
            send_referral_gift_screen(call.message.chat.id, tg_id)
        except Exception:
            logger.exception("gift / referral screen")
            bot.send_message(
                call.message.chat.id,
                "❌ Не удалось открыть раздел «Подари другу». Попробуйте позже или откройте "
                "раздел «Рефералы» в личном кабинете на сайте.",
            )

    elif call.data == "gift_copy_link":
        if site_login_incomplete(tg_id):
            notify_site_registration_required(call.message.chat.id, call.id)
            return
        bot.answer_callback_query(call.id)
        ensure_user_from_telegram(call.from_user)
        try:
            _, code, lang, _, _, _ = ensure_referral_bundle_for_tg(tg_id)
            share = _referral_bot_invite_url(code)
            en = (lang or "").lower().startswith("en")
            if not share:
                bot.send_message(
                    call.message.chat.id,
                    (
                        "⚠️ Ссылка недоступна: в <code>vpn_bot/.env</code> задайте <code>TELEGRAM_BOT_USERNAME</code>."
                        if not en
                        else "⚠️ Link unavailable: set <code>TELEGRAM_BOT_USERNAME</code> in the bot .env."
                    ),
                    parse_mode="HTML",
                )
                return
            if not en:
                copy_msg = (
                    "<b>Ссылка для друга</b>\n\n<code>"
                    + html.escape(share, quote=False)
                    + "</code>\n\n"
                    "Долгое нажатие на сообщение → «Копировать»."
                )
            else:
                copy_msg = (
                    "<b>Invite link</b>\n\n<code>"
                    + html.escape(share, quote=False)
                    + "</code>\n\n"
                    "Tap and hold the message, then choose «Copy»."
                )
            bot.send_message(call.message.chat.id, copy_msg, parse_mode="HTML")
        except Exception:
            logger.exception("gift_copy_link")
            bot.send_message(call.message.chat.id, "❌ Не удалось получить ссылку.")

    else:
        bot.answer_callback_query(call.id, "Раздел в разработке.", show_alert=True)

if __name__ == '__main__':
    # Смените строку при правках оплаты — по логу видно, что процесс перезапущен.
    print("Бот запущен (оплата: только url-кнопка «в браузере», выбор суммы/способа в чате)…")
    # Long polling и webhook на одном токене взаимоисключающи; сбрасываем webhook (например после register-telegram-webhook на сайте).
    bot.remove_webhook()
    # Явно запрашиваем callback_query (после webhook у Telegram мог остаться узкий allowed_updates).
    bot.polling(
        none_stop=True,
        skip_pending=True,
        allowed_updates=["message", "edited_message", "callback_query"],
    )