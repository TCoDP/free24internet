"use client";

import { useRef } from "react";
import type { SiteMessages } from "@/lib/messages/types";

export function ReviewsCarousel({
  title,
  items,
}: {
  title: string;
  items: SiteMessages["reviewsSection"]["items"];
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="overflow-hidden bg-light py-16 md:py-24" id="reviews">
      <div className="group relative mx-auto max-w-[1200px] px-4 md:px-8">
        <h2 className="mb-12 text-center text-3xl font-extrabold text-dark md:text-4xl">{title}</h2>
        <button
          type="button"
          className="absolute left-4 top-1/2 z-10 mt-6 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-dark opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white focus:outline-none group-hover:opacity-100 md:flex lg:-left-6"
          onClick={() => ref.current?.scrollBy({ left: -350, behavior: "smooth" })}
          aria-label="Previous"
        >
          &#10094;
        </button>
        <button
          type="button"
          className="absolute right-4 top-1/2 z-10 mt-6 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-dark opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white focus:outline-none group-hover:opacity-100 md:flex lg:-right-6"
          onClick={() => ref.current?.scrollBy({ left: 350, behavior: "smooth" })}
          aria-label="Next"
        >
          &#10095;
        </button>
        <div
          ref={ref}
          className="hide-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-8 pt-4 snap-x snap-mandatory md:mx-0 md:gap-8 md:px-0"
        >
          {items.map((r, i) => (
            <div
              key={i}
              className="relative w-[85%] shrink-0 snap-center rounded-3xl bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 sm:w-[350px] md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]"
            >
              <div className="absolute right-6 top-6 font-serif text-6xl leading-none text-primary/10">
                &quot;
              </div>
              <div className="mb-4 text-xl text-amber-500">{r.stars}</div>
              <p className="relative z-10 mb-8 text-slate-600">{r.text}</p>
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-primary ${r.avatarClass ?? ""}`}
                >
                  {r.initial}
                </div>
                <div>
                  <h4 className="font-bold leading-tight text-dark">{r.name}</h4>
                  <span className="text-sm text-slate-400">{r.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
