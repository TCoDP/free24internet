<template>
  <div class="min-h-[calc(100vh-4rem)] bg-light px-4 pb-20 pt-20 md:pt-24">
    <div class="mx-auto w-full max-w-md">
      <BreadcrumbTrail
        v-if="breadcrumbItems.length > 0"
        :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
        :items="breadcrumbItems"
        class="mb-6"
      />
      <div class="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl md:p-10">
        <h1
          class="text-center text-3xl font-black tracking-tight text-dark"
          :class="subtitle ? 'mb-3' : 'mb-8'"
        >
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="mb-8 text-center text-sm font-medium leading-relaxed text-slate-600"
        >
          {{ subtitle }}
        </p>
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BreadcrumbTrail from './BreadcrumbTrail.vue';

const props = defineProps({
  messages: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  kind: {
    type: String, // 'login', 'register', 'terms', 'privacy', 'forgot-password', 'reset-password', 'verify-email'
    required: true,
  },
});

const breadcrumbItems = computed(() => {
  const b = props.messages.breadcrumb;
  if (!b) return [];

  const homeHref = props.messages.locale === 'en' ? '/en' : '/';
  
  let label = '';
  switch (props.kind) {
    case 'login':
      label = b.login;
      break;
    case 'register':
      label = b.register;
      break;
    case 'terms':
      label = b.terms;
      break;
    case 'privacy':
      label = b.privacy;
      break;
    case 'forgot-password':
      label = b.forgotPassword;
      break;
    case 'reset-password':
      label = b.resetPassword;
      break;
    case 'verify-email':
      label = b.verifyEmail;
      break;
  }

  if (!label) return [];

  return [
    { href: homeHref, label: b.home },
    { label },
  ];
});
</script>
