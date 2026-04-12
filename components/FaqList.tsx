"use client";

import { useState } from "react";

export function FaqList({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => {
        const active = open === i;
        return (
          <div
            key={i}
            className={`faq-item cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-light transition-colors hover:border-primary/30 ${active ? "active" : ""}`}
          >
            <button
              type="button"
              className="faq-question flex w-full items-center justify-between p-6 text-left text-lg font-extrabold text-dark md:p-8 md:text-xl"
              onClick={() => setOpen(active ? null : i)}
            >
              {item.q}
            </button>
            <div className="faq-answer px-6 text-slate-600 md:px-8">{item.a}</div>
          </div>
        );
      })}
    </div>
  );
}
