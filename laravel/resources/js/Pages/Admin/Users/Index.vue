<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.usersTitle || 'Пользователи'" />

    <div class="space-y-6">
      <h1 class="text-2xl font-black text-dark">{{ messages.adminPanel?.usersTitle || 'Пользователи' }}</h1>

      <form @submit.prevent="applyFilters" class="flex flex-wrap items-end gap-3">
        <label class="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.usersSearch || 'Поиск пользователей' }}
          <input
            type="search"
            v-model="filtersForm.q"
            :placeholder="messages.adminPanel?.usersSearchPlaceholder || 'id, email, имя…'"
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
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <AdminThSort :label="messages.adminPanel?.usersColId || 'ID'" column="id" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.usersColEmail || 'Email'" column="email" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.usersColName || 'Имя'" column="name" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.usersColRegistered || 'Зарегистрирован'" column="created_at" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <AdminThSort :label="messages.adminPanel?.usersColSub || 'Подписка до'" column="subscription_until" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <th class="px-3 py-3">{{ messages.adminPanel?.usersColTheir || 'Is Their' }}</th>
              <AdminThSort :label="messages.adminPanel?.usersColAdmin || 'Админ'" column="is_admin" :sort="filters.sort" :dir="filters.dir" :basePath="basePath" :common="filters" />
              <th class="px-3 py-3">{{ messages.adminPanel?.usersAction || 'Действие' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in rows.data" :key="u.id" class="border-b border-slate-100 hover:bg-slate-50/80">
              <td class="px-3 py-2 font-mono font-semibold">{{ u.id }}</td>
              <td class="max-w-[180px] truncate px-3 py-2">{{ u.email || '—' }}</td>
              <td class="max-w-[140px] truncate px-3 py-2">{{ u.name || '—' }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(u.created_at) }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(u.subscription_until) }}</td>
              <td class="px-3 py-2">{{ u.is_their ? (messages.adminPanel?.yes || 'Да') : (messages.adminPanel?.no || 'Нет') }}</td>
              <td class="px-3 py-2">{{ u.is_admin ? (messages.adminPanel?.yes || 'Да') : (messages.adminPanel?.no || 'Нет') }}</td>
              <td class="px-3 py-2">
                <Link
                  :href="route('admin.users.edit', u.id)"
                  class="font-bold text-primary hover:underline"
                >
                  {{ messages.adminPanel?.usersAction || 'Открыть' }}
                </Link>
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
  users: Object,
  filters: { type: Object, default: () => ({}) },
});

const rows = computed(() => props.users);
const messages = computed(() => publicMessages[props.locale]);
const basePath = computed(() => props.locale === 'en' ? '/en/admin/users' : '/admin/users');

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

const fmtDate = (val) => {
  if (!val) return '—';
  return new Date(val).toISOString().slice(0, 10);
};
</script>
