<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.accountTabReferrals || 'Рефералы'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <div class="space-y-10">
        <section class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
          <h3 class="text-sm font-black uppercase tracking-wide text-primary">{{ messages.auth?.referralYourCode }}</h3>
          <p class="mt-4 font-mono text-2xl font-bold tracking-wide text-dark">{{ referralCode }}</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              @click="copy('code', referralCode)"
              class="rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-dark hover:border-primary"
            >
              {{ copied === 'code' ? messages.auth?.referralCopied : messages.auth?.referralCopyCode }}
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
          <h3 class="text-sm font-black uppercase tracking-wide text-primary">{{ messages.auth?.referralShareLink }}</h3>
          <p class="mt-3 break-all font-mono text-sm text-slate-700">{{ shareUrl }}</p>
          <button
            type="button"
            @click="copy('link', shareUrl)"
            class="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover"
          >
            {{ copied === 'link' ? messages.auth?.referralCopied : messages.auth?.referralCopyLink }}
          </button>
          <p class="mt-6 text-sm leading-relaxed text-slate-600">{{ messages.auth?.referralHowPayment }}</p>
        </section>

        <section class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5">
            <p class="text-xs font-bold uppercase tracking-wide text-emerald-800">{{ messages.auth?.referralInvitedCount }}</p>
            <p class="mt-2 text-3xl font-black text-emerald-950">{{ invitedCount }}</p>
          </div>
          <div class="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-5">
            <p class="text-xs font-bold uppercase tracking-wide text-sky-900">{{ messages.auth?.referralBonusDaysTotal }}</p>
            <p class="mt-2 text-3xl font-black text-sky-950">{{ bonusDaysTotal }}</p>
          </div>
        </section>

        <section class="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-6 sm:p-8">
          <h3 class="text-sm font-black uppercase tracking-wide text-dark">{{ messages.auth?.referralRewardTableTitle }}</h3>
          <ul class="mt-4 space-y-2 text-sm font-semibold text-slate-700">
            <li v-for="line in messages.auth?.referralRewardRows" :key="line" class="flex gap-2">
              <span class="text-primary">✓</span>
              {{ line }}
            </li>
          </ul>
        </section>

        <section class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
          <h3 class="text-sm font-black uppercase tracking-wide text-primary">{{ messages.auth?.referralApplyTitle }}</h3>
          <p class="mt-2 text-sm text-slate-600">{{ messages.auth?.referralApplyBlurb }}</p>
          
          <template v-if="hasReferrer">
            <p class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
              {{ messages.auth?.referralAlreadyLinked }}
            </p>
          </template>
          <template v-else>
            <input
              type="text"
              v-model="applyCode"
              :placeholder="messages.auth?.referralApplyPlaceholder"
              class="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none ring-primary/30 focus:ring-2"
              autocomplete="off"
            />
            
            <p v-if="applyError" class="mt-3 text-sm font-semibold text-red-700" role="alert">
              {{ applyError }}
            </p>
            <p v-if="applyOk" class="mt-3 text-sm font-semibold text-emerald-800">
              {{ messages.auth?.referralApplySuccess }}
            </p>
            
            <button
              type="button"
              :disabled="applyLoading || !applyCode.trim()"
              @click="applyReferral"
              class="mt-4 rounded-xl bg-dark px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {{ applyLoading ? "…" : messages.auth?.referralApplySubmit }}
            </button>
          </template>
        </section>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  referralCode: {
    type: String,
    default: '',
  },
  invitedCount: {
    type: Number,
    default: 0,
  },
  bonusDaysTotal: {
    type: Number,
    default: 0,
  },
  hasReferrer: {
    type: Boolean,
    default: false,
  },
  /** Полная ссылка t.me/bot?start=ref=… если задан TELEGRAM_BOT_USERNAME на сервере */
  referralInviteUrl: {
    type: String,
    default: '',
  },
});

const messages = computed(() => publicMessages[props.locale]);

const shareUrl = computed(() => {
  if (props.referralInviteUrl) {
    return props.referralInviteUrl;
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://free24internet.vip';
  const prefix = props.locale === 'en' ? '/en' : '';
  return `${origin}${prefix}/register?ref=${encodeURIComponent(props.referralCode)}`;
});

const copied = ref(null);
const applyCode = ref('');
const applyLoading = ref(false);
const applyError = ref(null);
const applyOk = ref(false);

const copy = async (kind, text) => {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = kind;
    setTimeout(() => {
      copied.value = null;
    }, 2000);
  } catch (err) {
    console.error('Copy failed', err);
  }
};

const applyReferral = () => {
  applyError.value = null;
  applyOk.value = false;
  applyLoading.value = true;
  
  router.post('/api/account/referral/apply', { code: applyCode.value }, {
    onSuccess: () => {
      applyOk.value = true;
      applyCode.value = '';
      applyLoading.value = false;
    },
    onError: (errors) => {
      applyError.value = errors.code || messages.value.auth?.errors?.network;
      applyLoading.value = false;
    },
  });
};
</script>
