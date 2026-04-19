<template>
  <PublicLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.loginTitle || 'Вход'" />
    <AuthCard :messages="messages" :title="messages.auth?.loginTitle || 'Вход'" kind="login">
      <div class="flex flex-col gap-5">
        <form @submit.prevent="submit" class="flex flex-col gap-5" novalidate>
          <div v-if="status || loginErrorText" class="flex flex-col gap-3">
            <p
              v-if="status"
              class="rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm"
              role="status"
            >
              {{ status }}
            </p>
            <p
              v-if="loginErrorText"
              class="rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-900 shadow-sm"
              role="alert"
            >
              {{ loginErrorText }}
            </p>
          </div>

          <div>
            <label for="login-email" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.auth?.email || 'Email' }}
            </label>
            <input
              id="login-email"
              type="email"
              v-model="form.email"
              required
              autocomplete="email"
              :class="inputClass(!!form.errors.email)"
            />
          </div>

          <div>
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label for="login-password" class="block text-sm font-bold text-slate-700">
                {{ messages.auth?.password || 'Пароль' }}
              </label>
              <Link
                v-if="canResetPassword"
                :href="route('password.request')"
                class="text-sm font-bold text-primary hover:underline"
              >
                {{ messages.auth?.forgotPasswordLink || 'Забыли пароль?' }}
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              v-model="form.password"
              required
              minlength="8"
              autocomplete="current-password"
              :class="inputClass(!!form.errors.password)"
            />
          </div>

          <button
            type="submit"
            :disabled="form.processing"
            class="mt-1 rounded-xl bg-primary py-4 text-lg font-extrabold text-white shadow-md transition-all hover:bg-primary-hover disabled:opacity-60"
          >
            {{ form.processing ? "…" : (messages.auth?.submitLogin || 'Войти') }}
          </button>
        </form>

        <div class="border-t border-slate-200/80 pt-5">
          <p class="text-center text-sm text-slate-600">
            {{ messages.auth?.needAccount || 'Нет аккаунта?' }}
            <Link :href="route('register')" class="font-bold text-primary hover:underline">
              {{ messages.auth?.needAccountLink || 'Зарегистрироваться' }}
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
  canResetPassword: Boolean,
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
  remember: true, // Auto-remember by default like many modern apps, or keep false
});

/** Laravel без lang-файлов отдаёт ключи вида auth.failed — показываем нормальный текст. */
const loginErrorText = computed(() => {
  const raw = form.errors.email || form.errors.password;
  if (!raw) return '';
  if (typeof raw === 'string' && /^auth\./.test(raw)) {
    return messages.value.auth?.errors?.credentials || 'Неверный email или пароль.';
  }
  return raw;
});

const submit = () => {
  form.post(route('login'), {
    onFinish: () => form.reset('password'),
  });
};
</script>
