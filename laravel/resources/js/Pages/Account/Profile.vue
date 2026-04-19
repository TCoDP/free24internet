<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.accountSectionProfile || 'Профиль'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <AccountProfileInfoCards
        :messages="messages"
        :emailDisplay="emailDisplay"
        :tgDisplay="tgDisplay"
        :userId="user.id.toString()"
        :memberSinceFormatted="memberSince"
        :show-telegram-bind="showTelegramBind"
        :show-email-verification-panel="showEmailVerificationPanel"
        :email-verification-sent-at="user.email_verification_sent_at || null"
        :verification-flash-status="verificationFlashStatus"
        :telegram-bind-loading="telegramBindLoading"
        @telegram-bind="postTelegramLink"
      />

      <p v-if="telegramBindFetchError || page.props.errors?.telegram" class="text-sm font-medium text-red-600">
        {{ telegramBindFetchError || (Array.isArray(page.props.errors.telegram) ? page.props.errors.telegram[0] : page.props.errors.telegram) }}
      </p>

      <div
        v-if="telegramDeepLinkUrl"
        class="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4"
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

      <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div class="lg:col-span-7 space-y-8">
          <div class="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100/80 p-6 sm:p-8">
            <h3 class="mb-2 text-sm font-black uppercase tracking-wide text-slate-600">
              {{ messages.auth?.accountBalanceTitle || 'Баланс' }}
            </h3>
            <p class="text-3xl font-black text-dark">{{ formatRub(Number(user.balance ?? 0)) }}</p>
            <p class="mt-3 text-sm leading-relaxed text-slate-600">
              {{ messages.auth?.accountBalanceBlurb || '' }}
            </p>
            <button
              type="button"
              @click="balanceTopupOpen = true"
              class="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-dark shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              {{ messages.auth?.accountBalanceTopupCta || 'Пополнить' }}
            </button>
          </div>
        </div>
        <div class="lg:col-span-5">
          <div class="rounded-2xl border border-slate-200/70 bg-gradient-to-bl from-amber-50 to-orange-50 p-6 sm:p-8">
            <h3 class="mb-4 text-sm font-black uppercase tracking-wide text-amber-600">
              {{ messages.auth?.accountAccessTitle || 'Доступ к сервису' }}
            </h3>
            
            <template v-if="user.sub_until">
              <p class="text-sm font-bold text-slate-500">{{ messages.auth?.accountSubUntil || 'Оплаченный доступ до' }}</p>
              <p class="mt-1 text-2xl font-black text-amber-700">
                {{ formatDate(user.sub_until) }}
              </p>
            </template>
            <template v-else-if="user.trial_until">
              <p class="text-sm font-bold text-slate-500">{{ messages.auth?.accountTrialUntil || 'Пробный период до' }}</p>
              <p class="mt-1 text-2xl font-black text-amber-700">
                {{ formatDate(user.trial_until) }}
              </p>
            </template>
            <template v-else>
              <p class="text-sm font-medium leading-relaxed text-slate-700">
                {{ messages.auth?.accountAccessNone || 'Нет активной подписки после пробного периода — оформите тариф в боте.' }}
              </p>
            </template>

            <div class="mt-8 pt-6 border-t border-amber-200/60">
              <button
                type="button"
                @click="purchaseOpen = true"
                class="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:bg-primary-hover"
              >
                {{ messages.auth?.profileBuyCta || 'Купить' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <AccountPurchaseModal
      :messages="messages"
      :pricing="pricing"
      :open="purchaseOpen"
      :lockedPlanMonths="null"
      :canPayOnSite="canPayOnSite"
      :paymentProviders="paymentProviders"
      @close="purchaseOpen = false"
    />
    <AccountBalanceTopupModal
      :messages="messages"
      :open="balanceTopupOpen"
      :canPayOnSite="canPayOnSite"
      :paymentProviders="paymentProviders"
      :balanceTopupAmountsRub="balanceTopupAmountsRub"
      @close="balanceTopupOpen = false"
    />
  </AccountLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Head, usePage } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import AccountProfileInfoCards from '@/Components/AccountProfileInfoCards.vue';
import AccountPurchaseModal from '@/Components/AccountPurchaseModal.vue';
import AccountBalanceTopupModal from '@/Components/AccountBalanceTopupModal.vue';
import { fetchTelegramBindDeepLink } from '@/lib/account-telegram-link';
import { formatRub } from '@/lib/pricing-config';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  pricing: {
    type: Object,
    default: () => ({}),
  },
  canPayOnSite: {
    type: Boolean,
    default: true,
  },
  paymentProviders: {
    type: Object,
    default: () => ({ moneta: false, platega: false, platega_crypto: false }),
  },
  balanceTopupAmountsRub: {
    type: Array,
    default: () => [],
  },
});

const page = usePage();
const user = computed(() => page.props.auth.user);
const messages = computed(() => publicMessages[props.locale]);

const verificationFlashStatus = computed(() => page.props.flash?.status ?? null);

const showEmailVerificationPanel = computed(() => {
  const u = user.value;
  if (!u?.email?.trim()) {
    return false;
  }

  return !u.email_verified_at;
});

const purchaseOpen = ref(false);
const balanceTopupOpen = ref(false);
const telegramBindLoading = ref(false);
const telegramBindFetchError = ref('');
const telegramDeepLinkUrl = ref('');

const showTelegramBind = computed(() => user.value && !user.value.tg_id);

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

const emailDisplay = computed(() => user.value.email || '');
const tgDisplay = computed(() => {
  const u = user.value;
  if (!u) return null;
  if (u.tg_username) return `@${u.tg_username}`;
  if (u.tg_id) {
    const tpl = messages.value.auth?.accountTelegramLinkedById || "Linked · Telegram ID: {id}";
    return tpl.replace("{id}", String(u.tg_id));
  }
  return null;
});

const memberSince = computed(() => {
  const date = new Date(user.value.created_at);
  return date.toLocaleDateString(props.locale === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(props.locale === 'en' ? 'en-US' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};
</script>
