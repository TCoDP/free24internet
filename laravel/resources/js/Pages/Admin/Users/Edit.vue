<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.userEditTitle || 'Редактирование пользователя'" />
    <AdminUserEditForm :user="user" :messages="messages" />
  </AdminLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import AdminUserEditForm from '@/Components/AdminUserEditForm.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  user: Object,
  locale: { type: String, default: 'ru' },
});

const messages = computed(() => publicMessages[props.locale]);
</script>
