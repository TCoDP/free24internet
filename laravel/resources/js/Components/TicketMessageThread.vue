<template>
  <section class="space-y-4">
    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">{{ messages.supportTickets?.threadTitle || 'Переписка' }}</h3>
    <ul class="space-y-4">
      <li v-for="item in items" :key="item.key" :class="['flex', item.role === 'user' ? 'justify-start' : 'justify-end']">
        <div
          :class="['max-w-[min(100%,42rem)] rounded-2xl border px-4 py-3 text-sm shadow-sm', item.role === 'user' ? 'border-slate-200/80 bg-slate-50 text-dark' : 'border-primary/25 bg-primary/5 text-dark']"
        >
          <p class="text-xs font-bold text-slate-500">
            {{ bubbleLabel(item.role) }} · {{ formatTicketDateTime(item.at) }}
          </p>
          <pre class="mt-2 whitespace-pre-wrap font-sans leading-relaxed">{{ item.body }}</pre>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  ticket: Object,
  replies: Array,
  messages: Object,
  perspective: {
    type: String,
    default: 'account', // 'account' | 'admin'
  },
});

const items = computed(() => {
  const arr = [
    {
      key: 'initial',
      role: 'user',
      body: props.ticket.body,
      at: props.ticket.created_at,
    }
  ];
  
  if (props.replies) {
    props.replies.forEach(m => {
      arr.push({
        key: `m-${m.id}`,
        role: m.author_role,
        body: m.body,
        at: m.created_at,
      });
    });
  }
  
  return arr;
});

const bubbleLabel = (role) => {
  const t = props.messages.supportTickets || {};
  if (role === 'user') return props.perspective === 'account' ? (t.labelYou || 'Вы') : (t.labelUser || 'Пользователь');
  return t.labelSupport || 'Поддержка';
};

const formatTicketDateTime = (dateStr) => {
  if (!dateStr) return '';
  const locale = props.messages.locale === 'en' ? 'en-US' : 'ru-RU';
  return new Date(dateStr).toLocaleString(locale, {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
};
</script>
