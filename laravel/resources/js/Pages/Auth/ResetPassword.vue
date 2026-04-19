<template>
  <PublicLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.resetPasswordTitle || 'Новый пароль'" />
    <AuthCard
      :messages="messages"
      :title="messages.auth?.resetPasswordTitle || 'Новый пароль'"
      :subtitle="messages.auth?.resetPasswordBlurb"
      kind="reset-password"
    >
      <div class="flex flex-col gap-5">
        <form @submit.prevent="submit" class="flex flex-col gap-5" novalidate>
          <p
            v-if="form.errors.email || form.errors.password || form.errors.password_confirmation"
            class="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm"
            role="alert"
          >
            {{
              form.errors.email ||
                form.errors.password ||
                form.errors.password_confirmation ||
                messages.auth?.errors?.server
            }}
          </p>

          <div>
            <label for="reset-email" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.email || 'Email' }}
            </label>
            <div
              class="flex w-full items-center rounded-xl border-2 border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner"
            >
              <span class="truncate">{{ form.email || '—' }}</span>
            </div>
          </div>

          <div>
            <label for="reset-password" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.newPasswordLabel || 'Новый пароль' }}
            </label>
            <input
              id="reset-password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              :class="inputClass(!!form.errors.password)"
            />
          </div>

          <div>
            <label for="reset-password-confirmation" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.confirmPasswordLabel || 'Повторите пароль' }}
            </label>
            <input
              id="reset-password-confirmation"
              v-model="form.password_confirmation"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              :class="inputClass(!!form.errors.password_confirmation)"
            />
          </div>

          <button
            type="submit"
            :disabled="form.processing"
            class="mt-1 rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-60"
          >
            {{ form.processing ? '…' : messages.auth?.resetPasswordSubmit }}
          </button>
        </form>

        <div class="space-y-3 border-t border-slate-200/80 pt-5 text-center text-sm text-slate-600">
          <p v-if="canResetPassword">
            <Link :href="route('password.request')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.requestAnotherResetLink }}
            </Link>
          </p>
          <p>
            <Link :href="route('login')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.backToLogin }}
            </Link>
            <span class="mx-2 text-slate-300">·</span>
            <Link :href="route('register')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.needAccountLink || 'Регистрация' }}
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
  token: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    default: '',
  },
  canResetPassword: {
    type: Boolean,
    default: true,
  },
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
  token: props.token,
  email: props.email ?? '',
  password: '',
  password_confirmation: '',
});

const submit = () => {
  form.post(route('password.store'), {
    onFinish: () => form.reset('password', 'password_confirmation'),
  });
};
</script>
