<template>
  <p v-if="message" v-bind="$attrs" class="text-sm text-red-600" :class="className">
    {{ message }}
  </p>
</template>

<script setup>
defineProps({ message: String, className: { type: String, default: '' } })
</script>
