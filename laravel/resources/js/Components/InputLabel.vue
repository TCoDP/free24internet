<template>
  <label v-bind="$attrs" class="block text-sm font-medium text-gray-700" :class="className">
    <slot>{{ value }}</slot>
  </label>
</template>

<script setup>
defineProps({ value: { type: String, default: '' }, className: { type: String, default: '' } })
</script>
