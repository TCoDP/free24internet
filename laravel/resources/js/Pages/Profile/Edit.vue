<template>
  <AuthenticatedLayout>
    <template #header>
      <h2 class="text-xl font-semibold leading-tight text-gray-800">Profile</h2>
    </template>
    <Head title="Profile" />
    <div class="py-12">
      <div class="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
        <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
          <UpdateProfileInformationForm :mustVerifyEmail="mustVerifyEmail" :status="status" className="max-w-xl" />
        </div>
        <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
          <UpdatePasswordForm className="max-w-xl" />
        </div>
        <div class="bg-white p-4 shadow sm:rounded-lg sm:p-8">
          <DeleteUserForm className="max-w-xl" />
        </div>
      </div>
    </div>
  </AuthenticatedLayout>
</template>

<script setup>
import { Head } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import DeleteUserForm from './Partials/DeleteUserForm.vue';
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm.vue';

defineProps({ mustVerifyEmail: Boolean, status: String });
</script>
