<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="`${messages.supportTickets?.ticketPrefix || 'Заявка'} #${ticket.id}`" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <header>
        <Link
          :href="baseHref"
          class="mb-4 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-dark"
        >
          &larr; {{ messages.supportTickets?.backToList || 'Ко всем заявкам' }}
        </Link>
        <div class="flex flex-wrap items-center gap-4">
          <h2 class="text-xl font-black tracking-tight text-dark sm:text-2xl">
            {{ ticket.subject }}
          </h2>
          <span
            :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
              statusClass(ticket.status)
            ]"
          >
            {{ statusLabel(ticket.status) }}
          </span>
        </div>
        <p class="mt-2 text-sm text-slate-500">
          {{ messages.supportTickets?.createdAt }}: {{ formatTicketDateTime(ticket.created_at) }}
        </p>
      </header>

      <div class="space-y-8">
        <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
          <TicketMessageThread
            :ticket="ticket"
            :replies="replies"
            :messages="messages"
            perspective="account"
          />
        </div>
        <div class="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-5 shadow-inner sm:p-6">
          <TicketReplyForm
            :ticketId="ticket.id"
            variant="account"
            :messages="messages"
          />
        </div>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import TicketMessageThread from '@/Components/TicketMessageThread.vue';
import TicketReplyForm from '@/Components/TicketReplyForm.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
  ticket: {
    type: Object,
    required: true,
  },
  replies: {
    type: Array,
    default: () => [],
  },
});

const messages = computed(() => publicMessages[props.locale]);
const baseHref = computed(() => props.locale === 'en' ? '/en/account/tickets' : '/account/tickets');

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
