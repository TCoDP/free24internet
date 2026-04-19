<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.tariffsTitle || 'Тарифы и цены'" />
    <AdminPricingEditor
      :messages="messages"
      :initialGlobal="pricingGlobal"
      :initialTerms="terms"
    />
  </AdminLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import AdminPricingEditor from '@/Components/AdminPricingEditor.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  pricingGlobal: Object,
  terms: Array,
  locale: { type: String, default: 'ru' },
});

const messages = computed(() => publicMessages[props.locale]);
</script>
