<template>
  <div class="flex flex-col gap-4">
    <div
      v-for="(item, i) in items"
      :key="i"
      :class="['faq-item cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-light transition-colors hover:border-primary/30', { active: open === i }]"
    >
      <button
        type="button"
        class="faq-question flex w-full items-center justify-between p-6 text-left text-lg font-extrabold text-dark md:p-8 md:text-xl"
        @click="open = open === i ? null : i"
      >
        {{ item.q }}
      </button>
      <div class="faq-answer px-6 text-slate-600 md:px-8">
        {{ item.a }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const open = ref(null);
</script>
