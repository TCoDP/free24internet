#!/usr/bin/env python3
"""
Удаляет в 3X-UI старые inbound с remark User_<число> (персональный порт на пользователя).
Общий пул (Shared_VLESS) не трогает.

Запуск на сервере (из каталога vpn_bot):
  python3 cleanup_legacy_user_inbounds.py

Нужен заполненный .env рядом (PANEL_URL, PANEL_USER, PANEL_PASS, опционально PANEL_SECRET).
"""
import re
import sys
from typing import Optional

import requests
import urllib3

import config

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

USER_REMARK = re.compile(r"^User_\d+$")


def panel_login() -> Optional[requests.Session]:
    session = requests.Session()
    login_data = {
        "username": config.PANEL_USER,
        "password": config.PANEL_PASS,
    }
    if getattr(config, "PANEL_SECRET", None):
        login_data["LoginSecret"] = config.PANEL_SECRET
    try:
        r = session.post(
            f"{config.PANEL_URL}/login",
            data=login_data,
            timeout=15,
            verify=False,
        )
        if r.status_code == 200 and r.json().get("success"):
            return session
    except Exception as e:
        print("Login error:", e)
    return None


def main() -> int:
    s = panel_login()
    if not s:
        print("Не удалось войти в панель.")
        return 1
    try:
        r = s.get(
            f"{config.PANEL_URL}/panel/api/inbounds/list",
            timeout=30,
            verify=False,
        )
    except Exception as e:
        print("List error:", e)
        return 1
    if r.status_code != 200:
        print("HTTP", r.status_code, r.text[:500])
        return 1
    js = r.json()
    if not js.get("success"):
        print("Panel:", js)
        return 1
    rows = js.get("obj") or []
    if not isinstance(rows, list):
        print("Unexpected list payload")
        return 1
    deleted = 0
    for ib in rows:
        if not isinstance(ib, dict):
            continue
        remark = str(ib.get("remark") or "").strip()
        if not USER_REMARK.match(remark):
            continue
        iid = ib.get("id")
        if iid is None:
            continue
        try:
            dr = s.post(
                f"{config.PANEL_URL}/panel/api/inbounds/del/{int(iid)}",
                timeout=30,
                verify=False,
            )
        except Exception as e:
            print(f"del {iid} error:", e)
            continue
        ok = dr.status_code == 200 and dr.json().get("success")
        print(f"inbound id={iid} remark={remark!r} -> {'OK' if ok else dr.text[:300]}")
        if ok:
            deleted += 1
    print(f"Done. Removed {deleted} legacy inbound(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
