<template>
  <Head>
    <meta head-key="meta:robots:account" name="robots" content="noindex, nofollow" />
  </Head>
  <PublicLayout :locale="locale" :messages="messages">
    <div class="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-light px-4 pb-24 pt-20 sm:px-6 md:pt-24 lg:px-8">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(185,28,28,0.08),transparent)]"
        aria-hidden="true"
      ></div>
      <div class="relative mx-auto w-full max-w-6xl">
        
        <!-- Breadcrumbs -->
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />

        <!-- Header -->
        <div
          v-if="subscriptionNotifications.length"
          class="mb-6 space-y-3"
          role="region"
          :aria-label="messages.auth?.accountNotificationsRegion || 'Уведомления'"
        >
          <div
            v-for="n in subscriptionNotifications"
            :key="n.id"
            class="rounded-2xl border border-amber-200/90 bg-amber-50/95 p-4 shadow-sm sm:p-5"
          >
            <p class="text-sm font-black text-amber-950">{{ n.title }}</p>
            <p class="mt-2 text-sm leading-relaxed text-amber-950/90">{{ n.message }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <Link
                :href="n.url"
                class="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-primary-hover"
              >
                {{ n.action_label || messages.auth?.accountNotificationRenew || 'Продлить' }}
              </Link>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-amber-300/80 bg-white px-4 py-2 text-xs font-bold text-amber-950 shadow-sm hover:bg-amber-100/80"
                @click="dismissNotification(n.id)"
              >
                {{ messages.auth?.accountNotificationDismiss || 'Скрыть' }}
              </button>
            </div>
          </div>
        </div>

        <header class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-[0.2em] text-primary/90">
              {{ messages.auth?.accountSettingsTitle || 'Настройки профиля' }}
            </p>
            <h1 class="text-3xl font-black tracking-tight text-dark sm:text-4xl">
              {{ messages.auth?.accountTitle || 'Личный кабинет' }}
            </h1>
            <p class="max-w-xl text-base text-slate-600">
              {{ messages.auth?.accountWelcome || 'Вы вошли как' }}
              <span class="font-bold text-dark">{{ displayLine }}</span>
            </p>
          </div>
          <Link
            :href="route('logout')"
            method="post"
            as="button"
            class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-dark sm:w-auto"
          >
            {{ messages.auth?.logout || 'Выйти' }}
          </Link>
        </header>

        <div
          v-if="showEmailVerificationBanner"
          class="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
          role="alert"
        >
          <p class="text-sm font-semibold leading-snug text-amber-950">
            {{ messages.auth?.accountEmailUnverifiedBanner }}
          </p>
          <Link
            :href="`${base}/profile#email-verify`"
            class="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover sm:text-sm"
          >
            {{ messages.auth?.accountProfileVerificationLinkCta }}
          </Link>
        </div>

        <!-- Content Area -->
        <div class="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm">
          <!-- Tab Nav -->
          <div class="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/50 px-4 py-5 sm:px-8">
            <nav class="flex flex-wrap gap-2 sm:gap-3" :aria-label="messages.auth?.accountSettingsTitle">
              <Link
                v-for="tab in tabs"
                :key="tab.id"
                :href="tab.href"
                preserve-scroll
                :class="['relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base', tab.active ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300']"
              >
                {{ tab.label }}
              </Link>
            </nav>
          </div>

          <div class="animate-fade-in px-4 py-8 sm:px-8 md:py-10">
            <slot />
          </div>
        </div>

      </div>
    </div>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, usePage, Link, router } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  messages: {
    type: Object,
    required: true,
  },
});

const page = usePage();
const user = computed(() => page.props.auth?.user);

const showEmailVerificationBanner = computed(() => {
  const u = user.value;
  if (!u?.email?.trim()) {
    return false;
  }

  return !u.email_verified_at;
});

const subscriptionNotifications = computed(() => page.props.auth?.subscriptionNotifications ?? []);

function dismissNotification(id) {
  router.post(route('account.notifications.read', id), {}, { preserveScroll: true });
}

const displayLine = computed(() => {
  if (!user.value) return '';
  const email = user.value.email?.trim() || '';
  const tg = user.value.tg_username?.trim() ? `@${user.value.tg_username.trim()}` : '';
  return email || tg || `ID ${user.value.id}`;
});

const base = computed(() => props.locale === 'en' ? '/en/account' : '/account');

const currentPath = computed(() => {
  return page.url.split('?')[0];
});

const tabs = computed(() => {
  const sections = [
    { id: 'profile', label: props.messages.auth?.accountSectionProfile || 'Профиль' },
    { id: 'plans', label: props.messages.auth?.accountTabPlans || 'Тарифы' },
    { id: 'language', label: props.messages.auth?.accountTabLanguage || 'Язык' },
    { id: 'security', label: props.messages.auth?.accountSectionSecurity || 'Безопасность' },
    { id: 'referrals', label: props.messages.auth?.accountTabReferrals || 'Рефералы' },
    { id: 'tickets', label: props.messages.auth?.accountTabTickets || 'Поддержка' },
  ];

  return sections.map(s => {
    const href = `${base.value}/${s.id}`;
    let active = false;
    if (s.id === 'tickets') {
      active = currentPath.value === href || currentPath.value.startsWith(`${href}/`);
    } else {
      active = currentPath.value === href;
    }
    return { ...s, href, active };
  });
});

const breadcrumbItems = computed(() => {
  const b = props.messages.breadcrumb;
  if (!b) return [];

  const homeHref = props.locale === 'en' ? '/en' : '/';
  const items = [{ href: homeHref, label: b.home }];

  let p = currentPath.value.replace(/\/$/, '') || '/';
  let rest = [];
  if (p === '/account' || p === '/en/account') {
    rest = [];
  } else if (p.startsWith('/en/account/')) {
    rest = p.slice('/en/account/'.length).split('/').filter(Boolean);
  } else if (p.startsWith('/account/')) {
    rest = p.slice('/account/'.length).split('/').filter(Boolean);
  } else {
    return items;
  }

  if (rest.length === 0) {
    items.push({ label: props.messages.auth?.accountTitle || 'Личный кабинет' });
  } else {
    items.push({ href: base.value, label: props.messages.auth?.accountTitle || 'Личный кабинет' });
    let acc = base.value;
    for (let i = 0; i < rest.length; i++) {
      const seg = rest[i];
      acc += `/${seg}`;
      const isLast = i === rest.length - 1;
      
      let label = seg;
      const prev = rest[i - 1];
      if (prev === 'tickets' && seg === 'new') {
        label = props.messages.supportTickets?.newTicket || 'Новая заявка';
      } else if (prev === 'tickets' && /^\d+$/.test(seg)) {
        label = `${props.messages.supportTickets?.ticketPrefix || 'Заявка'} #${seg}`;
      } else {
        const a = props.messages.auth || {};
        switch (seg) {
          case 'profile': label = a.accountSectionProfile || 'Профиль'; break;
          case 'plans': label = a.accountTabPlans || 'Тарифы'; break;
          case 'language': label = a.accountTabLanguage || 'Язык'; break;
          case 'security': label = a.accountSectionSecurity || 'Безопасность'; break;
          case 'referrals': label = a.accountTabReferrals || 'Рефералы'; break;
          case 'tickets': label = a.accountTabTickets || 'Поддержка'; break;
        }
      }

      items.push({
        href: isLast ? undefined : acc,
        label,
      });
    }
  }

  return items;
});
</script>
