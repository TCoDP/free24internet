<template>
  <section :class="className">
    <header>
      <h2 class="text-lg font-medium text-gray-900">Profile Information</h2>
      <p class="mt-1 text-sm text-gray-600">Update your account's profile information and email address.</p>
    </header>
    <form @submit.prevent="submit" class="mt-6 space-y-6">
      <div>
        <InputLabel for="name" value="Name" />
        <TextInput id="name" v-model="form.name" className="mt-1 block w-full" required isFocused autocomplete="name" />
        <InputError className="mt-2" :message="form.errors.name" />
      </div>
      <div>
        <InputLabel for="email" value="Email" />
        <TextInput id="email" v-model="form.email" type="email" className="mt-1 block w-full" required autocomplete="username" />
        <InputError className="mt-2" :message="form.errors.email" />
      </div>
      <div v-if="mustVerifyEmail && !user.email_verified_at">
        <p class="mt-2 text-sm text-gray-800">
          Your email address is unverified.
          <Link :href="route('verification.send')" method="post" as="button" class="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Click here to re-send the verification email.</Link>
        </p>
        <div v-if="status === 'verification-link-sent'" class="mt-2 text-sm font-medium text-green-600">A new verification link has been sent to your email address.</div>
      </div>
      <div class="flex items-center gap-4">
        <PrimaryButton :disabled="form.processing">Save</PrimaryButton>
        <Transition name="fade">
          <p v-if="form.recentlySuccessful" class="text-sm text-gray-600">Saved.</p>
        </Transition>
      </div>
    </form>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { Link, useForm, usePage } from '@inertiajs/vue3';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({ mustVerifyEmail: Boolean, status: String, className: { type: String, default: '' } });
const user = computed(() => usePage().props.auth.user);
const form = useForm({ name: user.value?.name || '', email: user.value?.email || '' });
const submit = () => form.patch(route('profile.update'));
</script>
