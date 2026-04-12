"use client";

import { useCallback, useEffect, useState } from "react";
import type { HeroSlide, SiteMessages } from "@/lib/messages/types";
import { TELEGRAM_BOT_URL } from "@/lib/constants";

export function HeroSlider({
  slides,
  bar,
}: {
  slides: HeroSlide[];
  bar: SiteMessages["heroBar"];
}) {
  const [current, setCurrent] = useState(0);

  const go = useCallback((i: number) => {
    setCurrent((i + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative flex min-h-[600px] w-full flex-col bg-dark pb-32 md:h-[calc(100vh-110px)] md:pb-0">
      <div className="relative h-full min-h-[480px] w-full flex-grow">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`hero-slide absolute inset-0 flex items-center bg-cover bg-center pt-10 md:pt-0 ${index === current ? "active" : ""}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/70 to-transparent md:bg-gradient-to-r md:via-gray-900/40" />
            <div className="relative z-20 mx-auto w-full max-w-[1400px] px-4 md:px-8">
              <div className="slide-content-inner max-w-2xl">
                <span className="mb-4 inline-block rounded-full border border-primary bg-primary/10 px-4 py-1.5 text-xs font-extrabold text-primary md:mb-6 md:text-sm">
                  {slide.badge}
                </span>
                <h1 className="mb-4 text-4xl font-black leading-tight text-white md:mb-6 md:text-5xl lg:text-7xl">
                  {slide.title}
                  {slide.titleLine2 ? (
                    <>
                      <br />
                      {slide.titleLine2}
                    </>
                  ) : null}
                </h1>
                <p className="mb-8 text-base text-gray-300 md:mb-10 md:text-lg lg:text-xl">
                  {slide.description}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <a
                    href={TELEGRAM_BOT_URL}
                    className="animate-pulse-custom rounded-full bg-primary px-8 py-3.5 text-center text-base font-extrabold text-white transition-all hover:bg-primary-hover md:text-lg"
                  >
                    {slide.primaryCta}
                  </a>
                  {slide.secondaryCta ? (
                    <a
                      href={TELEGRAM_BOT_URL}
                      className="rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-center text-base font-extrabold text-white transition-all hover:bg-white/20 md:text-lg"
                    >
                      {slide.secondaryCta}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 z-30 w-full border-t border-white/10 bg-gray-900/90 py-4 backdrop-blur-md md:py-6">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-4 px-4 md:px-8 lg:flex-row lg:justify-between lg:gap-0">
          <div className="hidden gap-8 lg:flex xl:gap-12">
            <div className="flex items-center gap-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">
                🛡️
              </div>
              <div className="flex flex-col">
                <strong className="text-sm font-extrabold tracking-wide">{bar.security}</strong>
                <span className="text-xs text-gray-400">{bar.securitySub}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">
                🚀
              </div>
              <div className="flex flex-col">
                <strong className="text-sm font-extrabold tracking-wide">{bar.speed}</strong>
                <span className="text-xs text-gray-400">{bar.speedSub}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">
                ⚖️
              </div>
              <div className="flex flex-col">
                <strong className="text-sm font-extrabold tracking-wide">{bar.prices}</strong>
                <span className="text-xs text-gray-400">{bar.pricesSub}</span>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-8 lg:w-auto">
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-2.5 cursor-pointer rounded-full transition-all ${i === current ? "w-[30px] bg-primary" : "w-2.5 bg-white/30"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(current - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all hover:bg-white hover:text-dark"
              >
                &#10094;
              </button>
              <button
                type="button"
                onClick={() => go(current + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all hover:bg-white hover:text-dark"
              >
                &#10095;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
