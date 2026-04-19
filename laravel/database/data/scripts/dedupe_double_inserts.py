#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Удаляет вторую копию вставки перед FAQ, если merge выполнился дважды без strip AUTO."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "articles"
INS = ROOT / "inserts_ru"
INS_EN = ROOT / "inserts_en"


def first_h2(html: str) -> str | None:
    m = re.search(r"<h2>[^<]+</h2>", html)
    return m.group(0) if m else None


def dedupe_ru(slug: str) -> None:
    path = ART / f"{slug}.ru.html"
    ins = INS / f"{slug}.html"
    if not path.is_file() or not ins.is_file():
        return
    needle = first_h2(ins.read_text(encoding="utf-8"))
    if not needle:
        return
    text = path.read_text(encoding="utf-8")
    if "<h2>Частые вопросы</h2>" not in text:
        return
    pre, rest = text.split("<h2>Частые вопросы</h2>", 1)
    positions = []
    start = 0
    while True:
        i = pre.find(needle, start)
        if i == -1:
            break
        positions.append(i)
        start = i + 1
    if len(positions) < 2:
        return
    new_pre = pre[: positions[1]].rstrip()
    path.write_text(new_pre + "\n<h2>Частые вопросы</h2>" + rest, encoding="utf-8")
    print("deduped ru", slug)


def dedupe_en(slug: str) -> None:
    path = ART / f"{slug}.en.html"
    ins = INS_EN / f"{slug}.html"
    if not path.is_file() or not ins.is_file():
        return
    needle = first_h2(ins.read_text(encoding="utf-8"))
    if not needle:
        return
    text = path.read_text(encoding="utf-8")
    if "<h2>FAQ</h2>" not in text:
        return
    pre, rest = text.split("<h2>FAQ</h2>", 1)
    positions = []
    start = 0
    while True:
        i = pre.find(needle, start)
        if i == -1:
            break
        positions.append(i)
        start = i + 1
    if len(positions) < 2:
        return
    new_pre = pre[: positions[1]].rstrip()
    path.write_text(new_pre + "\n<h2>FAQ</h2>" + rest, encoding="utf-8")
    print("deduped en", slug)


SLUGS = [
    "vless-guide",
    "vless-vs-vmess",
    "bypass-blocks-2026",
    "how-dpi-works",
    "how-openai-works",
    "chatgpt-for-work",
    "best-ai-tools-2026",
    "local-llm-guide",
    "nodejs-vs-python-2026",
    "how-apis-work",
    "docker-explained-simple",
    "protect-personal-data-online",
    "what-is-vpn-why-need",
    "encryption-explained",
    "choose-vpn-server-hardware",
    "vps-how-many-users",
    "cpu-vs-ram-networking",
]

if __name__ == "__main__":
    for s in SLUGS:
        dedupe_ru(s)
        dedupe_en(s)
