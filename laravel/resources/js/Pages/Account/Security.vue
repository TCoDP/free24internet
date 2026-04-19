<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.auth?.accountSectionSecurity || 'Безопасность'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <AccountPasswordEditor
        :messages="messages"
        :hasPassword="hasPassword"
      />
    </div>
  </AccountLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import AccountPasswordEditor from '@/Components/AccountPasswordEditor.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  hasPassword: {
    type: Boolean,
    default: true,
  },
});

const messages = computed(() => publicMessages[props.locale]);
</script>
