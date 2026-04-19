<template>
  <div class="grid gap-6 md:grid-cols-2">
    <div
      id="email-verify"
      class="scroll-mt-24 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
    >
      <h3 class="text-sm font-bold text-slate-500 uppercase">{{ messages.auth?.profileEmail || 'Email' }}</h3>
      <p class="mt-2 text-lg font-bold text-dark">{{ emailDisplay }}</p>

      <div v-if="showEmailVerificationPanel" class="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <p
          v-if="verificationFlashStatus === 'verification-link-sent'"
          class="rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2.5 text-xs font-semibold text-emerald-900"
          role="status"
        >
          {{ messages.auth?.verifyEmailStatusResent }}
        </p>

        <template v-if="!emailVerificationSentAt">
          <p class="text-xs leading-relaxed text-slate-600">
            {{ messages.auth?.profileEmailVerificationNeverSent }}
          </p>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="verificationForm.processing"
            @click="sendVerification"
          >
            {{ messages.auth?.profileEmailVerificationSend }}
          </button>
        </template>
        <template v-else>
          <p v-if="secondsLeft > 0" class="text-xs font-semibold text-amber-900">
            {{ waitLabel }}
          </p>
          <button
            v-else
            type="button"
            class="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="verificationForm.processing"
            @click="sendVerification"
          >
            {{ messages.auth?.profileEmailVerificationResend }}
          </button>
        </template>
      </div>
    </div>
    <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-500 uppercase">{{ messages.auth?.profileTg || 'Telegram' }}</h3>
      <p class="mt-2 text-lg font-bold text-dark">{{ tgDisplay || (messages.auth?.accountProfile?.notLinked || 'Не привязан') }}</p>
      <template v-if="showTelegramBind">
        <p class="mt-3 text-xs leading-relaxed text-slate-500">
          {{ messages.auth?.accountTelegramBindHint }}
        </p>
        <button
          type="button"
          class="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="telegramBindLoading"
          @click="$emit('telegram-bind')"
        >
          {{ messages.auth?.accountTelegramBindCta }}
        </button>
      </template>
    </div>
    <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-500 uppercase">{{ messages.auth?.profileId || 'User ID' }}</h3>
      <p class="mt-2 text-lg font-bold text-dark">{{ userId }}</p>
    </div>
    <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-500 uppercase">{{ messages.auth?.profileMemberSince || 'Дата регистрации' }}</h3>
      <p class="mt-2 text-lg font-bold text-dark">{{ memberSinceFormatted }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useForm, router } from '@inertiajs/vue3';

const COOLDOWN_SEC = 20;

const props = defineProps({
  messages: Object,
  emailDisplay: String,
  tgDisplay: String,
  userId: String,
  memberSinceFormatted: String,
  showTelegramBind: { type: Boolean, default: false },
  telegramBindLoading: { type: Boolean, default: false },
  showEmailVerificationPanel: { type: Boolean, default: false },
  emailVerificationSentAt: { type: String, default: null },
  verificationFlashStatus: { type: String, default: null },
});

defineEmits(['telegram-bind']);

const verificationForm = useForm({});

const secondsLeft = ref(0);
let tick = null;

const computeSecondsLeft = () => {
  if (!props.emailVerificationSentAt) {
    return 0;
  }
  const sent = Date.parse(props.emailVerificationSentAt);
  if (Number.isNaN(sent)) {
    return 0;
  }
  const elapsedSec = (Date.now() - sent) / 1000;

  return Math.max(0, Math.ceil(COOLDOWN_SEC - elapsedSec));
};

const bumpTimer = () => {
  secondsLeft.value = computeSecondsLeft();
};

const clearTick = () => {
  if (tick != null) {
    clearInterval(tick);
    tick = null;
  }
};

const startTick = () => {
  clearTick();
  bumpTimer();
  if (!props.emailVerificationSentAt || secondsLeft.value <= 0) {
    return;
  }
  tick = setInterval(() => {
    bumpTimer();
    if (secondsLeft.value <= 0) {
      clearTick();
    }
  }, 500);
};

watch(
  () => props.emailVerificationSentAt,
  () => {
    startTick();
  },
);

onMounted(() => {
  startTick();
});

onBeforeUnmount(() => {
  clearTick();
});

const waitLabel = computed(() => {
  const tpl = props.messages?.auth?.profileEmailVerificationWaitSeconds || 'Повторная отправка через {seconds} с.';
  return tpl.replace('{seconds}', String(secondsLeft.value));
});

const sendVerification = () => {
  verificationForm.post(route('verification.send'), {
    preserveScroll: true,
    onSuccess: () => {
      router.reload({ preserveScroll: true });
    },
  });
};
</script>
