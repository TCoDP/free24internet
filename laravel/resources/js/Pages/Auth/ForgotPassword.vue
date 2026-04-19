<template>
  <PublicLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.forgotPasswordTitle || 'Восстановление пароля'" />
    <AuthCard
      :messages="messages"
      :title="messages.auth?.forgotPasswordTitle || 'Восстановление пароля'"
      :subtitle="messages.auth?.forgotPasswordBlurb"
      kind="forgot-password"
    >
      <div class="flex flex-col gap-5">
        <form @submit.prevent="submit" class="flex flex-col gap-5" novalidate>
          <div v-if="status || form.errors.email" class="flex flex-col gap-3">
            <p
              v-if="status"
              class="rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
              role="status"
            >
              {{ status }}
            </p>
            <p
              v-if="form.errors.email"
              class="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm"
              role="alert"
            >
              {{ form.errors.email }}
            </p>
          </div>

          <div>
            <label for="forgot-email" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.email || 'Email' }}
            </label>
            <input
              id="forgot-email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              :class="inputClass(!!form.errors.email)"
            />
          </div>

          <button
            type="submit"
            :disabled="form.processing"
            class="mt-1 rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-60"
          >
            {{ form.processing ? '…' : messages.auth?.submitForgotPassword }}
          </button>
        </form>

        <div class="space-y-4 border-t border-slate-200/80 pt-5">
          <p class="text-center text-sm text-slate-600">
            {{ messages.auth?.needAccount || 'Нет аккаунта?' }}
            <Link :href="route('register')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.needAccountLink || 'Зарегистрироваться' }}
            </Link>
          </p>
          <p class="text-center text-sm text-slate-600">
            <Link :href="route('login')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.backToLogin }}
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

const inputClass = (invalid) =>
  [
    'w-full rounded-xl border-2 px-4 py-3 text-dark outline-none transition-colors',
    invalid
      ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:bg-white'
      : 'border-slate-200 bg-slate-50 focus:border-primary focus:bg-white',
  ].join(' ');

const form = useForm({
  email: '',
});

const submit = () => {
  form.post(route('password.email'));
};
</script>
