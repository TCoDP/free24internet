#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Заменяет src в <figure class=\"article-figure\"> на /assets/img/article-topics/{slug}-1..3.jpg по порядку."""
from __future__ import annotations

import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "articles"
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


def replace_figures(html: str, slug: str) -> str:
    imgs = [f"/assets/img/article-topics/{slug}-{i}.jpg" for i in (1, 2, 3)]
    idx = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal idx
        tag = m.group(0)
        if idx >= len(imgs):
            return tag
        new_src = imgs[idx]
        idx += 1
        return re.sub(r'src="[^"]+"', f'src="{new_src}"', tag, count=1)

    return re.sub(
        r'<figure class="article-figure">\s*<img[^>]+>',
        repl,
        html,
        flags=re.IGNORECASE,
    )


def dims_for(slug: str, n: int) -> tuple[int, int] | None:
    from subprocess import run

    laravel = Path(__file__).resolve().parents[3]
    p = laravel / "public" / "assets" / "img" / "article-topics" / f"{slug}-{n}.jpg"
    if not p.is_file():
        return None
    r = run(["file", str(p)], capture_output=True, text=True, check=False)
    # JPEG ... 1680x1120 — не путать с "resolution (DPI), density 72x72"
    dims = [tuple(map(int, t)) for t in re.findall(r"(\d{3,5})\s*x\s*(\d{3,5})", r.stdout)]
    if not dims:
        return 1680, 1120
    return max(dims, key=lambda wh: wh[0] * wh[1])


def patch_dims(html: str, slug: str) -> str:
    def repl_one(m: re.Match[str]) -> str:
        full = m.group(0)
        # extract current src
        sm = re.search(r'src="([^"]+)"', full)
        if not sm:
            return full
        src = sm.group(1)
        base = src.rsplit("/", 1)[-1].replace(".jpg", "")
        # slug-n
        try:
            n = int(base.rsplit("-", 1)[-1])
        except ValueError:
            n = 1
        d = dims_for(slug, n)
        if not d:
            return full
        w, h = d
        full = re.sub(r'width="\d+"', f'width="{w}"', full, count=1)
        full = re.sub(r'height="\d+"', f'height="{h}"', full, count=1)
        return full

    return re.sub(
        r'<figure class="article-figure">\s*<img[^>]+>',
        repl_one,
        html,
        flags=re.IGNORECASE,
    )


def main() -> None:
    for slug in SLUGS:
        for loc in ("ru", "en"):
            path = BASE / f"{slug}.{loc}.html"
            if not path.is_file():
                continue
            text = path.read_text(encoding="utf-8")
            text2 = replace_figures(text, slug)
            text3 = patch_dims(text2, slug)
            if text3 != text:
                path.write_text(text3, encoding="utf-8")
                print("updated", path.name)


if __name__ == "__main__":
    main()
