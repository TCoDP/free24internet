<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="guide.metaTitle"
      :description="pageDescription"
      :keywords="messages.manualsPage.keywords"
      :og-title="guide.metaTitle"
      :og-description="pageDescription"
      :twitter-title="guide.metaTitle"
      :twitter-description="pageDescription"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
    />
    <main class="min-h-screen flex-grow px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <div class="mx-auto w-full max-w-[900px]">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />

        <div class="mb-6 text-center">
          <Link
            :href="manualsIndexHref"
            class="text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            ← {{ guide.backToList }}
          </Link>
        </div>

        <h1 class="mb-6 text-center text-3xl font-extrabold text-dark md:text-4xl">
          {{ guide.title }}
        </h1>

        <p v-if="guide.intro" class="mx-auto mb-8 max-w-2xl text-center text-base text-slate-600 md:text-lg">
          {{ guide.intro }}
        </p>

        <div v-if="guide.notices?.length" class="mb-10 space-y-3">
          <div
            v-for="(n, idx) in guide.notices"
            :key="idx"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:text-base"
          >
            {{ n }}
          </div>
        </div>

        <div class="space-y-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <section v-for="(step, si) in guide.steps" :key="si" class="border-b border-slate-100 pb-10 last:border-0 last:pb-0">
            <h2 class="mb-4 text-xl font-extrabold text-dark md:text-2xl">
              {{ step.heading }}
            </h2>
            <p
              v-for="(para, pi) in step.paragraphs || []"
              :key="pi"
              class="mb-4 text-base leading-relaxed text-slate-600 last:mb-0"
            >
              {{ para }}
            </p>
            <ul v-if="step.links?.length" class="mb-4 list-none space-y-2">
              <li v-for="(link, li) in step.links" :key="li">
                <a
                  :href="link.href"
                  class="font-semibold text-primary hover:text-primary-hover hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ link.text }}
                </a>
              </li>
            </ul>
            <div v-if="step.images?.length" class="mt-6 space-y-8">
              <figure v-for="(img, ii) in step.images" :key="ii" class="m-0">
                <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
                  <img
                    :src="assetUrl(img.file)"
                    :alt="img.caption || step.heading"
                    class="mx-auto block h-auto w-full max-w-2xl object-contain"
                    loading="lazy"
                  />
                </div>
                <figcaption v-if="img.caption" class="mt-2 text-center text-sm text-slate-500">
                  {{ img.caption }}
                </figcaption>
              </figure>
            </div>
          </section>
        </div>

        <div class="mt-10 text-center">
          <Link
            :href="manualsIndexHref"
            class="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            {{ guide.backToList }}
          </Link>
        </div>
      </div>
    </main>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { usePage, Link } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import PublicSeoHead from '@/Components/PublicSeoHead.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';
import { publicMessages } from '@/public/messages';

function excerpt(text, max = 158) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const one = text.replace(/\s+/g, ' ').trim();
  if (one.length <= max) {
    return one;
  }
  return `${one.slice(0, max - 1).trim()}…`;
}

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  device: {
    type: String,
    required: true,
  },
});

const messages = computed(() => publicMessages[props.locale]);

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const manualsIndexHref = computed(() => (props.locale === 'en' ? '/en/manuals' : '/manuals'));

const guide = computed(() => messages.value.manualsGuide[props.device]);

const pageDescription = computed(() => {
  const g = guide.value;
  const fromIntro = excerpt(g.intro || '');
  if (fromIntro) {
    return fromIntro;
  }
  const p0 = g.steps?.[0]?.paragraphs?.[0];
  return excerpt(typeof p0 === 'string' ? p0 : '') || g.metaTitle;
});

const canonicalUrl = computed(() => {
  const path = props.locale === 'en' ? `/en/manuals/${props.device}` : `/manuals/${props.device}`;
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  const dev = props.device;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: `/manuals/${dev}` },
      { hreflang: 'en', href: `/en/manuals/${dev}` },
      { hreflang: 'x-default', href: `/manuals/${dev}` },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/manuals/${dev}` },
    { hreflang: 'en', href: `${b}/en/manuals/${dev}` },
    { hreflang: 'x-default', href: `${b}/manuals/${dev}` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const assetUrl = (file) => `/assets/manuals/${file}`;

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  return [
    { href: homeHref, label: b.home },
    { href: manualsIndexHref.value, label: b.manuals },
    { label: guide.value.title },
  ];
});
</script>
