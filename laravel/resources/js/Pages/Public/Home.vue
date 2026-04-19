<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="messages.meta.title"
      :description="messages.meta.description"
      :keywords="messages.meta.keywords"
      :og-title="messages.meta.ogTitle"
      :og-description="messages.meta.ogDescription"
      :twitter-title="messages.meta.twitterTitle"
      :twitter-description="messages.meta.twitterDescription"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
      :json-ld="structuredData"
    />
    <div class="bg-amber-500 px-4 py-2 text-center text-sm font-extrabold text-gray-900 md:text-base">
      {{ messages.promo }}
    </div>

    <HeroSlider :slides="messages.heroSlides" :bar="messages.heroBar" :messages="messages" />

    <section class="bg-white py-16 md:py-24" id="about">
      <div class="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-4 md:gap-16 md:px-8 lg:grid-cols-2">
        <div>
          <h2 class="mb-6 text-3xl font-extrabold text-dark md:text-4xl">{{ messages.about?.title }}</h2>
          <p class="mb-6 text-base text-slate-600 md:text-lg">{{ messages.about?.p1 }}</p>
          <p class="mb-8 text-base text-slate-600 md:text-lg">{{ messages.about?.p2 }}</p>
          <div class="flex gap-8 md:gap-12">
            <div class="flex flex-col">
              <span class="mb-1 text-4xl font-black leading-none text-primary">50+</span>
              <span class="text-sm font-bold uppercase tracking-wide text-slate-600">
                {{ messages.about?.statServers }}
              </span>
            </div>
            <div class="flex flex-col">
              <span class="mb-1 text-4xl font-black leading-none text-primary">10к+</span>
              <span class="text-sm font-bold uppercase tracking-wide text-slate-600">
                {{ messages.about?.statClients }}
              </span>
            </div>
            <div class="flex flex-col">
              <span class="mb-1 text-4xl font-black leading-none text-primary">99.9%</span>
              <span class="text-sm font-bold uppercase tracking-wide text-slate-600">
                {{ messages.about?.statUptime }}
              </span>
            </div>
          </div>
        </div>
        <div class="group overflow-hidden rounded-3xl shadow-2xl">
          <img
            :src="'/assets/img/about.jpg'"
            :alt="messages.about?.imageAlt"
            class="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>
    </section>

    <section class="bg-light py-16 md:py-24" id="features">
      <div class="mx-auto max-w-[1200px] px-4 md:px-8">
        <div class="mb-12 text-center md:mb-16">
          <h2 class="mb-4 text-3xl font-extrabold text-dark md:text-4xl">
            {{ messages.featuresSection?.title }}
          </h2>
          <p class="mx-auto max-w-2xl text-base text-slate-600 md:text-lg">
            {{ messages.featuresSection?.subtitle }}
          </p>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <div
            v-for="f in messages.featuresSection?.items"
            :key="f.title"
            class="group rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:shadow-xl"
          >
            <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
              {{ f.icon }}
            </div>
            <h3 class="mb-3 text-xl font-extrabold text-dark">{{ f.title }}</h3>
            <p class="text-slate-600">{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white py-16 md:py-24" id="pricing">
      <div class="mx-auto max-w-[1200px] px-4 md:px-8">
        <h2 class="mb-4 text-center text-3xl font-extrabold text-dark md:text-4xl">
          {{ messages.pricingSection?.title }}
        </h2>
        <p class="mx-auto mb-12 max-w-2xl text-center text-base text-slate-600 md:mb-16 md:text-lg">
          {{ messages.pricingSection?.subtitle }}
        </p>
        <PricingPlanGrid :pricingSection="messages.pricingSection" mode="modal" :messages="messages" />
      </div>
    </section>

    <QuizSection :quiz="messages.quiz" :locale="locale" :messages="messages" />

    <section class="bg-white py-16 md:py-24" id="faq">
      <div class="mx-auto max-w-[800px] px-4 md:px-8">
        <div class="mb-12 text-center">
          <h2 class="mb-4 text-3xl font-extrabold text-dark md:text-4xl">
            {{ messages.faqSection?.title }}
          </h2>
          <p class="text-base text-slate-600 md:text-lg">{{ messages.faqSection?.subtitle }}</p>
        </div>
        <FaqList :items="messages.faqSection?.items || []" />
      </div>
    </section>

    <ReviewsCarousel :title="messages.reviewsSection?.title" :items="messages.reviewsSection?.items || []" />
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import PublicSeoHead from '@/Components/PublicSeoHead.vue';
import { publicMessages } from '@/public/messages';
import HeroSlider from '@/Components/HeroSlider.vue';
import PricingPlanGrid from '@/Components/PricingPlanGrid.vue';
import QuizSection from '@/Components/QuizSection.vue';
import FaqList from '@/Components/FaqList.vue';
import ReviewsCarousel from '@/Components/ReviewsCarousel.vue';

const props = defineProps({ locale: String });
const messages = computed(() => publicMessages[props.locale || 'ru']);

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const canonicalUrl = computed(() => {
  const path = props.locale === 'en' ? '/en' : '/';
  if (!siteBase.value) {
    return path;
  }
  return `${siteBase.value}${path === '/' ? '/' : path}`;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: '/' },
      { hreflang: 'en', href: '/en' },
      { hreflang: 'x-default', href: '/' },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/` },
    { hreflang: 'en', href: `${b}/en` },
    { hreflang: 'x-default', href: `${b}/` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const structuredData = computed(() => {
  const b = siteBase.value || '';
  const m = messages.value;
  const name = `${m.brandPrimary} ${m.brandSecondary}`.trim();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${b}/#website`,
        url: b ? `${b}/` : '/',
        name,
        inLanguage: m.htmlLang,
        description: m.meta.description,
        publisher: { '@id': `${b}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${b}/#organization`,
        name,
        url: b ? `${b}/` : '/',
        sameAs: ['https://t.me/free24_internet_bot'],
      },
    ],
  };
});
</script>
