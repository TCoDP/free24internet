"""
Настройки бота из переменных окружения.
Скопируйте vpn_bot/.env.example → vpn_bot/.env и заполните значения.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)


def _require(name: str) -> str:
    v = os.getenv(name)
    if v is None or not str(v).strip():
        raise RuntimeError(
            f"Не задана переменная окружения {name}. Создайте vpn_bot/.env по образцу .env.example."
        )
    return str(v).strip()


BOT_TOKEN = _require("BOT_TOKEN")
PANEL_URL = _require("PANEL_URL").rstrip("/")
PANEL_USER = _require("PANEL_USER")
PANEL_PASS = _require("PANEL_PASS")
PANEL_SECRET = os.getenv("PANEL_SECRET", "").strip()

ADMIN_ID = int(os.getenv("ADMIN_ID", "0") or "0")

DB_HOST = _require("DB_HOST")
DB_USER = _require("DB_USER")
DB_PASS = _require("DB_PASS")
DB_NAME = _require("DB_NAME")

# База с таблицами pricing_* (как у сайта). Пусто = как DB_NAME.
_pdb = os.getenv("PRICING_DB_NAME", "").strip()
PRICING_DB_NAME = _pdb if _pdb else DB_NAME

# Оплата как на сайте (Moneta): публичный URL Next.js + общий секрет с BOT_PAYMENT_SESSION_SECRET на сервере
SITE_API_BASE = os.getenv("SITE_API_BASE", "").strip().rstrip("/")
BOT_PAYMENT_SECRET = os.getenv("BOT_PAYMENT_SECRET", "").strip()

START_PORT = int(os.getenv("START_PORT", "20000") or "20000")
VPN_DOMAIN = _require("VPN_DOMAIN")
