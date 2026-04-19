<template>
  <AccountLayout :locale="locale" :messages="messages">
    <Head :title="messages.supportTickets?.newTicket || 'Новая заявка'" />

    <div class="mx-auto max-w-5xl space-y-8 md:space-y-12">
      <header>
        <Link
          :href="baseHref"
          class="mb-4 inline-flex items-center text-sm font-semibold text-slate-500 hover:text-dark"
        >
          &larr; {{ messages.supportTickets?.backToList || 'Ко всем заявкам' }}
        </Link>
        <h2 class="text-xl font-black tracking-tight text-dark sm:text-2xl">
          {{ messages.supportTickets?.newTicket || 'Новая заявка' }}
        </h2>
      </header>

      <div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <form @submit.prevent="submit" class="mx-auto max-w-2xl space-y-6">
          <p v-if="form.errors.subject || form.errors.body" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
            {{ form.errors.subject || form.errors.body }}
          </p>

          <div>
            <label for="ticket-subject" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.supportTickets?.subject || 'Тема' }}
            </label>
            <input
              id="ticket-subject"
              type="text"
              v-model="form.subject"
              maxlength="255"
              required
              minlength="3"
              :placeholder="messages.supportTickets?.placeholderSubject || 'Кратко, о чём заявка'"
              class="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
            />
          </div>

          <div>
            <label for="ticket-body" class="mb-2 block text-sm font-bold text-slate-700">
              {{ messages.supportTickets?.message || 'Сообщение' }}
            </label>
            <textarea
              id="ticket-body"
              v-model="form.body"
              rows="8"
              required
              minlength="10"
              :placeholder="messages.supportTickets?.placeholderMessage"
              class="w-full min-h-[12rem] resize-y rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-dark outline-none transition-colors focus:border-primary focus:bg-white"
            ></textarea>
          </div>

          <div class="flex flex-wrap gap-4">
            <button
              type="submit"
              :disabled="form.processing"
              class="rounded-xl bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-60"
            >
              {{ form.processing ? (messages.supportTickets?.submitting || 'Отправка…') : (messages.supportTickets?.submit || 'Отправить заявку') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import AccountLayout from '@/Layouts/AccountLayout.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
});

const messages = computed(() => publicMessages[props.locale]);
const baseHref = computed(() => props.locale === 'en' ? '/en/account/tickets' : '/account/tickets');

const form = useForm({
  subject: '',
  body: '',
});

const submit = () => {
  form.post('/account/tickets');
};
</script>
