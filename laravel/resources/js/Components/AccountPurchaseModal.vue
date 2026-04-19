<template>
  <teleport to="body">
    <div
      v-if="open && mounted"
      class="fixed inset-0 z-[12000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <button
        type="button"
        :aria-label="a.profilePayClose"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="close"
      ></button>
      
      <div class="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <h2 :id="titleId" class="text-xl font-black text-dark md:text-2xl">
          {{ a.profilePayModalTitle || 'Оформление тарифа' }}
        </h2>
        <p v-if="planHeading" class="mt-1 text-sm font-semibold text-slate-600">
          {{ planHeading }}
        </p>

        <div>
          <p class="mt-3 text-sm leading-relaxed text-slate-600">
            {{ a.profilePayModalIntro || 'Выберите удобный способ оплаты и срок действия тарифа.' }}
          </p>

          <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 sm:p-5">
            <dl class="space-y-3 text-sm">
              <div class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt class="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {{ a.profilePayPlanLabel || 'Тариф' }}
                </dt>
                <dd class="text-lg font-extrabold text-dark sm:text-end">{{ planTitle }}</dd>
              </div>
              <div class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt class="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {{ a.profilePayPriceLabel || 'Стоимость' }}
                </dt>
                <dd class="text-lg font-black text-primary sm:text-end">{{ priceLine }}</dd>
              </div>
              <div class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt class="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {{ a.profilePayDiscountLabel || 'Скидка' }}
                </dt>
                <dd class="text-lg font-extrabold text-dark sm:text-end">
                  {{ savingsRub > 0 ? formatRub(savingsRub) : (a.profilePayNoDiscount || 'Нет скидки') }}
                </dd>
              </div>
            </dl>
          </div>

          <div class="mt-6 flex flex-col gap-4">
            <label
              v-if="lockedPlanMonths == null"
              class="flex flex-col gap-1 text-sm font-bold text-dark"
            >
              {{ a.plansPayMonthsLabel || 'Срок действия' }}
              <select
                v-model.number="planMonths"
                class="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono"
              >
                <option v-for="m in monthChoices" :key="m" :value="m">
                  {{ m }}
                </option>
              </select>
            </label>
            <div
              v-else
              class="flex flex-col gap-0.5 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span class="shrink-0 text-sm font-bold uppercase tracking-wide text-slate-500">
                {{ a.plansPayMonthsLabel || 'Срок действия' }}
              </span>
              <span class="text-lg font-extrabold text-dark sm:text-end font-mono">
                {{ planMonths }} {{ a.transactionsMonthsSuffix || 'мес.' }}
              </span>
            </div>

            <label class="flex flex-col gap-1 text-sm font-bold text-dark">
              {{ a.plansPayReferralCodeLabel || 'Промокод или код приглашения (если есть)' }}
              <input
                type="text"
                v-model="referralCode"
                class="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm"
              />
            </label>

            <div v-if="!canPayOnSite" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
              Оплата временно недоступна
            </div>
            <div v-else class="flex flex-col gap-3">
              <button
                v-if="paymentProviders.platega && paymentProviders.platega_crypto"
                type="button"
                :disabled="loading"
                @click="pay('platega')"
                class="rounded-xl bg-dark py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                <template v-if="loading && loadingProvider === 'platega'">…</template>
                <template v-else>{{ a.plansPayPlategaFiat || a.plansPayPlatega || 'Platega' }}</template>
              </button>
              <button
                v-else-if="paymentProviders.platega"
                type="button"
                :disabled="loading"
                @click="pay('platega')"
                class="rounded-xl bg-dark py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                <template v-if="loading && loadingProvider === 'platega'">…</template>
                <template v-else>{{ a.plansPayPlatega || 'Platega' }}</template>
              </button>
              <button
                v-if="paymentProviders.platega_crypto"
                type="button"
                :disabled="loading"
                @click="pay('platega_crypto')"
                class="rounded-xl border-2 border-amber-300/80 bg-amber-50 py-3 text-sm font-extrabold text-amber-950 transition-colors hover:bg-amber-100 disabled:opacity-60"
              >
                <template v-if="loading && loadingProvider === 'platega_crypto'">…</template>
                <template v-else>{{ a.plansPayPlategaCrypto || 'Криптовалюта' }}</template>
              </button>
              <button
                v-if="paymentProviders.moneta"
                type="button"
                :disabled="loading"
                @click="pay('moneta')"
                class="rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-extrabold text-dark transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                <template v-if="loading && loadingProvider === 'moneta'">…</template>
                <template v-else>{{ a.plansPayMoneta || a.plansPayOnSite || 'Moneta' }}</template>
              </button>
            </div>
          </div>

          <div v-if="!paymentProviders.platega && !paymentProviders.platega_crypto" class="mt-6 grid grid-cols-2 gap-3">
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-center text-sm font-bold text-slate-400">
              {{ a.profilePayMethodSbp || 'СБП' }}
              <span class="mt-1 block text-xs font-semibold normal-case text-slate-400">{{ a.profilePaySoon || 'скоро' }}</span>
            </div>
            <div class="rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-center text-sm font-bold text-slate-400">
              {{ a.profilePayMethodCrypto || 'Криптовалюта' }}
              <span class="mt-1 block text-xs font-semibold normal-case text-slate-400">{{ a.profilePaySoon || 'скоро' }}</span>
            </div>
          </div>
        </div>

        <p v-if="msg" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {{ msg }}
        </p>

        <div v-if="payManualUrl" class="mt-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-4">
          <p class="text-sm font-semibold text-dark">{{ a.plansPaymentPopupBlocked }}</p>
          <a
            :href="payManualUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-white no-underline hover:bg-primary-hover"
          >
            {{ a.plansPaymentManualOpenLink }}
          </a>
        </div>

        <button
          type="button"
          @click="close"
          class="mt-6 w-full py-2 text-sm font-bold text-slate-500 hover:text-dark transition-colors"
        >
          {{ a.profilePayClose || 'Закрыть' }}
        </button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  activePlanMonthValues,
  formatRub,
  planPayRubFromConfig,
  planSavingsRubFromConfig,
} from '@/lib/pricing-config';

function readXsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

const props = defineProps({
  messages: { type: Object, default: () => ({}) },
  pricing: { type: Object, default: () => ({}) },
  open: { type: Boolean, default: false },
  lockedPlanMonths: { type: Number, default: null },
  planHeading: { type: String, default: '' },
  canPayOnSite: { type: Boolean, default: true },
  paymentProviders: {
    type: Object,
    default: () => ({ moneta: false, platega: false, platega_crypto: false }),
  },
});

const emit = defineEmits(['close']);

const mounted = ref(false);
const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

const planMonths = ref(1);
const referralCode = ref('');
const loading = ref(false);
const loadingProvider = ref(null);
const msg = ref(null);
const payManualUrl = ref('');

const a = computed(() => props.messages?.auth || {});
const monthChoices = computed(() => activePlanMonthValues(props.pricing));

const paymentProviders = computed(() => ({
  moneta: Boolean(props.paymentProviders?.moneta),
  platega: Boolean(props.paymentProviders?.platega),
  platega_crypto: Boolean(props.paymentProviders?.platega_crypto),
}));

onMounted(() => {
  mounted.value = true;
});

const close = () => {
  msg.value = null;
  payManualUrl.value = '';
  emit('close');
};

watch(() => props.open, (isOpen) => {
  if (!isOpen) return;

  const opts = monthChoices.value;
  const fallback = opts[0] ?? 1;

  if (props.lockedPlanMonths != null) {
    planMonths.value = opts.includes(props.lockedPlanMonths) ? props.lockedPlanMonths : fallback;
  } else {
    planMonths.value = fallback;
  }

  referralCode.value = '';
  msg.value = null;
  payManualUrl.value = '';

  document.body.style.overflow = 'hidden';
});

watch(() => props.open, (isOpen, oldVal) => {
  if (!isOpen && oldVal) {
    document.body.style.overflow = '';
  }
});

const onKey = (e) => {
  if (props.open && e.key === 'Escape') close();
};

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});

const pay = async (provider) => {
  if (!props.canPayOnSite) return;
  if (provider !== 'moneta' && provider !== 'platega' && provider !== 'platega_crypto') return;
  msg.value = null;
  payManualUrl.value = '';
  loading.value = true;
  loadingProvider.value = provider;

  const locale = props.messages?.locale === 'en' ? 'en' : 'ru';

  try {
    const res = await fetch(route('account.plans.pay'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': readXsrfToken(),
      },
      body: JSON.stringify({
        month: planMonths.value,
        referralCode: referralCode.value.trim() || undefined,
        locale,
        provider,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (data.ok && data.redirectUrl) {
      const u = data.redirectUrl;
      const w = window.open(u, '_blank', 'noopener,noreferrer');
      if (w == null || typeof w === 'undefined') {
        payManualUrl.value = u;
      }
      return;
    }

    if (data.reason === 'no_auth_url') {
      msg.value = a.value.plansPaymentNoAuthUrl;
    } else if (data.reason === 'not_configured') {
      msg.value = a.value.plansPaymentNotReady;
    } else if (data.reason === 'not_eligible') {
      msg.value = a.value.plansPaymentNotEligible;
    } else if (data.reason === 'provider_unavailable') {
      msg.value = a.value.plansPaymentProviderUnavailable;
    } else if (
      data.reason === 'platega_unreachable' ||
      data.reason === 'platega_error' ||
      data.reason === 'platega_invalid_response'
    ) {
      msg.value = a.value.plansPaymentPlategaError;
    } else if (data.reason === 'plan_unavailable' || res.status === 422) {
      msg.value = a.value.plansPaymentPlanUnavailable;
    } else {
      msg.value = a.value.errors?.server || 'Ошибка';
    }
  } catch {
    msg.value = a.value.errors?.network || 'Ошибка сети';
  } finally {
    loading.value = false;
    loadingProvider.value = null;
  }
};

const planCard = computed(() => {
  return props.messages?.pricingSection?.cards?.find((c) => c.planMonths === planMonths.value);
});

const planTitle = computed(() => {
  return props.planHeading || planCard.value?.title || `${planMonths.value} ${a.value.transactionsMonthsSuffix || 'мес.'}`;
});

const payRub = computed(() => {
  return planPayRubFromConfig(planMonths.value, props.pricing);
});

const priceLine = computed(() => {
  if (planCard.value) return `${planCard.value.price}${planCard.value.period}`;
  if (payRub.value != null) return formatRub(payRub.value);
  return '—';
});

const savingsRub = computed(() => {
  if (payRub.value == null) return 0;
  return planSavingsRubFromConfig(planMonths.value, props.pricing);
});
</script>
