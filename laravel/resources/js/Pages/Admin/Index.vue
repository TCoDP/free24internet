<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.navDashboard || 'Обзор'" />

    <div class="space-y-6">
      <h1 class="text-2xl font-black text-dark">{{ messages.adminPanel?.navDashboard || 'Обзор' }}</h1>
      
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ messages.adminPanel?.dashboardUsers || 'Пользователей' }}</p>
          <p class="mt-2 text-3xl font-black text-dark">{{ stats.users }}</p>
        </div>
        
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ messages.adminPanel?.dashboardTicketsOpen || 'Заявок открыто / в работе' }}</p>
          <p class="mt-2 text-3xl font-black text-dark">{{ stats.ticketsOpen }}</p>
        </div>
        
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ messages.adminPanel?.dashboardTicketsTotal || 'Заявок всего' }}</p>
          <p class="mt-2 text-3xl font-black text-dark">{{ stats.ticketsTotal }}</p>
        </div>
        
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ messages.adminPanel?.dashboardTx || 'Завершённых оплат' }}</p>
          <p class="mt-2 text-3xl font-black text-dark">{{ stats.transactionsCompleted }}</p>
        </div>
        
        <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ messages.adminPanel?.dashboardReferralRows || 'Строк в истории рефералов' }}</p>
          <p class="mt-2 text-3xl font-black text-dark">{{ stats.referralRewards }}</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
  locale: {
    type: String,
    default: 'ru',
  },
});

const messages = computed(() => publicMessages[props.locale]);
</script>
