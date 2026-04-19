#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Удаляет ранее вставленный блок перед <h2>Частые вопросы</h2> / <h2>FAQ</h2>, начиная с первого <h2> из inserts_*."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "articles"


def first_h2(html: str) -> str | None:
    m = re.search(r"<h2>[^<]+</h2>", html)
    return m.group(0) if m else None


def strip_ru(slug: str) -> None:
    ins_path = ROOT / "inserts_ru" / f"{slug}.html"
    path = ART / f"{slug}.ru.html"
    if not ins_path.is_file() or not path.is_file():
        return
    needle = first_h2(ins_path.read_text(encoding="utf-8"))
    if not needle:
        return
    text = path.read_text(encoding="utf-8")
    if "<h2>Частые вопросы</h2>" not in text:
        return
    pre, rest = text.split("<h2>Частые вопросы</h2>", 1)
    idx = pre.find(needle)
    if idx == -1:
        return
    new_pre = pre[:idx].rstrip()
    path.write_text(new_pre + "\n<h2>Частые вопросы</h2>" + rest, encoding="utf-8")
    print("stripped ru", slug)


def strip_en(slug: str) -> None:
    ins_path = ROOT / "inserts_en" / f"{slug}.html"
    path = ART / f"{slug}.en.html"
    if not ins_path.is_file() or not path.is_file():
        return
    needle = first_h2(ins_path.read_text(encoding="utf-8"))
    if not needle:
        return
    text = path.read_text(encoding="utf-8")
    if "<h2>FAQ</h2>" not in text:
        return
    pre, rest = text.split("<h2>FAQ</h2>", 1)
    idx = pre.find(needle)
    if idx == -1:
        return
    new_pre = pre[:idx].rstrip()
    path.write_text(new_pre + "\n<h2>FAQ</h2>" + rest, encoding="utf-8")
    print("stripped en", slug)


SLUGS = [
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
        strip_ru(s)
        strip_en(s)
