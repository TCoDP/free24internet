<template>
  <nav :class="className" :aria-label="ariaLabel">
    <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
      <li v-for="(item, i) in items" :key="i" class="flex min-w-0 items-center gap-2">
        <span v-if="i > 0" class="select-none text-slate-300" aria-hidden="true">
          /
        </span>
        <template v-if="item.href && i !== items.length - 1">
          <Link
            :href="item.href"
            class="truncate font-semibold text-primary underline-offset-2 hover:underline"
          >
            {{ item.label }}
          </Link>
        </template>
        <template v-else>
          <span
            :class="['truncate', { 'font-bold text-slate-700': i === items.length - 1 }]"
            :aria-current="i === items.length - 1 ? 'page' : undefined"
          >
            {{ item.label }}
          </span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { Link } from '@inertiajs/vue3';

defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  className: {
    type: String,
    default: 'mb-6',
  },
});
</script>
