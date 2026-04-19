<template>
  <PublicLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.registerTitle || 'Регистрация'" />
    <AuthCard :messages="messages" :title="messages.auth?.registerTitle || 'Регистрация'" kind="register">
      <div class="flex flex-col gap-5">
        <form @submit.prevent="submit" class="flex flex-col gap-5" novalidate>
          <p
            v-if="Object.keys(form.errors).length > 0"
            class="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm"
            role="alert"
          >
            {{
              form.errors.email ||
                form.errors.password ||
                form.errors.password_confirmation ||
                messages.auth?.errors?.server ||
                'Ошибка регистрации'
            }}
          </p>

          <div>
            <label for="reg-email" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.email || 'Email' }}
            </label>
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              :class="inputClass(!!form.errors.email)"
            />
          </div>

          <div>
            <label for="reg-password" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.password || 'Пароль' }}
            </label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              :class="inputClass(!!form.errors.password)"
            />
          </div>

          <div>
            <label for="reg-password-confirmation" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.confirmPasswordLabel || 'Повторите пароль' }}
            </label>
            <input
              id="reg-password-confirmation"
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
            {{ form.processing ? '…' : messages.auth?.submitRegister || 'Создать аккаунт' }}
          </button>

          <template v-if="canResetPassword">
            <div class="relative flex items-center justify-center py-1" aria-hidden="true">
              <div class="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
              <span
                class="relative bg-white px-3 text-xs font-bold uppercase tracking-wider text-slate-400"
              >
                {{ messages.auth?.authDividerOr }}
              </span>
            </div>
            <p class="text-center text-sm text-slate-600">
              <Link :href="route('password.request')" class="font-bold text-primary hover:underline">
                {{ messages.auth?.forgotPasswordLink }}
              </Link>
            </p>
          </template>
        </form>

        <div class="border-t border-slate-200/80 pt-5">
          <p class="text-center text-sm text-slate-600">
            {{ messages.auth?.haveAccount || 'Уже есть аккаунт?' }}
            <Link :href="route('login')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.haveAccountLink || 'Войти' }}
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
  email: '',
  password: '',
  password_confirmation: '',
});

const submit = () => {
  form.post(route('register'), {
    onFinish: () => form.reset('password', 'password_confirmation'),
  });
};
</script>
