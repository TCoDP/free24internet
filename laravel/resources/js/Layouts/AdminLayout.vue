<template>
  <Head>
    <meta head-key="meta:robots:admin" name="robots" content="noindex, nofollow" />
  </Head>
  <PublicLayout :locale="locale" :messages="resolvedMessages">
    <div class="min-h-[calc(100vh-4rem)] bg-slate-100 pb-20 pt-20 md:pt-24">
      <div class="mx-auto max-w-7xl px-4 lg:px-8">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="resolvedMessages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          className="mb-6"
        />
        <div class="flex flex-col gap-8 lg:flex-row">
          <aside class="shrink-0 lg:w-56">
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{{ resolvedMessages.adminPanel?.title }}</p>
              <nav class="flex flex-col gap-1">
                <Link
                  v-for="nav in navItems"
                  :key="nav.path"
                  :href="nav.href"
                  :class="['rounded-lg px-3 py-2 text-sm font-semibold transition-colors', nav.active ? 'bg-slate-100 text-primary' : 'text-slate-700 hover:bg-slate-50 hover:text-dark']"
                >
                  {{ nav.label }}
                </Link>
              </nav>
              <Link
                :href="homeHref"
                class="mt-4 block text-sm font-bold text-primary underline-offset-2 hover:underline"
              >
                {{ resolvedMessages.adminPanel?.backToSite }}
              </Link>
            </div>
          </aside>
          <main class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <slot />
          </main>
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, usePage, Link } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  messages: {
    type: Object,
    default: null,
  },
});

const resolvedMessages = computed(() => props.messages || publicMessages[props.locale]);

const page = usePage();
const currentPath = computed(() => page.url.split('?')[0]);

const baseHref = computed(() => props.locale === 'en' ? '/en/admin' : '/admin');
const homeHref = computed(() => props.locale === 'en' ? '/en' : '/');

const navItems = computed(() => {
  const a = resolvedMessages.value.adminPanel || {};
  const config = [
    { path: '', key: 'navDashboard', label: a.navDashboard || 'Обзор' },
    { path: 'users', key: 'navUsers', label: a.navUsers || 'Пользователи' },
    { path: 'articles', key: 'navArticles', label: a.navArticles || 'Статьи' },
    { path: 'tariffs', key: 'navTariffs', label: a.navTariffs || 'Тарифы' },
    { path: 'referrals', key: 'navReferrals', label: a.navReferrals || 'Рефералы' },
    { path: 'support', key: 'navSupport', label: a.navSupport || 'Поддержка' },
    { path: 'payments', key: 'navPayments', label: a.navPayments || 'Оплаты' },
    { path: 'moneta', key: 'navMoneta', label: a.navMoneta || 'Moneta' },
  ];

  return config.map(item => {
    const href = item.path ? `${baseHref.value}/${item.path}` : baseHref.value;
    let active = false;
    if (item.path === '') {
      active = currentPath.value === href;
    } else {
      active = currentPath.value === href || currentPath.value.startsWith(`${href}/`);
    }
    return {
      ...item,
      href,
      active,
    };
  });
});

const breadcrumbItems = computed(() => {
  const b = resolvedMessages.value.breadcrumb;
  const a = resolvedMessages.value.adminPanel || {};
  if (!b) return [];

  const path = currentPath.value.replace(/\/$/, '') || '/';
  if (!path.startsWith('/admin')) return [];

  const homeHref = props.locale === 'en' ? '/en' : '/';
  const adminBase = '/admin';
  const items = [{ href: homeHref, label: b.home }];

  if (path === '/admin') {
    items.push({ label: a.title || 'Admin' });
    return items;
  }

  items.push({ href: adminBase, label: a.title || 'Admin' });

  const rest = path.slice('/admin/'.length).split('/').filter(Boolean);
  let acc = adminBase;
  for (let i = 0; i < rest.length; i++) {
    const seg = rest[i];
    acc += `/${seg}`;
    const isLast = i === rest.length - 1;
    const prev = rest[i - 1];

    let label = seg;
    if (prev === 'users' && /^\d+$/.test(seg)) {
      label = `${a.userEditTitle || 'User'} #${seg}`;
    } else if (prev === 'support' && /^\d+$/.test(seg)) {
      label = `${a.ticketDetailTitle || 'Ticket'} #${seg}`;
    } else if (prev === 'articles' && seg === 'create') {
      label = a.articlesFormCreate || seg;
    } else if (prev === 'articles' && /^\d+$/.test(seg)) {
      label = `${a.articlesFormEdit || 'Edit'} #${seg}`;
    } else if (seg === 'edit' && /^\d+$/.test(String(prev))) {
      label = a.articlesFormEdit || seg;
    } else {
      switch (seg) {
        case 'users':
          label = a.usersTitle || a.navUsers || seg;
          break;
        case 'articles':
          label = a.articlesTitle || a.navArticles || seg;
          break;
        case 'tariffs':
          label = a.tariffsTitle || a.navTariffs || seg;
          break;
        case 'referrals':
          label = a.referralsTitle || a.navReferrals || seg;
          break;
        case 'support':
          label = a.supportTitle || a.navSupport || seg;
          break;
        case 'payments':
          label = a.paymentsTitle || a.navPayments || seg;
          break;
        case 'moneta':
          label = a.monetaTitle || a.navMoneta || seg;
          break;
        default:
          break;
      }
    }

    items.push({
      href: isLast ? undefined : acc,
      label,
    });
  }

  return items;
});
</script>
