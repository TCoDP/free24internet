<template>
  <div v-if="!hasPassword" class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
    <h3 class="text-lg font-black text-dark">{{ messages.auth?.accountSectionSecurity }}</h3>
    <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ messages.auth?.accountPasswordSetInitialBlurb }}</p>
    
    <form class="mt-6 space-y-4" @submit.prevent="submitSetPassword">
      <div>
        <label for="acc-init-new" class="mb-2 block text-sm font-bold text-slate-700">
          {{ messages.auth?.newPasswordLabel }}
        </label>
        <input
          id="acc-init-new"
          type="password"
          v-model="formSet.newPassword"
          autocomplete="new-password"
          minlength="8"
          class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
        />
      </div>
      <div>
        <label for="acc-init-confirm" class="mb-2 block text-sm font-bold text-slate-700">
          {{ messages.auth?.confirmPasswordLabel }}
        </label>
        <input
          id="acc-init-confirm"
          type="password"
          v-model="formSet.confirmPassword"
          autocomplete="new-password"
          minlength="8"
          class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
        />
      </div>
      
      <p v-if="formSet.errors.newPassword || formSet.errors.confirmPassword" class="text-sm font-semibold text-red-700" role="alert">
        {{ formSet.errors.newPassword || formSet.errors.confirmPassword }}
      </p>
      <p v-if="formSet.recentlySuccessful" class="text-sm font-semibold text-emerald-700">
        {{ messages.auth?.passwordSaved }}
      </p>
      
      <button
        type="submit"
        :disabled="formSet.processing"
        class="w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:from-slate-900 hover:to-black disabled:opacity-60 sm:w-auto"
      >
        {{ formSet.processing ? "…" : messages.auth?.savePassword }}
      </button>
    </form>
  </div>

  <div v-else class="grid gap-10 lg:grid-cols-2 lg:gap-12">
    <div class="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/40 to-white p-6 sm:p-8">
      <h3 class="text-lg font-black text-dark">{{ messages.auth?.accountSectionSecurity }}</h3>
      <p class="mt-3 text-sm leading-relaxed text-slate-600">{{ messages.auth?.accountPasswordHintEmail }}</p>
    </div>
    
    <form
      class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8"
      @submit.prevent="submitChangePassword"
    >
      <div class="space-y-4">
        <div>
          <label for="acc-cur-pw" class="mb-2 block text-sm font-bold text-slate-700">
            {{ messages.auth?.currentPasswordLabel }}
          </label>
          <input
            id="acc-cur-pw"
            type="password"
            v-model="formChange.currentPassword"
            autocomplete="current-password"
            class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
        <div>
          <label for="acc-new-pw" class="mb-2 block text-sm font-bold text-slate-700">
            {{ messages.auth?.newPasswordLabel }}
          </label>
          <input
            id="acc-new-pw"
            type="password"
            v-model="formChange.newPassword"
            autocomplete="new-password"
            minlength="8"
            class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
        <div>
          <label for="acc-confirm-pw" class="mb-2 block text-sm font-bold text-slate-700">
            {{ messages.auth?.confirmPasswordLabel }}
          </label>
          <input
            id="acc-confirm-pw"
            type="password"
            v-model="formChange.confirmPassword"
            autocomplete="new-password"
            minlength="8"
            class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
          />
        </div>
      </div>
      
      <p v-if="Object.keys(formChange.errors).length > 0" class="mt-4 text-sm font-semibold text-red-700" role="alert">
        {{ formChange.errors.currentPassword || formChange.errors.newPassword || formChange.errors.confirmPassword }}
      </p>
      <p v-if="formChange.recentlySuccessful" class="mt-4 text-sm font-semibold text-emerald-700">
        {{ messages.auth?.passwordSaved }}
      </p>
      
      <button
        type="submit"
        :disabled="formChange.processing"
        class="mt-6 w-full rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition-all hover:from-slate-900 hover:to-black disabled:opacity-60 sm:w-auto"
      >
        {{ formChange.processing ? "…" : messages.auth?.savePassword }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3';

const props = defineProps({
  messages: {
    type: Object,
    required: true,
  },
  hasPassword: {
    type: Boolean,
    default: true,
  },
});

const formSet = useForm({
  newPassword: '',
  confirmPassword: '',
});

const formChange = useForm({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const submitSetPassword = () => {
  formSet.post('/api/account/password', {
    onSuccess: () => formSet.reset(),
  });
};

const submitChangePassword = () => {
  formChange.post('/api/account/password', {
    onSuccess: () => formChange.reset(),
  });
};
</script>
