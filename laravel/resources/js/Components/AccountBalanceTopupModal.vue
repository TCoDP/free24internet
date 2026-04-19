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
          {{ a.accountBalanceTopupModalTitle || 'Пополнение баланса' }}
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-slate-600">
          {{ a.accountBalanceTopupModalIntro || 'Выберите сумму и способ оплаты.' }}
        </p>

        <div class="mt-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">
            {{ a.accountBalanceTopupAmountHint || 'Сумма' }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="rub in amounts"
              :key="rub"
              type="button"
              @click="selectedRub = rub"
              :class="[
                'rounded-xl border-2 px-4 py-2 text-sm font-extrabold transition-colors',
                selectedRub === rub
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 bg-white text-dark hover:border-slate-300',
              ]"
            >
              {{ formatRub(rub) }}
            </button>
          </div>
        </div>

        <div v-if="!canPayOnSite" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
          {{ a.plansPaymentNotReady }}
        </div>
        <div v-else class="mt-6 flex flex-col gap-3">
          <button
            v-if="paymentProviders.platega && paymentProviders.platega_crypto"
            type="button"
            :disabled="loading || selectedRub == null"
            @click="pay('platega')"
            class="rounded-xl bg-dark py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            <template v-if="loading && loadingProvider === 'platega'">…</template>
            <template v-else>{{ a.plansPayPlategaFiat || a.plansPayPlatega }}</template>
          </button>
          <button
            v-else-if="paymentProviders.platega"
            type="button"
            :disabled="loading || selectedRub == null"
            @click="pay('platega')"
            class="rounded-xl bg-dark py-3 text-sm font-extrabold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            <template v-if="loading && loadingProvider === 'platega'">…</template>
            <template v-else>{{ a.plansPayPlatega }}</template>
          </button>
          <button
            v-if="paymentProviders.platega_crypto"
            type="button"
            :disabled="loading || selectedRub == null"
            @click="pay('platega_crypto')"
            class="rounded-xl border-2 border-amber-300/80 bg-amber-50 py-3 text-sm font-extrabold text-amber-950 transition-colors hover:bg-amber-100 disabled:opacity-60"
          >
            <template v-if="loading && loadingProvider === 'platega_crypto'">…</template>
            <template v-else>{{ a.plansPayPlategaCrypto }}</template>
          </button>
          <button
            v-if="paymentProviders.moneta"
            type="button"
            :disabled="loading || selectedRub == null"
            @click="pay('moneta')"
            class="rounded-xl border-2 border-slate-200 bg-white py-3 text-sm font-extrabold text-dark transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
          >
            <template v-if="loading && loadingProvider === 'moneta'">…</template>
            <template v-else>{{ a.plansPayMoneta || a.plansPayOnSite }}</template>
          </button>
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
          class="mt-6 w-full py-2 text-sm font-bold text-slate-500 transition-colors hover:text-dark"
        >
          {{ a.profilePayClose || 'Закрыть' }}
        </button>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { formatRub } from '@/lib/pricing-config';

function readXsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

const props = defineProps({
  messages: { type: Object, default: () => ({}) },
  open: { type: Boolean, default: false },
  canPayOnSite: { type: Boolean, default: true },
  paymentProviders: {
    type: Object,
    default: () => ({ moneta: false, platega: false, platega_crypto: false }),
  },
  balanceTopupAmountsRub: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close']);

const mounted = ref(false);
const titleId = `balance-modal-${Math.random().toString(36).substr(2, 9)}`;
const selectedRub = ref(null);
const loading = ref(false);
const loadingProvider = ref(null);
const msg = ref(null);
const payManualUrl = ref('');

const a = computed(() => props.messages?.auth || {});

const amounts = computed(() =>
  (props.balanceTopupAmountsRub || []).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0),
);

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

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    const list = amounts.value;
    selectedRub.value = list.length ? list[0] : null;
    msg.value = null;
    payManualUrl.value = '';
    document.body.style.overflow = 'hidden';
  },
);

watch(
  () => props.open,
  (isOpen, oldVal) => {
    if (!isOpen && oldVal) {
      document.body.style.overflow = '';
    }
  },
);

const onKey = (e) => {
  if (props.open && e.key === 'Escape') close();
};

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  document.body.style.overflow = '';
});

const pay = async (provider) => {
  if (!props.canPayOnSite || selectedRub.value == null) return;
  if (provider !== 'moneta' && provider !== 'platega' && provider !== 'platega_crypto') return;
  msg.value = null;
  payManualUrl.value = '';
  loading.value = true;
  loadingProvider.value = provider;
  const locale = props.messages?.locale === 'en' ? 'en' : 'ru';

  try {
    const res = await fetch(route('account.balance.topup'), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': readXsrfToken(),
      },
      body: JSON.stringify({
        amountRub: selectedRub.value,
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
    } else if (res.status === 422 && data.errors?.amountRub) {
      msg.value = a.value.accountBalanceTopupInvalid || a.value.errors?.validation;
    } else if (res.status === 422) {
      msg.value = a.value.plansPaymentProviderUnavailable;
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
</script>
