<template>
  <AdminLayout :locale="locale" :messages="messages">
    <Head :title="pageTitle" />

    <div class="mx-auto max-w-4xl space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-black text-dark">{{ pageTitle }}</h1>
        <Link
          :href="route('admin.articles.index')"
          class="text-sm font-bold text-primary hover:underline"
        >
          {{ messages.adminPanel?.articlesFormBack || 'К списку' }}
        </Link>
      </div>

      <form class="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
            {{ messages.adminPanel?.articlesFormLocale || 'Локаль' }}
            <select v-model="form.locale" required class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case">
              <option value="ru">ru</option>
              <option value="en">en</option>
            </select>
            <p v-if="form.errors.locale" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.locale }}</p>
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
            {{ messages.adminPanel?.articlesFormSlug || 'Slug' }}
            <input v-model="form.slug" required class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case font-mono" />
            <p v-if="form.errors.slug" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.slug }}</p>
          </label>
        </div>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormTitle || 'Заголовок' }}
          <input v-model="form.title" required class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          <p v-if="form.errors.title" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.title }}</p>
        </label>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormMetaTitle || 'Meta title' }}
          <input v-model="form.meta_title" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          <p v-if="form.errors.meta_title" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.meta_title }}</p>
        </label>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormMetaDesc || 'Meta description' }}
          <textarea v-model="form.meta_description" rows="3" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          <p v-if="form.errors.meta_description" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.meta_description }}</p>
        </label>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormMetaKeywords || 'Meta keywords' }}
          <input v-model="form.meta_keywords" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
            {{ messages.adminPanel?.articlesFormOgTitle || 'OG title' }}
            <input v-model="form.og_title" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
            {{ messages.adminPanel?.articlesFormOgDesc || 'OG description' }}
            <textarea v-model="form.og_description" rows="2" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          </label>
        </div>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormExcerpt || 'Краткое описание' }}
          <textarea v-model="form.excerpt" rows="2" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
        </label>

        <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {{ messages.adminPanel?.articlesFormBody || 'HTML' }}
          <textarea v-model="form.body_html" required rows="16" class="font-mono text-xs leading-relaxed rounded-xl border border-slate-200 px-3 py-2 normal-case md:text-sm" />
          <p v-if="form.errors.body_html" class="text-xs font-semibold normal-case text-red-600">{{ form.errors.body_html }}</p>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input v-model="form.is_published" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-primary" />
            {{ messages.adminPanel?.articlesFormPublished || 'Опубликовано' }}
          </label>
          <label class="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
            {{ messages.adminPanel?.articlesFormPublishedAt || 'Дата публикации' }}
            <input v-model="form.published_at" type="datetime-local" class="rounded-xl border border-slate-200 px-3 py-2 text-sm normal-case" />
          </label>
        </div>

        <p v-if="form.errors.is_published" class="text-xs font-semibold text-red-600">{{ form.errors.is_published }}</p>
        <p v-if="form.errors.published_at" class="text-xs font-semibold text-red-600">{{ form.errors.published_at }}</p>

        <button
          type="submit"
          class="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
          :disabled="form.processing"
        >
          {{ messages.adminPanel?.articlesFormSave || 'Сохранить' }}
        </button>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed } from 'vue';
import { Head, Link, useForm } from '@inertiajs/vue3';
import AdminLayout from '@/Layouts/AdminLayout.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: { type: String, default: 'ru' },
  article: { type: Object, default: null },
});

const messages = computed(() => publicMessages[props.locale]);

const isEdit = computed(() => !!props.article?.id);

const pageTitle = computed(() =>
  isEdit.value
    ? messages.value.adminPanel?.articlesFormEdit || 'Редактирование'
    : messages.value.adminPanel?.articlesFormCreate || 'Новая статья',
);

const form = useForm({
  locale: props.article?.locale || 'ru',
  slug: props.article?.slug || '',
  title: props.article?.title || '',
  meta_title: props.article?.meta_title || '',
  meta_description: props.article?.meta_description || '',
  meta_keywords: props.article?.meta_keywords || '',
  og_title: props.article?.og_title || '',
  og_description: props.article?.og_description || '',
  excerpt: props.article?.excerpt || '',
  body_html: props.article?.body_html || '',
  is_published: !!props.article?.is_published,
  published_at: props.article?.published_at || '',
});

const submit = () => {
  if (isEdit.value) {
    form.put(route('admin.articles.update', props.article.id));
  } else {
    form.post(route('admin.articles.store'));
  }
};
</script>
