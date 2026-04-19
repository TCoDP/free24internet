<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center overflow-y-auto px-4 py-6 sm:px-0">
    <div class="fixed inset-0 bg-gray-500/75" @click="close"></div>
    <div class="relative mx-auto w-full" :class="widthClass">
      <div class="overflow-hidden rounded-lg bg-white shadow-xl">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, default: false },
  maxWidth: { type: String, default: '2xl' },
  closeable: { type: Boolean, default: true },
});

const emit = defineEmits(['close']);

const widthClass = computed(() => ({
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
}[props.maxWidth] || 'sm:max-w-2xl'));

const close = () => {
  if (props.closeable) {
    emit('close');
  }
};
</script>
