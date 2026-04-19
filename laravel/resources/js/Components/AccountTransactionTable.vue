<template>
  <p v-if="!rows.length" class="rounded-2xl border border-slate-200/80 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
    {{ messages.auth?.transactionsEmpty || 'Нет транзакций' }}
  </p>
  <div v-else class="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <table class="w-full min-w-[640px] text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 bg-slate-50/90 text-xs font-black uppercase tracking-wide text-slate-500">
          <th class="px-4 py-3">{{ messages.auth?.transactionsColDate || 'Дата' }}</th>
          <th class="px-4 py-3">{{ messages.auth?.transactionsColAmount || 'Сумма' }}</th>
          <th class="px-4 py-3">{{ messages.auth?.transactionsColPlan || 'Тариф' }}</th>
          <th class="px-4 py-3">{{ messages.auth?.transactionsColStatus || 'Статус' }}</th>
          <th class="px-4 py-3">{{ messages.auth?.transactionsColChannel || 'Канал' }}</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="row in rows" :key="row.id" class="font-medium text-dark">
          <td class="whitespace-nowrap px-4 py-3 text-slate-700">
            {{ formatDate(row.created_at) }}
          </td>
          <td class="px-4 py-3 font-mono">
            {{ formatAmount(row.amount_rub) }}
            <span class="text-slate-500">₽</span>
          </td>
          <td class="px-4 py-3">
            {{ planLabel(row) }}
          </td>
          <td class="px-4 py-3">{{ statusLabel(row.status) }}</td>
          <td class="px-4 py-3">
            <span class="block">{{ providerLabel(row.provider) }}</span>
            <span v-if="row.external_payment_id" class="mt-0.5 block max-w-[200px] truncate font-mono text-[11px] text-slate-400">
              {{ row.external_payment_id }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  messages: {
    type: Object,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
});

const locale = computed(() => props.messages.locale || 'ru');
const dtf = computed(() => locale.value === 'en' ? 'en-GB' : 'ru-RU');

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(dtf.value, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const formatAmount = (amount) => {
  return Number(amount).toLocaleString(dtf.value);
};

const planLabel = (row) => {
  const a = props.messages.auth || {};
  if (row.provider === 'site_trial') {
    const tpl = a.transactionsPlanTrial || 'Пробный период, {days} дн.';
    return tpl.replace(/\{days\}/g, String(row.plan_months ?? ''));
  }
  return `${row.plan_months} ${a.transactionsMonthsSuffix || 'мес.'}`;
};

const providerLabel = (code) => {
  const a = props.messages.auth || {};
  if (code === 'telegram_bot') return a.transactionProviderTelegramBot;
  if (code === 'moneta') return a.transactionProviderMoneta;
  if (code === 'platega') return a.transactionProviderPlatega;
  if (code === 'test_redeem') return a.transactionProviderTestRedeem;
  if (code === 'site_trial') return a.transactionProviderSiteTrial;
  return code || a.transactionProviderUnknown || 'Другое';
};

const statusLabel = (status) => {
  const a = props.messages.auth || {};
  if (status === 'completed') return a.transactionStatusCompleted;
  if (status === 'pending') return a.transactionStatusPending;
  return status;
};
</script>
