<template>
  <div class="min-h-screen font-sans text-slate-700 bg-light flex flex-col">
    <!-- SiteHeader -->
    <header class="fixed top-0 z-[1000] w-full bg-gray-900/95 shadow-lg backdrop-blur-md">
      <nav class="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 md:gap-4 md:px-8">
        <Link
          :href="homeHref"
          class="flex shrink-0 items-center gap-2 text-xl font-black text-white md:text-2xl"
        >
          <span class="text-primary">{{ messages.brandPrimary || messages.brand?.primary }}</span>
          {{ messages.brandSecondary || messages.brand?.secondary }}
        </Link>

        <div class="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
          <Link :href="`${base}/#about`" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.about }}</Link>
          <Link :href="`${base}/#features`" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.features }}</Link>
          <Link :href="`${base}/#pricing`" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.pricing }}</Link>
          <Link :href="`${base}/#faq`" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.faq }}</Link>
          <Link :href="manualsHref" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.manuals }}</Link>
          <Link :href="articlesHref" class="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.nav.articles }}</Link>
        </div>

        <div class="hidden shrink-0 items-center gap-3 md:gap-5 lg:flex">
          <div v-if="user" class="flex items-center gap-4 border-r border-slate-600/80 pr-4 md:pr-5">
            <Link :href="accountHref" class="whitespace-nowrap text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.auth?.accountTitle || 'Личный кабинет' }}</Link>
            <Link v-if="user.is_admin" :href="adminHref" class="whitespace-nowrap text-sm font-bold text-amber-400 transition-colors hover:text-amber-200">{{ messages.adminPanel?.title || 'Админ-панель' }}</Link>
          </div>
          <div v-else class="flex items-center gap-4 border-r border-slate-600/80 pr-4 md:pr-5">
            <Link :href="loginHref" class="whitespace-nowrap text-sm font-semibold text-gray-300 transition-colors hover:text-white">{{ messages.auth?.loginTitle || 'Вход' }}</Link>
            <Link :href="registerHref" class="whitespace-nowrap text-sm font-bold text-primary transition-colors hover:text-white">{{ messages.auth?.registerTitle || 'Регистрация' }}</Link>
          </div>

          <div class="group relative">
            <button type="button" class="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-300 transition-colors hover:text-white">
              {{ locale === 'ru' ? 'RU' : 'EN' }}
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="invisible absolute right-0 z-50 mt-2 w-32 origin-top-right scale-95 rounded-xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition-all duration-300 group-hover:visible group-hover:scale-100 group-hover:opacity-100">
              <div class="flex flex-col gap-1">
                <Link href="/" :class="['flex items-center justify-between rounded-lg px-3 py-2 text-sm', locale === 'ru' ? 'bg-slate-50 font-bold text-primary' : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary']">
                  {{ messages.nav.langRu || 'Русский' }}
                  <span class="text-base">🇷🇺</span>
                </Link>
                <Link href="/en" :class="['flex items-center justify-between rounded-lg px-3 py-2 text-sm', locale === 'en' ? 'bg-slate-50 font-bold text-primary' : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary']">
                  {{ messages.nav.langEn || 'English' }}
                  <span class="text-base">🇬🇧</span>
                </Link>
              </div>
            </div>
          </div>
          
          <a href="https://t.me/free24_internet_bot" target="_blank" class="animate-pulse-custom shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-hover hover:-translate-y-0.5 md:px-6">
            {{ messages.nav.connect || 'Подключиться' }}
          </a>
        </div>

        <button type="button" class="p-2 text-white lg:hidden" @click="menuOpen = true" :aria-expanded="menuOpen" aria-controls="mobile-nav-dialog" aria-label="Menu">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </header>

    <div
      id="mobile-nav-dialog"
      :class="['mobile-nav-drawer fixed inset-0 z-[1001] flex flex-col overflow-y-auto bg-white pb-8 pt-[env(safe-area-inset-top)] lg:hidden', menuOpen ? 'pointer-events-auto' : 'pointer-events-none']"
      :style="{ transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)' }"
      :aria-hidden="!menuOpen"
      :role="menuOpen ? 'dialog' : undefined"
      :aria-modal="menuOpen ? true : undefined"
      :aria-label="menuOpen ? 'Menu' : undefined"
    >
        <div class="mb-2 mt-2 flex items-center justify-between border-b border-slate-200 p-4">
          <Link
            :href="homeHref"
            @click="closeMobile"
            class="flex items-center gap-2 pl-2 text-xl font-black text-dark"
          >
            <span class="text-primary">{{ messages.brandPrimary || messages.brand?.primary }}</span>
            {{ messages.brandSecondary || messages.brand?.secondary }}
          </Link>
          <button
            type="button"
            class="mr-2 flex items-center justify-center rounded-lg border-2 border-amber-500 bg-white p-1.5 text-slate-800 transition-all hover:bg-slate-50"
            @click="closeMobile"
            aria-label="Close menu"
          >
            <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="mt-2 flex flex-col px-6">
          <Link :href="`${base}/#about`" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.about || 'О компании' }}</Link>
          <Link :href="`${base}/#features`" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.features || 'Преимущества' }}</Link>
          <Link :href="`${base}/#pricing`" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.pricing || 'Цены' }}</Link>
          <Link :href="`${base}/#reviews`" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.reviews || 'Отзывы' }}</Link>
          <Link :href="`${base}/#faq`" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.faq || 'FAQ' }}</Link>
          <Link :href="manualsHref" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.manuals || messages.nav?.manuals || 'Инструкции' }}</Link>
          <Link :href="articlesHref" @click="closeMobile" class="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary">{{ messages.mobileNav?.articles || messages.nav?.articles || 'Статьи' }}</Link>
        </div>
        <div class="mt-4 flex flex-col gap-3 border-t border-slate-200 px-6 pt-6">
            <template v-if="user">
              <Link :href="accountHref" @click="closeMobile" class="rounded-xl bg-slate-100 py-4 text-center text-lg font-bold text-dark transition-colors hover:bg-slate-200">
                {{ messages.auth?.accountTitle || 'Личный кабинет' }}
              </Link>
              <Link v-if="user.is_admin" :href="adminHref" @click="closeMobile" class="rounded-xl border-2 border-amber-500 py-4 text-center text-lg font-bold text-amber-800 transition-colors hover:bg-amber-50">
                {{ messages.adminPanel?.title || 'Админ-панель' }}
              </Link>
            </template>
            <template v-else>
              <Link :href="loginHref" @click="closeMobile" class="rounded-xl border-2 border-slate-200 py-4 text-center text-lg font-bold text-dark transition-colors hover:border-primary hover:text-primary">
                {{ messages.auth?.loginTitle || 'Вход' }}
              </Link>
              <Link :href="registerHref" @click="closeMobile" class="rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-md transition-colors hover:bg-primary-hover">
                {{ messages.auth?.registerTitle || 'Регистрация' }}
              </Link>
            </template>
        </div>
        <div class="mt-auto flex flex-col px-6 pt-8">
          <div class="mb-8 flex items-center justify-center gap-4">
            <Link href="/" @click="closeMobile" :class="['flex items-center gap-2 rounded-lg px-4 py-2', locale === 'ru' ? 'bg-slate-100 font-bold text-primary' : 'font-semibold text-slate-600 hover:bg-slate-50']">
              <span class="text-xl">🇷🇺</span> RU
            </Link>
            <Link href="/en" @click="closeMobile" :class="['flex items-center gap-2 rounded-lg px-4 py-2', locale === 'en' ? 'bg-slate-100 font-bold text-primary' : 'font-semibold text-slate-600 hover:bg-slate-50']">
              <span class="text-xl">🇬🇧</span> EN
            </Link>
          </div>
          <div class="mb-6 flex items-center gap-3">
            <Link
              :href="accountTicketsHref"
              @click="closeMobile"
              class="flex items-center gap-3 text-xl font-extrabold text-dark transition-colors hover:text-primary"
            >
              <svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ messages.mobileNav?.support || 'Поддержка' }}
            </Link>
          </div>
          <a href="https://t.me/free24_internet_bot" @click="closeMobile" class="w-full rounded-xl bg-[#991b1b] py-4 text-center text-lg font-bold text-white shadow-md transition-all hover:bg-[#7f1d1d]">
            {{ messages.mobileNav?.connect || 'Подключиться' }}
          </a>
        </div>
    </div>

    <!-- Main Content -->
    <main class="flex-grow pt-[72px] md:pt-[76px]">
      <slot />
    </main>

    <!-- SiteFooter -->
    <footer class="bg-[#111418] pt-16 text-gray-300 pb-[max(3.5rem,calc(2rem+env(safe-area-inset-bottom,0px)))] md:pb-[max(4.5rem,calc(2rem+env(safe-area-inset-bottom,0px)))]">
      <div class="mx-auto max-w-[1400px] px-4 md:px-8">
        <div class="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link :href="homeHref" class="mb-4 flex items-center gap-2 text-2xl font-black text-white">
              <span class="text-primary">{{ messages.brandPrimary || messages.brand?.primary }}</span>
              {{ messages.brandSecondary || messages.brand?.secondary }}
            </Link>
            <p class="mb-6 max-w-xs leading-relaxed text-gray-400">{{ messages.footer?.tagline || messages.footer }}</p>
            <div class="flex gap-4">
              <a href="https://t.me/free24_internet_bot" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all hover:-translate-y-1 hover:bg-white/15">
                <svg class="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.19.27-.39.75-.59 2.95-1.28 4.91-2.13 5.89-2.53 2.79-1.15 3.37-1.35 3.76-1.36.09 0 .28.02.39.11.09.07.12.18.13.26 0 .04.01.12.01.19z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 class="mb-6 text-lg font-bold text-white">{{ messages.footer?.menu || 'Меню' }}</h4>
            <ul class="space-y-4">
              <li><Link :href="homeHref" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.home || 'Главная' }}</Link></li>
              <li><Link :href="`${base}/#about`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.about || 'О компании' }}</Link></li>
              <li><Link :href="`${base}/#pricing`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.pricing || 'Цены' }}</Link></li>
              <li><Link :href="`${base}/#reviews`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.reviews || 'Отзывы' }}</Link></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-6 text-lg font-bold text-white">{{ messages.footer?.services || 'Услуги' }}</h4>
            <ul class="space-y-4">
              <li><Link :href="`${base}/#features`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.s1 || 'Защита в сетях' }}</Link></li>
              <li><Link :href="`${base}/#features`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.s2 || 'Личный кабинет' }}</Link></li>
              <li><Link :href="`${base}/#features`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.s3 || 'Сверхбыстрые сервера' }}</Link></li>
              <li><Link :href="`${base}/#features`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.s4 || 'Тарифы и оплата' }}</Link></li>
            </ul>
          </div>
          <div>
            <h4 class="mb-6 text-lg font-bold text-white">{{ messages.footer?.support || 'Поддержка' }}</h4>
            <ul class="space-y-4">
              <li><a href="https://t.me/free24_internet_bot" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.bot || 'Бот-ассистент' }}</a></li>
              <li><Link :href="accountTicketsHref" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.contact || 'Написать в поддержку' }}</Link></li>
              <li><Link :href="`${base}/#faq`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.faq || 'Вопросы и ответы' }}</Link></li>
              <li><Link :href="`${base}/#quiz`" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.helpChoice || 'Помощь с выбором' }}</Link></li>
              <li><Link :href="manualsHref" class="text-gray-400 transition-colors hover:text-primary">{{ messages.footer?.manuals || 'Инструкции' }}</Link></li>
              <li><Link :href="articlesHref" class="text-gray-400 transition-colors hover:text-primary">{{ messages.nav?.articles || 'Статьи' }}</Link></li>
            </ul>
          </div>
        </div>
        <div class="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p>{{ messages.footer?.copyright || '© 2026 Свободный Интернет. Все права защищены.' }}</p>
          <div class="flex flex-wrap justify-center gap-6">
            <Link :href="privacyHref" class="transition-colors hover:text-white">{{ messages.footer?.privacy || 'Политика конфиденциальности' }}</Link>
            <Link :href="termsHref" class="transition-colors hover:text-white">{{ messages.footer?.terms || 'Пользовательское соглашение' }}</Link>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const props = defineProps({ locale: String, messages: Object });

const page = usePage();
const user = computed(() => page.props.auth?.user);

const base = computed(() => props.locale === 'en' ? '/en' : '');
const homeHref = computed(() => base.value || '/');
const loginHref = computed(() => `${base.value}/login`);
const registerHref = computed(() => `${base.value}/register`);
const accountHref = computed(() => `${base.value}/account/profile`);
/** Раздел «Поддержка» в личном кабинете (заявки); маршрут без префикса /en */
const accountTicketsHref = '/account/tickets';
const adminHref = computed(() => `${base.value}/admin`);
const privacyHref = computed(() => props.locale === 'en' ? '/en/privacy' : '/privacy');
const termsHref = computed(() => props.locale === 'en' ? '/en/terms' : '/terms');
const manualsHref = computed(() => props.locale === 'en' ? '/en/manuals' : '/manuals');
const articlesHref = computed(() => props.locale === 'en' ? '/en/articles' : '/articles');

const menuOpen = ref(false);

const closeMobile = () => {
  menuOpen.value = false;
};

watch(menuOpen, (val) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : '';
  }
});

watch(
  () => props.messages?.htmlLang,
  (lang) => {
    if (typeof document !== 'undefined' && lang) {
      document.documentElement.lang = lang;
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>
