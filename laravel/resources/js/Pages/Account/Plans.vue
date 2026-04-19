<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.accountSectionPlans || 'Тарифы и оплата'" />

    <div class="space-y-8">
      <header>
        <h2 class="text-xl font-black tracking-tight text-dark sm:text-2xl">{{ messages.auth?.accountSectionPlans || 'Тарифы и оплата' }}</h2>
      </header>

      <div class="border-b border-slate-200 pb-3">
        <nav class="flex flex-wrap gap-2 sm:gap-3" role="tablist" :aria-label="messages.auth?.accountSectionPlans">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'tariffs'"
            :tabindex="tab === 'tariffs' ? 0 : -1"
            :class="['rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base', tab === 'tariffs' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300']"
            @click="tab = 'tariffs'"
          >
            {{ messages.auth?.accountTabPlans || 'Тарифы' }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'services'"
            :tabindex="tab === 'services' ? 0 : -1"
            :class="['rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base', tab === 'services' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300']"
            @click="tab = 'services'"
          >
            {{ messages.auth?.accountTabMyServices || 'Мои подписки' }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'history'"
            :tabindex="tab === 'history' ? 0 : -1"
            :class="['rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base', tab === 'history' ? 'bg-primary text-white shadow-md shadow-primary/25' : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300']"
            @click="tab = 'history'"
          >
            {{ messages.auth?.transactionsTitle || 'История операций' }}
          </button>
        </nav>
      </div>

      <p
        v-if="trialBanner.type"
        :class="[
          'rounded-2xl border px-4 py-3 text-sm font-semibold',
          trialBanner.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
            : trialBanner.kind === 'email'
              ? 'border-red-200 bg-red-50 text-red-950'
              : 'border-amber-200 bg-amber-50 text-amber-950',
        ]"
        role="alert"
      >
        {{ trialBanner.text }}
      </p>

      <div v-show="tab === 'tariffs'" role="tabpanel" class="space-y-6">
        <section class="text-center">
          <PricingPlanGrid
            :pricingSection="messages.pricingSection"
            mode="account"
            :messages="messages"
            :pricing="pricing"
            :canPayOnSite="canPayOnSite"
            :paymentProviders="paymentProviders"
            @openPurchase="handleOpenPurchase"
            @startTrial="handleStartTrialFromGrid"
          />
        </section>
      </div>

      <div v-show="tab === 'services'" role="tabpanel" class="space-y-6">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 class="text-lg font-black text-dark">{{ messages.auth?.plansMyServicesTitle || 'Активные подписки' }}</h3>
          <p
            v-if="(messages.auth?.plansMyServicesBlurb || '').trim()"
            class="mt-2 text-sm leading-relaxed text-slate-600"
          >
            {{ messages.auth.plansMyServicesBlurb }}
          </p>

          <div class="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table class="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/90 text-xs font-black uppercase tracking-wide text-slate-500">
                  <th class="px-4 py-3">{{ messages.auth?.plansTableColService || 'Услуга' }}</th>
                  <th class="px-4 py-3 whitespace-nowrap">{{ messages.auth?.plansTableColUntil || 'Действует до' }}</th>
                  <th class="px-4 py-3">{{ messages.auth?.plansTableColDetails || 'Ссылка / действия' }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr class="align-top font-medium text-dark">
                  <td class="px-4 py-3 font-bold text-slate-700">
                    {{ messages.auth?.plansVpnBlockTitle || 'VPN' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-800">
                    <template v-if="vpnAccess.vpn?.hasKey && vpnAccess.vpn.expiresAt">
                      {{ formatDate(vpnAccess.vpn.expiresAt) }}
                    </template>
                    <template v-else>—</template>
                  </td>
                  <td class="px-4 py-3">
                    <template v-if="vpnAccess.vpn?.hasKey && vpnAccess.vpn.vlessLink">
                      <p
                        class="max-w-[min(100vw-8rem,28rem)] truncate font-mono text-xs text-slate-600"
                        :title="primaryVpnShareUrl"
                      >
                        {{ primaryVpnShareUrl }}
                      </p>
                      <button
                        type="button"
                        class="mt-2 rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-primary-hover"
                        @click="copyLink(primaryVpnShareUrl)"
                      >
                        {{ messages.auth?.plansVpnCopyLink || 'Копировать ссылку' }}
                      </button>
                      <p v-if="copyDone" class="mt-1 text-xs font-bold text-emerald-700">{{ messages.auth?.referralCopied || 'Скопировано' }}</p>
                      <div v-if="vpnQrSrc" class="mt-4">
                        <p class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {{ messages.auth?.plansVpnQrCaption || 'QR-код' }}
                        </p>
                        <img
                          :src="vpnQrSrc"
                          :alt="messages.auth?.plansVpnQrCaption || 'QR'"
                          width="176"
                          height="176"
                          class="h-44 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                          loading="lazy"
                        />
                      </div>
                    </template>
                    <span v-else class="text-slate-500">{{ messages.auth?.plansVpnNoKey || 'Ключ ещё не выдан.' }}</span>
                  </td>
                </tr>
                <tr class="align-top font-medium text-dark">
                  <td class="px-4 py-3 font-bold text-slate-700">
                    {{ messages.auth?.accountSubUntil || 'Оплаченный доступ до' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-800">
                    {{ vpnAccess.subscriptionUntil ? formatDate(vpnAccess.subscriptionUntil) : '—' }}
                  </td>
                  <td class="px-4 py-3">
                    <button
                      v-if="canPayOnSite"
                      type="button"
                      class="rounded-xl bg-primary px-3 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-primary-hover"
                      @click="openRenewPurchase"
                    >
                      {{ messages.auth?.plansRenewCta || 'Продлить' }}
                    </button>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                </tr>
                <tr class="align-top font-medium text-dark">
                  <td class="px-4 py-3 font-bold text-slate-700">
                    {{ messages.auth?.accountTrialUntil || 'Пробный период до' }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-800">
                    {{ vpnAccess.trialEndsAt ? formatDate(vpnAccess.trialEndsAt) : '—' }}
                  </td>
                  <td class="px-4 py-3 text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div v-show="tab === 'history'" role="tabpanel" class="space-y-4">
        <AccountTransactionTable :messages="messages" :rows="transactions" />
      </div>

      <AccountPurchaseModal
        :messages="messages"
        :pricing="pricing"
        :open="purchaseOpen"
        :lockedPlanMonths="lockedPlanMonths"
        :planHeading="planHeading"
        :canPayOnSite="canPayOnSite"
        :paymentProviders="paymentProviders"
        @close="closePurchase"
      />
    </div>
  </AccountLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import QRCode from 'qrcode';
import { Head, router } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import PricingPlanGrid from '@/Components/PricingPlanGrid.vue';
import AccountTransactionTable from '@/Components/AccountTransactionTable.vue';
import AccountPurchaseModal from '@/Components/AccountPurchaseModal.vue';
import { publicMessages } from '@/public/messages';

function readXsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  transactions: {
    type: Array,
    default: () => [],
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
  vpnAccess: {
    type: Object,
    default: () => ({
      hasTelegram: false,
      vpn: { hasKey: false, isActive: false, vlessLink: null, expiresAt: null },
      subscriptionUntil: null,
      trialEndsAt: null,
    }),
  },
  subscriptionImportUrl: {
    type: String,
    default: null,
  },
});

const messages = computed(() => publicMessages[props.locale]);
const tab = ref('tariffs');

const purchaseOpen = ref(false);
const lockedPlanMonths = ref(null);
const planHeading = ref('');

const vpnAccess = ref({ ...props.vpnAccess });
watch(
  () => props.vpnAccess,
  (v) => {
    vpnAccess.value = v ? { ...v, vpn: { ...v.vpn } } : vpnAccess.value;
  },
  { deep: true },
);

const trialLoading = ref(false);
const trialBanner = ref({ type: '', text: '', kind: '' });
const copyDone = ref(false);
const vpnQrSrc = ref('');
const subscriptionImportUrl = ref(props.subscriptionImportUrl || '');

/** Для кабинета: HTTPS-подписка /sub/… если есть, иначе прямой VLESS (fallback). */
const primaryVpnShareUrl = computed(() => {
  const sub = subscriptionImportUrl.value;
  if (typeof sub === 'string' && sub.trim() !== '') {
    return sub.trim();
  }
  const v = vpnAccess.value?.vpn?.vlessLink;
  return typeof v === 'string' && v.length > 0 ? v : '';
});

watch(
  () => props.subscriptionImportUrl,
  (v) => {
    subscriptionImportUrl.value = typeof v === 'string' && v.length > 0 ? v : '';
  },
);

const PLANS_OPEN_SERVICES = 'f24:plans:openMyServices';

onMounted(() => {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.sessionStorage.getItem(PLANS_OPEN_SERVICES) === '1') {
    tab.value = 'services';
    window.sessionStorage.removeItem(PLANS_OPEN_SERVICES);
  }
  const p = new URLSearchParams(window.location.search);
  const pay = p.get('payment') || '';
  if (pay === 'return' || pay === 'failed' || p.get('from') === 'telegram') {
    window.sessionStorage.setItem(PLANS_OPEN_SERVICES, '1');
    tab.value = 'services';
  }
  if (pay === 'return') {
    const path = window.location.pathname;
    router.get(
      path,
      {},
      {
        only: ['vpnAccess', 'transactions', 'subscriptionImportUrl'],
        replace: true,
        preserveState: true,
        preserveScroll: true,
      }
    );
  }
});

watch(
  primaryVpnShareUrl,
  async (link) => {
    if (!link) {
      vpnQrSrc.value = '';
      return;
    }
    try {
      vpnQrSrc.value = await QRCode.toDataURL(link, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch {
      vpnQrSrc.value = '';
    }
  },
  { immediate: true },
);

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(props.locale === 'en' ? 'en-GB' : 'ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
};

const handleOpenPurchase = (card) => {
  if (card.planMonths == null) return;
  lockedPlanMonths.value = card.planMonths;
  planHeading.value = card.title;
  purchaseOpen.value = true;
};

const openRenewPurchase = () => {
  lockedPlanMonths.value = null;
  planHeading.value = messages.value?.auth?.plansRenewModalHint || '';
  purchaseOpen.value = true;
};

const closePurchase = () => {
  purchaseOpen.value = false;
};

const applyTrialResponse = (data) => {
  if (data.vpnAccess) {
    vpnAccess.value = { ...data.vpnAccess, vpn: { ...data.vpnAccess.vpn } };
  }
  if (typeof data.subscriptionImportUrl === 'string' && data.subscriptionImportUrl.length > 0) {
    subscriptionImportUrl.value = data.subscriptionImportUrl;
  } else if (data.subscriptionImportUrl === null) {
    subscriptionImportUrl.value = '';
  }
};

const handleStartTrialFromGrid = async () => {
  await handleStartTrial();
};

const handleStartTrial = async () => {
  trialBanner.value = { type: '', text: '', kind: '' };
  copyDone.value = false;
  trialLoading.value = true;
  const a = messages.value?.auth || {};

  try {
    const res = await fetch(route('account.plans.trial'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': readXsrfToken(),
      },
      body: JSON.stringify({}),
    });

    let data = {};
    try {
      const raw = (await res.text()).replace(/^\uFEFF/, '');
      let parsed = raw ? JSON.parse(raw) : {};
      if (typeof parsed === 'string') {
        try {
          parsed = parsed ? JSON.parse(parsed) : {};
        } catch {
          parsed = {};
        }
      }
      data = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      data = {};
    }

    const reason =
      typeof data?.reason === 'string'
        ? data.reason.trim()
        : data?.reason != null
          ? String(data.reason).trim()
          : '';
    const ok = data?.ok === true;

    const setTrialError = (text, kind = '') => {
      trialBanner.value = { type: 'error', text, kind };
    };

    if (ok) {
      applyTrialResponse(data);
      const msg = (a.plansTrialSuccess || '').trim();
      if (msg) {
        trialBanner.value = { type: 'success', text: msg, kind: '' };
      }
      if (!data.already_active) {
        router.reload({ only: ['transactions'] });
      }
      tab.value = 'services';
    } else if (reason === 'trial_only_first') {
      const t = a.plansTrialAlreadyUsed || 'Пробный период уже использован.';
      setTrialError(t);
    } else if (reason === 'email_unverified') {
      const t =
        a.plansTrialEmailUnverifiedError ||
        a.plansTrialEmailUnverified ||
        'Подтвердите email, чтобы активировать пробный период.';
      setTrialError(t, 'email');
    } else {
      const t = a.plansTrialServerError || a.errors?.server || 'Не удалось подключить пробный период. Попробуйте позже.';
      setTrialError(t);
    }
  } catch {
    const t = messages.value?.auth?.errors?.network || 'Ошибка сети';
    trialBanner.value = { type: 'error', text: t, kind: '' };
  } finally {
    trialLoading.value = false;
  }
};

async function copyLink(url) {
  copyDone.value = false;
  try {
    await navigator.clipboard.writeText(url);
    copyDone.value = true;
    setTimeout(() => {
      copyDone.value = false;
    }, 2000);
  } catch {
    copyDone.value = false;
  }
}
</script>
