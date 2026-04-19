<template>
  <th :class="['font-bold uppercase', className]">
    <Link
      :href="href"
      :class="['inline-flex items-center gap-1 hover:text-primary', { 'text-primary': active }]"
    >
      {{ label }}
      <span v-if="active" aria-hidden="true">{{ dir === 'asc' ? '↑' : '↓' }}</span>
    </Link>
  </th>
</template>

<script setup>
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';

const props = defineProps({
  label: String,
  column: String,
  sort: String,
  dir: String,
  basePath: String,
  common: {
    type: Object,
    default: () => ({}),
  },
  className: {
    type: String,
    default: 'px-3 py-3',
  },
});

const nextSortParams = (currentSort, currentDir, col) => {
  if (currentSort === col) {
    if (currentDir === 'asc') return { sort: col, dir: 'desc' };
    return { sort: null, dir: null };
  }
  return { sort: col, dir: 'asc' };
};

const active = computed(() => props.sort === props.column);

const href = computed(() => {
  const { sort: ns, dir: nd } = nextSortParams(props.sort, props.dir, props.column);
  const q = { ...props.common };
  if (ns) q.sort = ns;
  if (nd) q.dir = nd;
  
  // build query string
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, v);
    }
  }
  const str = params.toString();
  return str ? `${props.basePath}?${str}` : props.basePath;
});
</script>
