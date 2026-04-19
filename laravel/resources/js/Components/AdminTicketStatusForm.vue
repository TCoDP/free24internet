<template>
  <div class="flex flex-wrap items-end gap-3">
    <div>
      <label class="mb-1 block text-sm font-bold text-dark" for="adm-ticket-st">
        {{ messages.adminPanel?.ticketChangeStatus || 'Статус' }}
      </label>
      <select
        id="adm-ticket-st"
        v-model="status"
        class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
      >
        <option value="open">{{ messages.supportTickets?.statusOpen || 'Открыта' }}</option>
        <option value="in_progress">{{ messages.supportTickets?.statusInProgress || 'В работе' }}</option>
        <option value="closed">{{ messages.supportTickets?.statusClosed || 'Закрыта' }}</option>
      </select>
    </div>
    <button
      type="button"
      :disabled="loading || status === current"
      @click="submit"
      class="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
    >
      {{ loading ? "…" : (messages.adminPanel?.userSave || 'Сохранить') }}
    </button>
    <p v-if="err" class="w-full text-sm font-semibold text-red-700">{{ err }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { router } from '@inertiajs/vue3';

const props = defineProps({
  ticketId: {
    type: [Number, String],
    required: true,
  },
  current: {
    type: String,
    required: true,
  },
  messages: {
    type: Object,
    required: true,
  },
});

const status = ref(props.current);
const loading = ref(false);
const err = ref(null);

const submit = () => {
  err.value = null;
  loading.value = true;
  router.put(route('admin.support.status', props.ticketId), { status: status.value }, {
    preserveScroll: true,
    onSuccess: () => {},
    onError: () => {
      err.value = props.messages.adminPanel?.errors?.saveFailed || 'Ошибка сохранения';
    },
    onFinish: () => {
      loading.value = false;
    },
  });
};
</script>
