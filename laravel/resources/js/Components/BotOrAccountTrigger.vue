<template>
  <button type="button" @click="handleClick" :class="$attrs.class">
    <slot />
  </button>

  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" @click="close">
      <div class="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl" @click.stop>
        <h3 class="mb-3 text-2xl font-black text-dark">{{ messages.botChoice?.title || 'Как продолжить?' }}</h3>
        <p class="mb-6 text-sm text-slate-600">{{ messages.botChoice?.body || 'Оплата и выдача доступа проходят в Telegram-боте. Уже есть аккаунт на сайте — можно открыть личный кабинет и купить тариф там.' }}</p>
        <div class="flex flex-col gap-3">
          <Link
            :href="accountHref"
            class="w-full rounded-xl bg-primary py-3.5 font-bold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover"
            @click="close"
          >
            {{ messages.botChoice?.goAccount || 'Войти в личный кабинет' }}
          </Link>
          <a
            href="https://t.me/free24_internet_bot"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 font-bold text-dark transition-colors hover:border-primary/40 hover:bg-slate-50 hover:text-primary"
            @click="close"
          >
            {{ messages.botChoice?.goBot || 'Перейти в Telegram' }}
          </a>
          <button type="button" class="mt-2 text-sm font-semibold text-slate-400 hover:text-slate-600" @click="close">
            {{ messages.botChoice?.close || 'Отмена' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  messages: {
    type: Object,
    default: () => ({})
  }
});

const page = usePage();
const isOpen = ref(false);

const accountHref = computed(() => {
  const locale = page.props.locale || 'ru';
  return locale === 'en' ? '/en/account/profile' : '/account/profile';
});

const handleClick = () => {
  isOpen.value = true;
};

const close = () => {
  isOpen.value = false;
};
</script>
