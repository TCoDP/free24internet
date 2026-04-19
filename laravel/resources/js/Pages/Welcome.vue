<template>
  <Head title="Free24Internet" />
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <div class="mx-auto max-w-4xl px-6 py-24">
      <h1 class="text-4xl font-bold">Free24Internet</h1>
      <p class="mt-4 text-lg text-gray-600">Laravel + Inertia + Sanctum foundation is ready.</p>
      <div class="mt-8 flex gap-3">
        <Link :href="route('login')" class="rounded bg-gray-900 px-4 py-2 text-white">Войти</Link>
        <Link :href="route('register')" class="rounded border border-gray-300 px-4 py-2">Регистрация</Link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Head, Link } from '@inertiajs/vue3';
</script>
