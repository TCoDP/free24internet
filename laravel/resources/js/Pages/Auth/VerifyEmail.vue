<template>
  <PublicLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.verifyEmailTitle || 'Подтверждение email'" />
    <AuthCard
      :messages="messages"
      :title="messages.auth?.verifyEmailTitle || 'Подтверждение email'"
      :subtitle="messages.auth?.verifyEmailSubtitle"
      kind="verify-email"
    >
      <div class="flex flex-col gap-5">
        <p
          v-if="status === 'verification-link-sent'"
          class="rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
          role="status"
        >
          {{ messages.auth?.verifyEmailStatusResent }}
        </p>

        <form @submit.prevent="submit" class="flex flex-col gap-5" novalidate>
          <button
            type="submit"
            :disabled="form.processing"
            class="rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-60"
          >
            {{ form.processing ? '…' : messages.auth?.verifyEmailResendCta }}
          </button>
        </form>

        <div class="border-t border-slate-200/80 pt-5">
          <p class="text-center text-sm text-slate-600">
            <Link :href="route('logout')" method="post" as="button" class="font-bold text-primary hover:underline">
              {{ messages.auth?.verifyEmailLogout }}
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { useForm, Head, Link } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import AuthCard from '@/Components/AuthCard.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  status: String,
});

const messages = computed(() => publicMessages[props.locale]);

const form = useForm({});

const submit = () => {
  form.post(route('verification.send'));
};
</script>
