<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.supportTitle || 'Заявки (Тикеты)'" />

    <div class="space-y-6">
      <h1 class="text-2xl font-black text-dark">{{ messages.adminPanel?.supportTitle || 'Заявки (Тикеты)' }}</h1>

      <form @submit.prevent="applyFilters" class="flex flex-wrap items-end gap-3">
        <label class="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.adminTableSearch || 'Поиск' }}
          <input
            type="search"
            v-model="filtersForm.q"
            :placeholder="messages.adminPanel?.adminTableSearchPlaceholder || 'id, тема…'"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm normal-case font-normal"
          />
        </label>
        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.adminTablePerPage || 'На странице' }}
          <select
            v-model="filtersForm.limit"
            class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono normal-case"
          >
            <option v-for="n in [10, 20, 25, 40, 50, 100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <button
          type="submit"
          class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          {{ messages.adminPanel?.adminTableApply || 'Применить' }}
        </button>
      </form>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[800px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <AdminThSort :label="messages.adminPanel?.supportColId || 'ID'" column="id" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.supportColUser || 'Пользователь'" column="user_id" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.supportColSubject || 'Тема'" column="subject" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.supportColStatus || 'Статус'" column="status" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.supportColDate || 'Создана'" column="created_at" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in rows.data" :key="t.id" class="border-b border-slate-100 hover:bg-slate-50/80">
              <td class="px-3 py-2 font-mono font-semibold">
                <Link :href="route('admin.support.show', t.id)" class="text-primary hover:underline">
                  {{ t.id }}
                </Link>
              </td>
              <td class="px-3 py-2">
                <span class="font-mono text-xs">{{ t.user_id }}</span>
                <br />
                <span class="text-xs text-slate-600">{{ t.user?.email || t.user?.name || '—' }}</span>
              </td>
              <td class="max-w-[240px] truncate px-3 py-2">{{ t.subject }}</td>
              <td class="px-3 py-2">{{ formatStatus(t.status) }}</td>
              <td class="px-3 py-2 font-mono text-xs">
                {{ formatDateTime(t.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span class="text-slate-600">
          {{ messages.adminPanel?.adminTableTotal || 'Всего' }}: {{ rows.total }} · {{ rows.current_page }} / {{ rows.last_page }}
        </span>
        <div class="flex gap-2">
          <Link
            v-if="rows.prev_page_url"
            :href="rows.prev_page_url"
            class="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
          >
            {{ messages.adminPanel?.paginationPrev || 'Назад' }}
          </Link>
          <Link
            v-if="rows.next_page_url"
            :href="rows.next_page_url"
            class="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
          >
            {{ messages.adminPanel?.paginationNext || 'Вперёд' }}
          </Link>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import AdminThSort from '@/Components/AdminThSort.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: { type: String, default: 'ru' },
  tickets: Object,
  filters: { type: Object, default: () => ({}) },
});

const rows = computed(() => props.tickets);
const messages = computed(() => publicMessages[props.locale]);
const basePath = computed(() => props.locale === 'en' ? '/en/admin/support' : '/admin/support');

const filtersForm = reactive({
  q: props.filters.q || '',
  limit: props.filters.limit || 25,
});

const applyFilters = () => {
  const query = {
    ...props.filters,
    q: filtersForm.q,
    limit: filtersForm.limit,
  };
  
  if (!query.q) delete query.q;
  delete query.page;
  
  router.get(basePath.value, query, { preserveState: true });
};

const formatDateTime = (val) => {
  if (!val) return '';
  return new Date(val).toISOString().slice(0, 16).replace('T', ' ');
};

const formatStatus = (status) => {
  const m = messages.value;
  switch (status) {
    case 'open':
      return m.ticketStatusOpen || 'Открыт';
    case 'in_progress':
      return m.ticketStatusProgress || 'В работе';
    case 'resolved':
      return m.ticketStatusResolved || 'Решён';
    case 'closed':
      return m.ticketStatusClosed || 'Закрыт';
    default:
      return status;
  }
};
</script>
