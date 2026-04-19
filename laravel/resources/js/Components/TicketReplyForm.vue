<template>
  <div class="space-y-3">
    <label class="block text-xs font-bold uppercase tracking-wider text-slate-500" :for="`reply-${variant}-${ticketId}`">
      {{ messages.supportTickets?.message || 'Сообщение' }}
    </label>
    <textarea
      :id="`reply-${variant}-${ticketId}`"
      v-model="form.body"
      rows="4"
      :placeholder="messages.supportTickets?.replyPlaceholder || 'Напишите сообщение…'"
      class="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    ></textarea>
    <button
      type="button"
      :disabled="form.processing || !form.body.trim()"
      @click="submit"
      class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
    >
      {{ form.processing ? (messages.supportTickets?.replySubmitting || 'Отправка…') : (messages.supportTickets?.replySubmit || 'Отправить') }}
    </button>
    <p v-if="form.errors.body" class="text-sm font-semibold text-red-700">{{ form.errors.body }}</p>
  </div>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3';

const props = defineProps({
  ticketId: [Number, String],
  variant: {
    type: String,
    default: 'account',
  },
  messages: Object,
});

const form = useForm({
  body: '',
});

const submit = () => {
  const url =
    props.variant === 'account'
      ? route('account.tickets.reply', props.ticketId)
      : route('admin.support.reply', props.ticketId);

  form.post(url, {
    preserveScroll: true,
    onSuccess: () => form.reset('body'),
  });
};
</script>
