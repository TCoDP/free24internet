<template>
  <input
    ref="input"
    v-bind="$attrs"
    :type="type"
    :value="modelValue"
    class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    :class="className"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  type: { type: String, default: 'text' },
  className: { type: String, default: '' },
  isFocused: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);
const input = ref(null);

defineExpose({ focus: () => input.value?.focus() });

onMounted(() => {
  if (props.isFocused) {
    input.value?.focus();
  }
});
</script>
