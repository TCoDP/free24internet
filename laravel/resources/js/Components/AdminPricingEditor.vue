<template>
  <div class="space-y-10">
    <p v-if="msg" :class="['rounded-xl px-4 py-3 text-sm font-semibold', msg === messages.adminPanel?.tariffsSaved || msg === messages.adminPanel?.userSaved ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800']">
      {{ msg }}
    </p>

    <section class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 class="text-lg font-black text-dark">{{ messages.adminPanel?.tariffsSectionGlobal || 'Общие настройки' }}</h2>
      <div class="flex flex-wrap gap-4">
        <label class="flex flex-col gap-1 text-sm font-bold text-slate-700">
          {{ messages.adminPanel?.tariffsLabelBaseMonthly || 'Базовая цена за 1 месяц, ₽' }}
          <input
            type="number"
            min="1"
            v-model="base"
            class="w-40 rounded-lg border border-slate-200 px-3 py-2 font-mono"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm font-bold text-slate-700">
          {{ messages.adminPanel?.tariffsLabelTrialDays || 'Пробный период при регистрации, дней' }}
          <input
            type="number"
            min="0"
            v-model="trial"
            class="w-40 rounded-lg border border-slate-200 px-3 py-2 font-mono"
          />
        </label>
      </div>
      <button
        type="button"
        :disabled="loading"
        @click="saveGlobal"
        class="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {{ messages.adminPanel?.tariffsSaveGlobal || 'Сохранить общие' }}
      </button>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-black text-dark">{{ messages.adminPanel?.tariffsSectionTerms || 'Сроки подписки' }}</h2>
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColMonths || 'Мес.' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColDiscount || 'Скидка' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColReferrerDays || 'Бонус' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColSort || 'Порядок' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColActive || 'Вкл.' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.tariffsColPay || 'К оплате' }}</th>
              <th class="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in terms" :key="row.id" class="border-b border-slate-100">
              <td class="px-3 py-2">
                <input
                  type="number"
                  min="1"
                  v-model.number="terms[idx].months"
                  class="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                />
              </td>
              <td class="px-3 py-2">
                <input
                  type="number"
                  step="0.00001"
                  min="0"
                  max="0.99999"
                  v-model.number="terms[idx].discount_rate"
                  class="w-28 rounded border border-slate-200 px-2 py-1 font-mono"
                />
              </td>
              <td class="px-3 py-2">
                <input
                  type="number"
                  min="0"
                  v-model.number="terms[idx].referrer_bonus_days"
                  class="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                />
              </td>
              <td class="px-3 py-2">
                <input
                  type="number"
                  v-model.number="terms[idx].sort_order"
                  class="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                />
              </td>
              <td class="px-3 py-2">
                <input
                  type="checkbox"
                  v-model="terms[idx].is_active"
                  :true-value="1"
                  :false-value="0"
                />
              </td>
              <td class="px-3 py-2 font-mono font-semibold">
                {{ formatRub(Math.round((Number(base) || 0) * row.months * (1 - (Number(row.discount_rate) || 0)))) }}
              </td>
              <td class="space-x-2 px-3 py-2">
                <button
                  type="button"
                  :disabled="loading"
                  @click="patchTerm(terms[idx])"
                  class="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {{ messages.adminPanel?.tariffsSaveTerm || 'Сохранить' }}
                </button>
                <button
                  type="button"
                  :disabled="loading"
                  @click="removeTerm(row.id)"
                  class="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {{ messages.adminPanel?.tariffsDeleteTerm || 'Удалить' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
        <span class="w-full text-sm font-bold text-slate-600">{{ messages.adminPanel?.tariffsAddTerm || 'Добавить срок' }}</span>
        <input
          type="number"
          min="1"
          :placeholder="messages.adminPanel?.tariffsColMonths || 'Мес.'"
          v-model.number="newMonths"
          class="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
        />
        <input
          type="number"
          step="0.01"
          :placeholder="messages.adminPanel?.tariffsColDiscount || 'Скидка'"
          v-model.number="newDisc"
          class="w-24 rounded-lg border border-slate-200 px-2 py-2 font-mono"
        />
        <input
          type="number"
          min="0"
          :placeholder="messages.adminPanel?.tariffsColReferrerDays || 'Бонус'"
          v-model.number="newRef"
          class="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
        />
        <input
          type="number"
          :placeholder="messages.adminPanel?.tariffsColSort || 'Порядок'"
          v-model.number="newSort"
          class="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
        />
        <label class="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" v-model="newActive" />
          {{ messages.adminPanel?.tariffsColActive || 'Вкл.' }}
        </label>
        <button
          type="button"
          :disabled="loading"
          @click="addTerm"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {{ messages.adminPanel?.tariffsAddTerm || 'Добавить срок' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { router } from '@inertiajs/vue3';

const props = defineProps({
  messages: {
    type: Object,
    required: true,
  },
  initialGlobal: {
    type: Object,
    required: true,
  },
  initialTerms: {
    type: Array,
    required: true,
  },
});

const a = props.messages.adminPanel || {};
const base = ref(String(props.initialGlobal.base_monthly_rub));
const trial = ref(String(props.initialGlobal.trial_days));
const terms = ref([...props.initialTerms]);
const msg = ref(null);
const loading = ref(false);

const newMonths = ref(1);
const newDisc = ref(0);
const newRef = ref(7);
const newSort = ref(100);
const newActive = ref(true);

const formatRub = (val) => `${val} ₽`;

const saveGlobal = () => {
  msg.value = null;
  loading.value = true;
  router.put(
    route('admin.tariffs.global.update'),
    {
      base_monthly_rub: Number(base.value),
      trial_days: Number(trial.value),
    },
    {
      preserveScroll: true,
      onSuccess: () => {
        msg.value = a.tariffsSaved || 'Сохранено';
      },
      onError: () => {
        msg.value = a.errors?.saveFailed || 'Ошибка сохранения';
      },
      onFinish: () => {
        loading.value = false;
      },
    },
  );
};

const patchTerm = (row) => {
  msg.value = null;
  loading.value = true;
  router.put(
    route('admin.tariffs.terms.update', row.id),
    {
      months: row.months,
      discount_rate: row.discount_rate,
      referrer_bonus_days: row.referrer_bonus_days,
      sort_order: row.sort_order,
      is_active: Boolean(row.is_active),
    },
    {
      preserveScroll: true,
      onSuccess: () => {
        msg.value = a.tariffsSaved || 'Сохранено';
      },
      onError: (errors) => {
        if (errors.months) {
          msg.value = a.tariffsMonthsTaken || 'Такой срок уже есть';
        } else {
          msg.value = a.errors?.saveFailed || 'Ошибка сохранения';
        }
      },
      onFinish: () => {
        loading.value = false;
      },
    },
  );
};

const removeTerm = (id) => {
  if (!confirm('OK?')) return;
  msg.value = null;
  loading.value = true;
  router.delete(route('admin.tariffs.terms.destroy', id), {
    preserveScroll: true,
    onSuccess: () => {
      msg.value = a.tariffsSaved || 'Сохранено';
      terms.value = terms.value.filter((x) => x.id !== id);
    },
    onError: () => {
      msg.value = a.errors?.saveFailed || 'Ошибка сохранения';
    },
    onFinish: () => {
      loading.value = false;
    },
  });
};

const addTerm = () => {
  msg.value = null;
  loading.value = true;
  router.post(
    route('admin.tariffs.terms.store'),
    {
      months: Number(newMonths.value),
      discount_rate: Number(newDisc.value),
      referrer_bonus_days: Number(newRef.value),
      sort_order: Number(newSort.value),
      is_active: newActive.value,
    },
    {
      preserveScroll: true,
      onSuccess: () => {
        msg.value = a.tariffsSaved || 'Сохранено';
      },
      onError: (errors) => {
        if (errors.months) {
          msg.value = a.tariffsMonthsTaken || 'Такой срок уже есть';
        } else {
          msg.value = a.errors?.saveFailed || 'Ошибка сохранения';
        }
      },
      onFinish: () => {
        loading.value = false;
      },
    },
  );
};
</script>
