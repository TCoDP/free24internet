<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="a.metaTitle"
      :description="a.description"
      :keywords="a.keywords"
      :og-title="a.ogTitle"
      :og-description="a.ogDescription"
      :twitter-title="a.ogTitle"
      :twitter-description="a.ogDescription"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
    />
    <main class="min-h-screen flex-grow px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <div class="mx-auto w-full max-w-[1400px]">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />
        <h1 class="mb-4 text-center text-3xl font-extrabold text-dark md:text-4xl">
          {{ a.heading }}
        </h1>
        <p class="mx-auto mb-10 max-w-2xl text-center text-base text-slate-600 md:text-lg">
          {{ a.lead }}
        </p>

        <div v-if="articles.length === 0" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
          {{ a.empty }}
        </div>

        <ul v-else class="space-y-4">
          <li v-for="item in articles" :key="item.slug">
            <Link
              :href="articleHref(item.slug)"
              class="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <h2 class="text-xl font-extrabold text-dark hover:text-primary">{{ item.title }}</h2>
              <p v-if="item.excerpt" class="mt-2 text-sm text-slate-600 md:text-base">{{ item.excerpt }}</p>
              <p v-if="item.published_at" class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {{ formatDate(item.published_at) }}
              </p>
            </Link>
          </li>
        </ul>
      </div>
    </main>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import PublicSeoHead from '@/Components/PublicSeoHead.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: { type: String, default: 'ru' },
  articles: { type: Array, default: () => [] },
});

const messages = computed(() => publicMessages[props.locale]);
const a = computed(() => messages.value.articlesIndex);

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const articlesBase = computed(() => (props.locale === 'en' ? '/en/articles' : '/articles'));

const canonicalUrl = computed(() => {
  const path = articlesBase.value;
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: '/articles' },
      { hreflang: 'en', href: '/en/articles' },
      { hreflang: 'x-default', href: '/articles' },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/articles` },
    { hreflang: 'en', href: `${b}/en/articles` },
    { hreflang: 'x-default', href: `${b}/articles` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  return [{ href: homeHref, label: b.home }, { label: b.articles }];
});

function articleHref(slug) {
  return `${articlesBase.value}/${slug}`;
}

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat(props.locale === 'en' ? 'en-GB' : 'ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}
</script>
