<template>
  <div class="mx-auto max-w-xl space-y-5">
    <p class="font-mono text-sm text-slate-500">ID {{ user.id }}</p>
    <p class="text-sm text-slate-600">
      {{ messages.adminPanel?.userEmailReadonly || 'Email (readonly)' }}: <span class="font-semibold">{{ user.email || '—' }}</span>
    </p>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-name">
        {{ messages.adminPanel?.userFieldName || 'Имя' }}
      </label>
      <input
        id="adm-name"
        v-model="name"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-lang">
        {{ messages.adminPanel?.userFieldLanguage || 'Язык' }}
      </label>
      <select
        id="adm-lang"
        v-model="language"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
      >
        <option value="">—</option>
        <option value="ru">ru</option>
        <option value="en">en</option>
      </select>
    </div>

    <label class="flex items-center gap-2 text-sm font-semibold">
      <input type="checkbox" v-model="isTheir" />
      {{ messages.adminPanel?.userFieldIsTheir || 'Оплата на сайте' }}
    </label>

    <label class="flex items-center gap-2 text-sm font-semibold">
      <input
        type="checkbox"
        :checked="superLock ? true : isAdmin"
        :disabled="superLock"
        @change="isAdmin = $event.target.checked"
      />
      {{ messages.adminPanel?.userFieldIsAdmin || 'Админ' }}
      <span v-if="superLock" class="text-xs font-normal text-slate-500">
        {{ messages.adminPanel?.userSuperadminNote || '(суперпользователь)' }}
      </span>
    </label>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-sub">
        {{ messages.adminPanel?.userFieldSubUntil || 'Подписка до' }}
      </label>
      <input
        id="adm-sub"
        type="datetime-local"
        v-model="subUntil"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-trial">
        {{ messages.adminPanel?.userFieldTrialUntil || 'Триал до' }}
      </label>
      <input
        id="adm-trial"
        type="datetime-local"
        v-model="trialUntil"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-ref">
        {{ messages.adminPanel?.userFieldReferralCode || 'Реф. код' }}
      </label>
      <input
        id="adm-ref"
        v-model="refCode"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm uppercase"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-referrer">
        {{ messages.adminPanel?.userFieldReferredBy || 'Пригласивший' }}
      </label>
      <input
        id="adm-referrer"
        type="number"
        min="0"
        v-model="referredBy"
        class="w-full rounded-xl border border-slate-200 px-4 py-2 font-mono text-sm"
      />
    </div>

    <p
      v-if="msg"
      :class="['rounded-xl px-4 py-3 text-sm font-semibold', msg === messages.adminPanel?.userSaved ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800']"
    >
      {{ msg }}
    </p>

    <button
      type="button"
      :disabled="loading"
      @click="save"
      class="rounded-xl bg-dark px-8 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {{ loading ? "…" : (messages.adminPanel?.userSave || 'Сохранить') }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { router } from '@inertiajs/vue3';

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  messages: {
    type: Object,
    required: true,
  },
});

const toInputDateTime = (d) => {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  // Fix timezone offset for datetime-local
  const offset = x.getTimezoneOffset() * 60000;
  return new Date(x.getTime() - offset).toISOString().slice(0, 16);
};

const name = ref(props.user.name?.trim() || '');
const language = ref(props.user.language === 'en' ? 'en' : props.user.language === 'ru' ? 'ru' : '');
const isTheir = ref(Boolean(props.user.is_their));
const isAdmin = ref(Boolean(props.user.is_admin));
const subUntil = ref(toInputDateTime(props.user.subscription_until));
const trialUntil = ref(toInputDateTime(props.user.trial_ends_at));
const refCode = ref(props.user.referral_code?.trim() || '');
const referredBy = ref(props.user.referred_by_user_id != null ? String(props.user.referred_by_user_id) : '');

const msg = ref(null);
const loading = ref(false);

// Superadmin ID assumption (usually 1 or 20 per React code)
const superLock = props.user.id === 20;

const save = () => {
  msg.value = null;
  loading.value = true;
  
  const payload = {
    name: name.value.trim() || null,
    language: language.value || null,
    is_their: isTheir.value,
    is_admin: superLock ? true : isAdmin.value,
    subscription_until: subUntil.value || null,
    trial_ends_at: trialUntil.value || null,
    referral_code: refCode.value.trim() || null,
    referred_by_user_id: referredBy.value.trim() === '' ? null : Number(referredBy.value),
  };

  router.put(route('admin.users.update', props.user.id), payload, {
    preserveScroll: true,
    onSuccess: () => {
      msg.value = props.messages.adminPanel?.userSaved || 'Сохранено';
    },
    onError: (errors) => {
      if (errors.referral_code) {
        msg.value = props.messages.adminPanel?.errors?.referralTaken || 'Такой реферальный код уже занят';
      } else {
        msg.value = props.messages.adminPanel?.errors?.saveFailed || 'Ошибка сохранения';
      }
    },
    onFinish: () => {
      loading.value = false;
    },
  });
};
</script>
