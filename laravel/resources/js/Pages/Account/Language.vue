<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.accountTabLanguage || 'Язык'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <div class="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/80 p-6 sm:p-8">
        <p class="mb-6 max-w-xl text-slate-600">{{ messages.auth?.languageInterface }}</p>
        <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            :disabled="loading"
            @click="setLanguage('ru')"
            :class="['flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-center transition-all disabled:opacity-60 sm:min-h-[5rem] sm:flex-initial sm:min-w-[10rem]', locale === 'ru' ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10' : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm']"
          >
            <span class="text-2xl leading-none" aria-hidden="true">🇷🇺</span>
            <span class="text-sm font-bold">{{ messages.nav?.langRu || 'Русский' }}</span>
          </button>
          
          <button
            type="button"
            :disabled="loading"
            @click="setLanguage('en')"
            :class="['flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-center transition-all disabled:opacity-60 sm:min-h-[5rem] sm:flex-initial sm:min-w-[10rem]', locale === 'en' ? 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/10' : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm']"
          >
            <span class="text-2xl leading-none" aria-hidden="true">🇬🇧</span>
            <span class="text-sm font-bold">{{ messages.nav?.langEn || 'English' }}</span>
          </button>
        </div>
        
        <p v-if="error" class="mt-4 text-sm font-semibold text-red-700" role="alert">
          {{ error }}
        </p>
        
        <p class="mt-6 text-xs text-slate-500">{{ messages.auth?.accountLanguageNavHint }}</p>
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
});

const messages = computed(() => publicMessages[props.locale]);
const loading = ref(false);
const error = ref(null);

const setLanguage = (next) => {
  if (next === props.locale) return;
  error.value = null;
  loading.value = true;
  
  router.patch('/account/language', { language: next }, {
    onSuccess: () => {
      loading.value = false;
      // Just simple redirect
      window.location.href = next === 'en' ? '/en/account/language' : '/account/language';
    },
    onError: (err) => {
      error.value = err.language || messages.value.auth?.errors?.network;
      loading.value = false;
    }
  });
};
</script>
