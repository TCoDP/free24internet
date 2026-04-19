<template>
  <section :class="className">
    <header>
      <h2 class="text-lg font-medium text-gray-900">Update Password</h2>
      <p class="mt-1 text-sm text-gray-600">Ensure your account is using a long, random password to stay secure.</p>
    </header>
    <form @submit.prevent="submit" class="mt-6 space-y-6">
      <div>
        <InputLabel for="current_password" value="Current Password" />
        <TextInput id="current_password" v-model="form.current_password" type="password" className="mt-1 block w-full" autocomplete="current-password" />
        <InputError className="mt-2" :message="form.errors.current_password" />
      </div>
      <div>
        <InputLabel for="password" value="New Password" />
        <TextInput id="password" v-model="form.password" type="password" className="mt-1 block w-full" autocomplete="new-password" />
        <InputError className="mt-2" :message="form.errors.password" />
      </div>
      <div>
        <InputLabel for="password_confirmation" value="Confirm Password" />
        <TextInput id="password_confirmation" v-model="form.password_confirmation" type="password" className="mt-1 block w-full" autocomplete="new-password" />
        <InputError className="mt-2" :message="form.errors.password_confirmation" />
      </div>
      <div class="flex items-center gap-4">
        <PrimaryButton :disabled="form.processing">Save</PrimaryButton>
        <Transition name="fade"><p v-if="form.recentlySuccessful" class="text-sm text-gray-600">Saved.</p></Transition>
      </div>
    </form>
  </section>
</template>

<script setup>
import { useForm } from '@inertiajs/vue3';
import { Transition } from 'vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({ className: { type: String, default: '' } });
const form = useForm({ current_password: '', password: '', password_confirmation: '' });
const submit = () => form.put(route('password.update'), { onSuccess: () => form.reset() });
</script>
