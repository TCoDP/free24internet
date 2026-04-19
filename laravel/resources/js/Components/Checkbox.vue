<template>
  <input
    v-bind="$attrs"
    type="checkbox"
    :checked="modelValue"
    class="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
    :class="className"
    @change="$emit('update:modelValue', $event.target.checked)"
  />
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: false }, className: { type: String, default: '' } });
defineEmits(['update:modelValue']);
</script>
