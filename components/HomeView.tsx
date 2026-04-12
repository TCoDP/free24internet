import Image from "next/image";
import type { SiteMessages } from "@/lib/messages/types";
import { TELEGRAM_BOT_URL } from "@/lib/constants";
import { FaqList } from "./FaqList";
import { HeroSlider } from "./HeroSlider";
import { QuizSection } from "./QuizSection";
import { ReviewsCarousel } from "./ReviewsCarousel";

export function HomeView({ messages }: { messages: SiteMessages }) {
  const { pricingSection, featuresSection, about, faqSection, reviewsSection } = messages;

  return (
    <>
      <div className="mt-[72px] bg-amber-500 px-4 py-2 text-center text-sm font-extrabold text-gray-900 md:mt-[76px] md:text-base">
        {messages.promo}
      </div>

      <HeroSlider slides={messages.heroSlides} bar={messages.heroBar} />

      <section className="bg-white py-16 md:py-24" id="about">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 md:gap-16 md:px-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-extrabold text-dark md:text-4xl">{about.title}</h2>
            <p className="mb-6 text-base text-slate-600 md:text-lg">{about.p1}</p>
            <p className="mb-8 text-base text-slate-600 md:text-lg">{about.p2}</p>
            <div className="flex gap-8 md:gap-12">
              <div className="flex flex-col">
                <span className="mb-1 text-4xl font-black leading-none text-primary">50+</span>
                <span className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {about.statServers}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-4xl font-black leading-none text-primary">10к+</span>
                <span className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {about.statClients}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-4xl font-black leading-none text-primary">99.9%</span>
                <span className="text-sm font-bold uppercase tracking-wide text-slate-600">
                  {about.statUptime}
                </span>
              </div>
            </div>
          </div>
          <div className="group overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src="/assets/img/about.jpg"
              alt={about.imageAlt}
              width={1200}
              height={800}
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-light py-16 md:py-24" id="features">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-extrabold text-dark md:text-4xl">
              {featuresSection.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">
              {featuresSection.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            {featuresSection.items.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                  {f.icon}
                </div>
                <h3 className="mb-3 text-xl font-extrabold text-dark">{f.title}</h3>
                <p className="text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24" id="pricing">
        <div className="mx-auto max-w-[1200px] px-4 text-center md:px-8">
          <h2 className="mb-4 text-3xl font-extrabold text-dark md:text-4xl">
            {pricingSection.title}
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-base text-slate-600 md:mb-16 md:text-lg">
            {pricingSection.subtitle}
          </p>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {pricingSection.cards.map((card) => (
              <div
                key={card.title}
                className={`relative flex flex-col rounded-3xl p-8 shadow-md transition-transform hover:-translate-y-2 ${
                  card.highlight
                    ? "scale-100 border-2 border-primary bg-dark text-white shadow-2xl md:scale-105"
                    : "border-2 border-transparent bg-light"
                }`}
              >
                {card.badge ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-6 py-1 text-sm font-extrabold text-white">
                    {card.badge}
                  </div>
                ) : null}
                <h3
                  className={`mb-2 text-2xl font-extrabold ${card.highlight ? "text-white" : "text-dark"}`}
                >
                  {card.title}
                </h3>
                <div
                  className={`mb-2 text-5xl font-black ${card.highlight ? "text-white" : "text-dark"}`}
                >
                  {card.price}
                  <span
                    className={`text-lg font-semibold ${card.highlight ? "text-slate-400" : "text-slate-400"}`}
                  >
                    {card.period}
                  </span>
                </div>
                <p
                  className={`mb-8 text-sm ${card.highlight ? "text-slate-400" : "text-slate-500"}`}
                >
                  {card.blurb}
                </p>
                <ul className="mb-8 flex-grow space-y-4 text-left font-semibold">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-3">
                      <span className="text-xl font-bold text-primary">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={TELEGRAM_BOT_URL}
                  className={`w-full rounded-full py-3.5 text-lg font-extrabold transition-all ${
                    card.highlight
                      ? "bg-white text-dark hover:bg-gray-100"
                      : "animate-pulse-custom bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {card.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuizSection quiz={messages.quiz} locale={messages.locale} />

      <section className="bg-white py-16 md:py-24" id="faq">
        <div className="mx-auto max-w-[800px] px-4 md:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-dark md:text-4xl">
              {faqSection.title}
            </h2>
            <p className="text-base text-slate-600 md:text-lg">{faqSection.subtitle}</p>
          </div>
          <FaqList items={faqSection.items} />
        </div>
      </section>

      <ReviewsCarousel title={reviewsSection.title} items={reviewsSection.items} />
    </>
  );
}
