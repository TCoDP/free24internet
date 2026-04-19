<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="article.meta_title"
      :description="article.meta_description"
      :keywords="article.meta_keywords"
      :og-title="article.og_title"
      :og-description="article.og_description"
      :twitter-title="article.twitter_title"
      :twitter-description="article.twitter_description"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
    />
    <main class="min-h-screen flex-grow px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <div class="mx-auto w-full max-w-[1400px]">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:items-start lg:gap-12">
          <aside
            v-if="toc.length > 0"
            class="border-b border-slate-200 pb-6 lg:sticky lg:top-28 lg:z-10 lg:self-start lg:border-b-0 lg:pb-0"
          >
            <nav class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:bg-slate-50/80" :aria-label="labels.tocAria">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                {{ labels.tocTitle }}
              </p>
              <ul class="space-y-1 text-sm">
                <li v-for="item in toc" :key="item.id">
                  <a
                    :href="`#${item.id}`"
                    class="block rounded-lg py-1.5 text-slate-600 transition-colors hover:bg-white hover:text-primary lg:px-2"
                    :class="{
                      'pl-2 font-semibold text-dark': item.level <= 2,
                      'border-l-2 border-slate-200 pl-3 text-slate-600': item.level >= 3,
                    }"
                  >
                    {{ item.text }}
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          <article
            class="article-body min-w-0 prose max-w-none space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm md:p-10 [&_a]:font-semibold [&_a]:text-primary hover:[&_a]:underline [&_h1]:scroll-mt-28 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-dark [&_h2]:scroll-mt-28 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-dark [&_h3]:scroll-mt-28 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-dark [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_table]:my-6 [&_table]:w-full [&_table]:text-sm [&_th]:bg-slate-50 [&_th]:p-3 [&_th]:text-left [&_th]:font-bold [&_th]:text-dark [&_td]:border-t [&_td]:border-slate-100 [&_td]:p-3"
            v-html="displayHtml"
          />
        </div>
      </div>
    </main>
  </PublicLayout>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import PublicSeoHead from '@/Components/PublicSeoHead.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: { type: String, default: 'ru' },
  article: { type: Object, required: true },
});

const messages = computed(() => publicMessages[props.locale]);

const labels = computed(() => ({
  tocTitle: messages.value.articlesShow?.tocTitle || 'On this page',
  tocAria: messages.value.articlesShow?.tocAria || 'Article navigation',
}));

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const articlesIndexHref = computed(() => (props.locale === 'en' ? '/en/articles' : '/articles'));

const canonicalUrl = computed(() => {
  const path = `${articlesIndexHref.value}/${props.article.slug}`;
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  const slug = props.article.slug;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: `/articles/${slug}` },
      { hreflang: 'en', href: `/en/articles/${slug}` },
      { hreflang: 'x-default', href: `/articles/${slug}` },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/articles/${slug}` },
    { hreflang: 'en', href: `${b}/en/articles/${slug}` },
    { hreflang: 'x-default', href: `${b}/articles/${slug}` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  return [
    { href: homeHref, label: b.home },
    { href: articlesIndexHref.value, label: b.articles },
    { label: props.article.title },
  ];
});

const displayHtml = ref('');
const toc = ref([]);

function slugify(text) {
  const t = (text || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return t || 'section';
}

/**
 * @param {Document} doc
 */
function convertFaqToDetails(doc) {
  const h2s = [...doc.body.querySelectorAll('h2')];
  const faqHeading = h2s.find((h) => {
    const t = (h.textContent || '').trim();
    return /^faq$/i.test(t) || /^частые вопросы$/i.test(t) || /^вопросы и ответы$/i.test(t);
  });
  if (!faqHeading) {
    return;
  }
  const already = faqHeading.nextElementSibling;
  if (already?.classList?.contains('article-faq-list')) {
    return;
  }

  const list = doc.createElement('div');
  list.className = 'article-faq-list mt-5 space-y-2';

  let el = faqHeading.nextElementSibling;
  while (el && el.tagName !== 'H2') {
    if (el.tagName !== 'H3') {
      el = el.nextElementSibling;
      continue;
    }
    const h3 = el;
    const titleText = h3.textContent?.trim() || '';
    el = el.nextElementSibling;
    h3.remove();

    const details = doc.createElement('details');
    details.className =
      'article-faq-item group rounded-xl border border-slate-200 bg-slate-50/90 px-4 open:border-primary/25 open:bg-white open:shadow-md';

    const summary = doc.createElement('summary');
    summary.className =
      'article-faq-summary flex cursor-pointer list-none items-center justify-between gap-3 py-3 pr-1 text-base font-bold text-dark outline-none [&::-webkit-details-marker]:hidden';
    summary.textContent = titleText;
    details.appendChild(summary);

    while (el && el.tagName === 'P') {
      const p = el;
      el = el.nextElementSibling;
      p.classList.add('pb-3', 'text-slate-600', 'leading-relaxed', 'last:pb-0');
      details.appendChild(p);
    }

    list.appendChild(details);
  }

  if (list.childElementCount > 0) {
    faqHeading.insertAdjacentElement('afterend', list);
  }
}

/**
 * @param {Document} doc
 */
function assignHeadingIds(doc) {
  const used = new Set();
  let n = 0;
  doc.body.querySelectorAll('h1,h2,h3').forEach((h) => {
    let id = slugify(h.textContent || '');
    const base = id;
    while (used.has(id) || doc.getElementById(id)) {
      n += 1;
      id = `${base}-${n}`.slice(0, 90);
    }
    used.add(id);
    h.id = id;
  });
}

/**
 * @param {Document} doc
 */
function buildToc(doc) {
  return [...doc.body.querySelectorAll('h1,h2,h3')].map((h) => ({
    id: h.id,
    level: Number(h.tagName[1]),
    text: (h.textContent || '').trim(),
  }));
}

function processArticleHtml(html) {
  if (typeof window === 'undefined' || !html) {
    displayHtml.value = html || '';
    toc.value = [];
    return;
  }
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    convertFaqToDetails(doc);
    assignHeadingIds(doc);
    toc.value = buildToc(doc);
    displayHtml.value = doc.body.innerHTML;
  } catch {
    displayHtml.value = html;
    toc.value = [];
  }
}

watch(
  () => props.article.body_html,
  (html) => {
    processArticleHtml(html);
  },
  { immediate: true },
);
</script>

<style scoped>
:deep(.article-faq-summary)::after {
  content: '+';
  flex-shrink: 0;
  display: inline-flex;
  width: 1.75rem;
  height: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  color: rgb(71 85 105);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

:deep(.article-faq-item[open] > .article-faq-summary)::after {
  content: '−';
  border-color: rgb(252 165 165);
  color: rgb(185 28 28);
}

:deep(.article-body figure.article-figure) {
  margin: 1.75rem 0;
}

:deep(.article-body figure.article-figure img) {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;
  box-shadow: 0 12px 40px -12px rgb(15 23 42 / 0.18);
}

:deep(.article-body figure.article-figure figcaption) {
  margin-top: 0.65rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgb(100 116 139);
  text-align: center;
  font-weight: 500;
}
</style>
