import Image from "next/image";
import type { SiteMessages } from "@/lib/messages/types";
import type { PricingConfig } from "@/lib/pricing/pricing-config";
import { FaqList } from "./FaqList";
import { HeroSlider } from "./HeroSlider";
import { PricingPlanGrid } from "./PricingPlanGrid";
import { QuizSection } from "./QuizSection";
import { ReviewsCarousel } from "./ReviewsCarousel";

export function HomeView({ messages, pricing }: { messages: SiteMessages; pricing: PricingConfig }) {
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
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <h2 className="mb-4 text-center text-3xl font-extrabold text-dark md:text-4xl">
            {pricingSection.title}
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-base text-slate-600 md:mb-16 md:text-lg">
            {pricingSection.subtitle}
          </p>
          <PricingPlanGrid pricingSection={pricingSection} mode="modal" pricing={pricing} />
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
