<template>
  <div class="min-h-screen bg-gray-100">
    <nav class="border-b border-gray-100 bg-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex items-center gap-6">
            <Link href="/">
              <ApplicationLogo class="block h-9 w-auto fill-current text-gray-800" />
            </Link>
            <Link :href="route('account.home')" :class="navClass(route().current('account.*'))">Account</Link>
          </div>

          <div class="flex items-center gap-3">
            <span class="hidden text-sm text-gray-600 sm:block">{{ userName }}</span>
            <Link :href="route('account.profile')" class="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200">Profile</Link>
            <Link :href="route('logout')" method="post" as="button" class="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black">Log Out</Link>
          </div>
        </div>
      </div>
    </nav>

    <header v-if="header" class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot name="header">
          <component :is="header" />
        </slot>
      </div>
    </header>

    <main><slot /></main>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import ApplicationLogo from '@/Components/ApplicationLogo.vue';

const props = defineProps({ header: { type: [Object, Function, String], default: null } });
const slots = useSlots();
const page = usePage();
const userName = computed(() => page.props.auth?.user?.name || page.props.auth?.user?.email || 'Account');
const navClass = (active) => ['inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none', active ? 'border-indigo-400 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'];
</script>
