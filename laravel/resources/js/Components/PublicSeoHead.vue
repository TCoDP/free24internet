<template>
  <Head :title="title">
    <meta head-key="meta:robots" name="robots" :content="robots" />
    <meta head-key="meta:description" name="description" :content="description" />
    <template v-if="keywords">
      <meta head-key="meta:keywords" name="keywords" :content="keywords" />
    </template>

    <meta head-key="og:type" property="og:type" :content="ogType" />
    <meta head-key="og:title" property="og:title" :content="resolvedOgTitle" />
    <meta head-key="og:description" property="og:description" :content="resolvedOgDescription" />
    <meta head-key="og:url" property="og:url" :content="canonicalUrl" />
    <meta head-key="og:locale" property="og:locale" :content="ogLocale" />
    <template v-if="ogLocaleAlternate">
      <meta head-key="og:locale:alternate" property="og:locale:alternate" :content="ogLocaleAlternate" />
    </template>
    <meta head-key="og:image" property="og:image" :content="resolvedOgImage" />

    <meta head-key="twitter:card" name="twitter:card" :content="twitterCard" />
    <meta head-key="twitter:title" name="twitter:title" :content="resolvedTwitterTitle" />
    <meta head-key="twitter:description" name="twitter:description" :content="resolvedTwitterDescription" />

    <link head-key="link:canonical" rel="canonical" :href="canonicalUrl" />

    <template v-for="(alt, i) in alternates" :key="`hreflang-${i}`">
      <link :head-key="`link:alternate:${i}`" rel="alternate" :hreflang="alt.hreflang" :href="alt.href" />
    </template>

    <script v-if="jsonLdSanitized" head-key="ld-json" type="application/ld+json" v-html="jsonLdSanitized" />
  </Head>
</template>

<script setup>
import { computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  keywords: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  ogImage: { type: String, default: '' },
  ogType: { type: String, default: 'website' },
  twitterTitle: { type: String, default: '' },
  twitterDescription: { type: String, default: '' },
  twitterCard: { type: String, default: 'summary_large_image' },
  /** Абсолютный канонический URL (если не задан — base + текущий path Inertia) */
  canonicalUrl: { type: String, default: '' },
  /** hreflang: { hreflang, href } */
  alternates: { type: Array, default: () => [] },
  /** BCP47 для og:locale, напр. ru_RU */
  ogLocale: { type: String, default: 'ru_RU' },
  ogLocaleAlternate: { type: String, default: '' },
  jsonLd: { type: [Object, Array, String], default: null },
  robots: {
    type: String,
    default: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  },
});

const page = usePage();

const siteBase = computed(() => (page.props.site?.base_url ? String(page.props.site.base_url) : '').replace(/\/$/, ''));

const defaultOgImage = computed(() => (page.props.site?.default_og_image ? String(page.props.site.default_og_image) : ''));

const canonicalUrl = computed(() => {
  if (props.canonicalUrl) {
    return props.canonicalUrl;
  }
  const path = page.url || '/';
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!siteBase.value) {
    return normalized;
  }
  return `${siteBase.value}${normalized}`;
});

const resolvedOgTitle = computed(() => props.ogTitle || props.title);
const resolvedOgDescription = computed(() => props.ogDescription || props.description);
const resolvedTwitterTitle = computed(() => props.twitterTitle || resolvedOgTitle.value);
const resolvedTwitterDescription = computed(() => props.twitterDescription || resolvedOgDescription.value);

const resolvedOgImage = computed(() => {
  if (props.ogImage) {
    return props.ogImage;
  }
  if (defaultOgImage.value) {
    return defaultOgImage.value;
  }
  if (siteBase.value) {
    return `${siteBase.value}/assets/img/about.jpg`;
  }
  return '/assets/img/about.jpg';
});

/** JSON-LD: экранируем «<», чтобы не разорвать тег script в HTML */
const jsonLdSanitized = computed(() => {
  if (props.jsonLd == null || props.jsonLd === '') {
    return '';
  }
  const raw = typeof props.jsonLd === 'string' ? props.jsonLd : JSON.stringify(props.jsonLd);
  return raw.replace(/</g, '\\u003c');
});
</script>
