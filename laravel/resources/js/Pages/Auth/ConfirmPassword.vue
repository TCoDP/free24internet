<template>
  <GuestLayout>
    <Head title="Confirm Password" />
    <div class="mb-4 text-sm text-gray-600">This is a secure area of the application. Please confirm your password before continuing.</div>
    <form @submit.prevent="submit">
      <div class="mt-4">
        <InputLabel for="password" value="Password" />
        <TextInput id="password" v-model="form.password" type="password" className="mt-1 block w-full" isFocused />
        <InputError :message="form.errors.password" className="mt-2" />
      </div>
      <div class="mt-4 flex items-center justify-end">
        <PrimaryButton className="ms-4" :disabled="form.processing">Confirm</PrimaryButton>
      </div>
    </form>
  </GuestLayout>
</template>

<script setup>
import { Head, useForm } from '@inertiajs/vue3';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import GuestLayout from '@/Layouts/GuestLayout.vue';

const form = useForm({ password: '' });
const submit = () => form.post(route('password.confirm'), { onFinish: () => form.reset('password') });
</script>
