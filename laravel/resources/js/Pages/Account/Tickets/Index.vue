<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.supportTickets?.pageTitle || 'Заявки в поддержку'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-black tracking-tight text-dark sm:text-2xl">
            {{ messages.supportTickets?.pageTitle }}
          </h2>
          <p class="mt-1 max-w-xl text-sm text-slate-600">
            {{ messages.supportTickets?.pageSubtitle }}
          </p>
        </div>
        <Link
          :href="newHref"
          class="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover sm:w-auto"
        >
          <span class="mr-2 text-lg leading-none">+</span>
          {{ messages.supportTickets?.newTicket }}
        </Link>
      </header>

      <div v-if="!tickets || tickets.length === 0" class="rounded-2xl border border-slate-200/80 bg-white p-8 text-center sm:p-12">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          💬
        </div>
        <p class="text-slate-600">{{ messages.supportTickets?.listEmpty }}</p>
      </div>

      <div v-else class="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50/90 text-xs font-black uppercase tracking-wide text-slate-500">
              <th class="px-5 py-4">{{ messages.supportTickets?.subject }}</th>
              <th class="px-5 py-4">{{ messages.supportTickets?.statusLabel }}</th>
              <th class="px-5 py-4">{{ messages.supportTickets?.updatedAt }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="group transition-colors hover:bg-slate-50"
            >
              <td class="px-5 py-4">
                <Link
                  :href="`${baseHref}/${ticket.id}`"
                  class="font-bold text-dark group-hover:text-primary"
                >
                  {{ ticket.subject }}
                </Link>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                    statusClass(ticket.status)
                  ]"
                >
                  {{ statusLabel(ticket.status) }}
                </span>
              </td>
              <td class="px-5 py-4 text-slate-500">
                {{ formatTicketDateTime(ticket.updated_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  tickets: {
    type: Array,
    default: () => [],
  },
});

const messages = computed(() => publicMessages[props.locale]);
const baseHref = computed(() => props.locale === 'en' ? '/en/account/tickets' : '/account/tickets');
const newHref = computed(() => `${baseHref.value}/new`);

const statusClass = (status) => {
  if (status === 'open') return 'bg-emerald-100 text-emerald-800';
  if (status === 'in_progress') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
};

const statusLabel = (status) => {
  const t = messages.value.supportTickets || {};
  if (status === 'open') return t.statusOpen || 'Открыта';
  if (status === 'in_progress') return t.statusInProgress || 'В работе';
  return t.statusClosed || 'Закрыта';
};

const formatTicketDateTime = (dateStr) => {
  if (!dateStr) return '';
  const loc = props.locale === 'en' ? 'en-US' : 'ru-RU';
  return new Date(dateStr).toLocaleString(loc, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};
</script>
