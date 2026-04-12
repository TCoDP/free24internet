"""
Тарифы из той же схемы, что и на сайте: pricing_global + pricing_plan_terms.
База задаётся PRICING_DB_NAME (если пусто — DB_NAME бота; таблицы должны быть доступны этому пользователю MySQL).
"""
from __future__ import annotations

import logging
from typing import Any

import pymysql

logger = logging.getLogger("vpn_bot")

# Fallback как в lib/pricing/pricing-config DEFAULT_PRICING_CONFIG
_FALLBACK_BASE = 60
_FALLBACK_TERMS: list[tuple[int, float]] = [
    (12, 0.15),
    (6, 0.1),
    (3, 0.05),
    (1, 0.0),
]


def _connect_pricing_db(host: str, user: str, password: str, database: str):
    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        cursorclass=pymysql.cursors.DictCursor,
    )


def load_pricing_plans(
    host: str,
    user: str,
    password: str,
    pricing_db_name: str,
) -> tuple[int, list[dict[str, Any]]]:
    """
    Возвращает (base_monthly_rub, планы).
    Каждый план: months, discount_rate, price_rub, list_rub, label_suffix (для кнопки).
    Сортировка: 12 → 6 → 3 → 1.
    """
    plans: list[dict[str, Any]] = []
    base = _FALLBACK_BASE
    rows: list[Any] = []
    conn = None
    try:
        conn = _connect_pricing_db(host, user, password, pricing_db_name)
        with conn.cursor() as c:
            c.execute(
                "SELECT base_monthly_rub FROM pricing_global WHERE id = 1 LIMIT 1",
            )
            row = c.fetchone()
            if row and row.get("base_monthly_rub") is not None:
                base = int(row["base_monthly_rub"])
            c.execute(
                """
                SELECT months, discount_rate, sort_order
                FROM pricing_plan_terms
                WHERE is_active = 1
                ORDER BY sort_order ASC, months ASC
                """,
            )
            rows = list(c.fetchall() or [])
    except Exception as e:
        logger.warning("pricing DB unavailable (%s), using fallback tariffs", e)
        rows = [
            {"months": m, "discount_rate": d, "sort_order": i * 10}
            for i, (m, d) in enumerate(_FALLBACK_TERMS)
        ]
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    if not rows:
        rows = [
            {"months": m, "discount_rate": d, "sort_order": i * 10}
            for i, (m, d) in enumerate(_FALLBACK_TERMS)
        ]

    for r in rows:
        m = int(r["months"])
        dr = float(r["discount_rate"])
        list_rub = base * m
        price_rub = round(base * m * (1 - dr))
        if m == 12:
            suffix = "макс. выгода"
        elif m == 6:
            suffix = "6 мес"
        elif m == 3:
            suffix = "3 мес"
        else:
            suffix = "1 мес"
        plans.append(
            {
                "months": m,
                "discount_rate": dr,
                "price_rub": price_rub,
                "list_rub": list_rub,
                "label_suffix": suffix,
            },
        )

    plans.sort(key=lambda p: (-p["months"], p["price_rub"]))
    return base, plans


def plan_by_months(plans: list[dict[str, Any]], months: int) -> dict[str, Any] | None:
    for p in plans:
        if p["months"] == months:
            return p
    return None
