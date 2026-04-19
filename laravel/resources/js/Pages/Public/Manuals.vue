<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="messages.manualsPage.metaTitle"
      :description="messages.manualsPage.description"
      :keywords="messages.manualsPage.keywords"
      :og-title="messages.manualsPage.ogTitle"
      :og-description="messages.manualsPage.ogDescription"
      :twitter-title="messages.manualsPage.ogTitle"
      :twitter-description="messages.manualsPage.ogDescription"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
    />
    <main class="min-h-screen flex-grow px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <div class="mx-auto w-full max-w-[1000px]">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />
        <h1 class="mb-10 text-center text-3xl font-extrabold text-dark md:text-4xl">
          {{ messages.manualsPage.heading }}
        </h1>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            v-for="d in devices"
            :key="d.key"
            :href="d.href"
            class="group flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
          >
            <span class="mb-4 text-5xl transition-transform group-hover:scale-110" aria-hidden="true">{{ d.emoji }}</span>
            <span class="text-xl font-extrabold text-dark group-hover:text-primary">{{ d.title }}</span>
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

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
});

const messages = computed(() => publicMessages[props.locale]);

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const manualsBase = computed(() => (props.locale === 'en' ? '/en/manuals' : '/manuals'));

const canonicalUrl = computed(() => {
  const path = manualsBase.value;
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: '/manuals' },
      { hreflang: 'en', href: '/en/manuals' },
      { hreflang: 'x-default', href: '/manuals' },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/manuals` },
    { hreflang: 'en', href: `${b}/en/manuals` },
    { hreflang: 'x-default', href: `${b}/manuals` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const devices = computed(() => {
  const m = messages.value.manualsPage;
  const b = manualsBase.value;
  return [
    { key: 'ios', emoji: '🍏', title: m.deviceIos, href: `${b}/ios` },
    { key: 'android', emoji: '🤖', title: m.deviceAndroid, href: `${b}/android` },
    { key: 'macos', emoji: '🍏', title: m.deviceMacos, href: `${b}/macos` },
    { key: 'windows', emoji: '🖥', title: m.deviceWindows, href: `${b}/windows` },
  ];
});

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  return [
    { href: homeHref, label: b.home },
    { label: b.manuals },
  ];
});
</script>
