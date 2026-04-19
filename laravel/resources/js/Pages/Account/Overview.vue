<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.accountDashboard?.title || 'Личный кабинет'" />
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard :label="messages.accountDashboard?.statBalance || 'Баланс'" :value="`${summary.balance} ₽`" />
      <StatCard :label="messages.accountDashboard?.statTickets || 'Открытых тикетов'" :value="stats.tickets_open" />
      <StatCard :label="messages.accountDashboard?.statTx || 'Оборот'" :value="`${stats.transactions_total} ₽`" />
      <StatCard :label="messages.accountDashboard?.statBasePrice || 'Базовая цена'" :value="`${stats.pricing_base_monthly_rub} ₽/мес`" />
    </div>

    <div class="grid gap-6 lg:grid-cols-3 mt-6">
      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 class="text-lg font-semibold text-dark">{{ messages.accountDashboard?.profileLabel || 'Профиль' }}</h3>
        <dl class="mt-4 grid gap-4 md:grid-cols-2">
          <Info :label="messages.accountProfile?.emailLabel || 'Email'" :value="summary.email || (messages.accountProfile?.notSet || 'Не задан')" />
          <Info :label="messages.auth?.accountTelegram || 'Telegram'" :value="telegramStatusLine" />
          <Info :label="messages.accountProfile?.langLabel || 'Язык'" :value="summary.language || 'ru'" />
          <Info :label="messages.accountDashboard?.subUntil || 'Подписка до'" :value="summary.subscription_until || (messages.adminPanel?.no || 'Нет')" />
          <Info :label="messages.accountDashboard?.trialUntil || 'Пробный период до'" :value="summary.trial_ends_at || (messages.adminPanel?.no || 'Нет')" />
        </dl>
        <div v-if="canBindTelegram" class="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p class="text-xs leading-relaxed text-slate-600">
            {{ messages.auth?.accountTelegramBindHint }}
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="telegramBindLoading"
            @click="postTelegramLink"
          >
            {{ messages.auth?.accountTelegramBindCta }}
          </button>
        </div>
        <div
          v-if="telegramDeepLinkUrl"
          class="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4"
        >
          <p class="text-sm leading-relaxed text-slate-700">
            {{ messages.auth?.accountTelegramBindOpenHint }}
          </p>
          <a
            :href="telegramDeepLinkUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            {{ messages.auth?.accountTelegramBindOpenCta }}
          </a>
        </div>
        <p v-if="telegramBindFetchError || page.props.errors?.telegram" class="mt-3 text-sm font-medium text-red-600">
          {{ telegramBindFetchError || (Array.isArray(page.props.errors.telegram) ? page.props.errors.telegram[0] : page.props.errors.telegram) }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <Link :href="route('account.profile')" class="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover">
            {{ messages.accountProfile?.editButton || 'Редактировать профиль' }}
          </Link>
          <Link :href="route('account.security')" class="rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:border-primary/50 hover:bg-white transition-all">
            {{ messages.accountDashboard?.securityLabel || 'Безопасность' }}
          </Link>
        </div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold text-dark">{{ messages.accountDashboard?.accessLabel || 'Доступ' }}</h3>
        <p class="mt-3 text-sm text-slate-600">
          {{ summary.checkout_on_site ? (messages.accountDashboard?.sitePaymentAvailable || 'Онлайн-оплата тарифа на сайте доступна.') : (messages.accountDashboard?.sitePaymentDisabled || 'Онлайн-оплата тарифа на сайте сейчас недоступна.') }}
        </p>
        <p class="mt-3 text-sm text-slate-600">
          {{ hasPassword ? (messages.accountDashboard?.passwordSet || 'Пароль установлен.') : (messages.accountDashboard?.passwordNotSet || 'Пароль ещё не задан.') }}
        </p>
        <Link :href="route('account.plans')" class="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover">
          {{ messages.accountDashboard?.viewPlans || 'Смотреть тарифы' }}
        </Link>
      </div>
    </div>

    <div class="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-lg font-semibold text-dark">{{ messages.accountDashboard?.recentTx || 'Последние оплаты' }}</h3>
        <Link :href="route('account.plans')" class="text-sm font-semibold text-primary hover:underline">
          {{ messages.accountDashboard?.allTx || 'Все платежи' }}
        </Link>
      </div>
      <div class="mt-4 space-y-3">
        <p v-if="transactions.length === 0" class="text-sm text-slate-500">
          {{ messages.accountPlans?.noTransactions || 'Пока нет платежей.' }}
        </p>
        <div v-for="tx in transactions" :key="tx.id" class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <div class="font-medium text-dark">{{ providerLabel(tx.provider) }}</div>
            <div class="text-xs text-slate-500">{{ formatDateTime(tx.created_at) }}</div>
          </div>
          <div class="font-semibold text-dark">{{ tx.amount_rub }} ₽</div>
        </div>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Head, Link, usePage } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import { fetchTelegramBindDeepLink } from '@/lib/account-telegram-link';
import { publicMessages } from '@/public/messages';

const props = defineProps({ 
  locale: { type: String, default: 'ru' },
  summary: Object, 
  stats: Object, 
  transactions: Array, 
  hasPassword: Boolean 
});

const page = usePage();
const messages = computed(() => publicMessages[props.locale]);

const telegramBindLoading = ref(false);
const telegramBindFetchError = ref('');
const telegramDeepLinkUrl = ref('');
const canBindTelegram = computed(() => page.props.auth?.user && !page.props.auth.user.tg_id);

const telegramStatusLine = computed(() => {
  const u = page.props.auth?.user;
  const a = messages.value.auth;
  if (!u) return a?.accountTelegramNotLinked || "—";
  if (u.tg_username) return `@${String(u.tg_username).replace(/^@/, "")}`;
  if (u.tg_id) {
    const tpl = a?.accountTelegramLinkedById || "Привязан · Telegram ID: {id}";
    return tpl.replace("{id}", String(u.tg_id));
  }
  return a?.accountTelegramNotLinked || "Не привязан";
});

const postTelegramLink = async () => {
  telegramBindFetchError.value = '';
  telegramDeepLinkUrl.value = '';
  telegramBindLoading.value = true;
  const r = await fetchTelegramBindDeepLink(route('account.telegram-link'));
  telegramBindLoading.value = false;
  if (!r.ok) {
    telegramBindFetchError.value = r.error;
    return;
  }
  telegramDeepLinkUrl.value = r.url;
};

const StatCard = { 
  props: ['label', 'value'], 
  template: `<div class="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"><div class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ label }}</div><div class="mt-2 text-2xl font-black text-dark">{{ value }}</div></div>` 
};

const Info = { 
  props: ['label', 'value'], 
  template: `<div><dt class="text-xs font-bold uppercase text-slate-500">{{ label }}</dt><dd class="font-medium text-slate-800">{{ value }}</dd></div>` 
};

const formatDateTime = (val) => {
  if (!val) return '';
  return new Date(val).toISOString().slice(0, 16).replace('T', ' ');
};

const providerLabel = (code) => {
  const a = messages.value.auth || {};
  if (code === 'telegram_bot') return a.transactionProviderTelegramBot;
  if (code === 'moneta') return a.transactionProviderMoneta;
  if (code === 'platega') return a.transactionProviderPlatega;
  if (code === 'test_redeem') return a.transactionProviderTestRedeem;
  if (code === 'site_trial') return a.transactionProviderSiteTrial;
  return code || a.transactionProviderUnknown || '—';
};
</script>
