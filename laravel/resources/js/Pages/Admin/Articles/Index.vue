<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="messages.adminPanel?.articlesTitle || 'Статьи'" />

    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-black text-dark">{{ messages.adminPanel?.articlesTitle || 'Статьи' }}</h1>
        <Link
          :href="route('admin.articles.create')"
          class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          {{ messages.adminPanel?.articlesCreate || 'Новая статья' }}
        </Link>
      </div>

      <form @submit.prevent="applyFilters" class="flex flex-wrap items-end gap-3">
        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFiltersLocale || 'Язык' }}
          <select v-model="filtersForm.locale" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case font-normal">
            <option value="">{{ messages.adminPanel?.articlesFiltersAll || 'Все' }}</option>
            <option value="ru">ru</option>
            <option value="en">en</option>
          </select>
        </label>
        <label class="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFiltersSearch || 'Поиск' }}
          <input
            v-model="filtersForm.q"
            type="search"
            class="rounded-xl border border-slate-200 px-4 py-2 text-sm normal-case font-normal"
          />
        </label>
        <button type="submit" class="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900">
          {{ messages.adminPanel?.articlesFiltersApply || 'Применить' }}
        </button>
      </form>

      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColId || 'ID' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColLocale || 'Язык' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColSlug || 'Slug' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColTitle || 'Заголовок' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColPublished || 'Публикация' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesColUpdated || 'Обновлено' }}</th>
              <th class="px-3 py-3">{{ messages.adminPanel?.articlesActionEdit || 'Действие' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows.data" :key="row.id" class="border-b border-slate-100 hover:bg-slate-50/80">
              <td class="px-3 py-2 font-mono font-semibold">{{ row.id }}</td>
              <td class="px-3 py-2 font-mono">{{ row.locale }}</td>
              <td class="max-w-[160px] truncate px-3 py-2 font-mono text-xs">{{ row.slug }}</td>
              <td class="max-w-[220px] truncate px-3 py-2">{{ row.title }}</td>
              <td class="px-3 py-2">{{ row.is_published ? (messages.adminPanel?.yes || 'Да') : (messages.adminPanel?.no || 'Нет') }}</td>
              <td class="px-3 py-2 font-mono text-xs">{{ fmtDate(row.updated_at) }}</td>
              <td class="px-3 py-2">
                <Link :href="route('admin.articles.edit', row.id)" class="font-bold text-primary hover:underline">
                  {{ messages.adminPanel?.articlesActionEdit || 'Правка' }}
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
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: { type: String, default: 'ru' },
  articles: { type: Object, required: true },
  filters: { type: Object, default: () => ({}) },
});

const rows = computed(() => props.articles);
const messages = computed(() => publicMessages[props.locale]);
const basePath = computed(() => (props.locale === 'en' ? '/en/admin/articles' : '/admin/articles'));

const filtersForm = reactive({
  locale: props.filters.locale || '',
  q: props.filters.q || '',
});

const applyFilters = () => {
  const query = {};
  if (filtersForm.locale) query.locale = filtersForm.locale;
  if (filtersForm.q) query.q = filtersForm.q;
  router.get(basePath.value, query, { preserveState: true });
};

const fmtDate = (val) => {
  if (!val) return '—';
  return new Date(val).toISOString().slice(0, 10);
};
</script>
