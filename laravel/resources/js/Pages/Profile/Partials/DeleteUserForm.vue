<template>
  <section :class="['space-y-6', className]">
    <header>
      <h2 class="text-lg font-medium text-gray-900">Delete Account</h2>
      <p class="mt-1 text-sm text-gray-600">Once your account is deleted, all of its resources and data will be permanently deleted.</p>
    </header>
    <DangerButton @click="showing = true">Delete Account</DangerButton>
    <Modal :show="showing" @close="closeModal">
      <form @submit.prevent="deleteUser" class="p-6">
        <h2 class="text-lg font-medium text-gray-900">Are you sure you want to delete your account?</h2>
        <p class="mt-1 text-sm text-gray-600">Please enter your password to confirm you would like to permanently delete your account.</p>
        <div class="mt-6">
          <InputLabel for="password" value="Password" className="sr-only" />
          <TextInput id="password" ref="passwordInput" v-model="form.password" type="password" className="mt-1 block w-3/4" isFocused placeholder="Password" />
          <InputError className="mt-2" :message="form.errors.password" />
        </div>
        <div class="mt-6 flex justify-end">
          <SecondaryButton @click="closeModal">Cancel</SecondaryButton>
          <DangerButton className="ms-3" :disabled="form.processing">Delete Account</DangerButton>
        </div>
      </form>
    </Modal>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';
import DangerButton from '@/Components/DangerButton.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import Modal from '@/Components/Modal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({ className: { type: String, default: '' } });
const showing = ref(false);
const form = useForm({ password: '' });
const closeModal = () => { showing.value = false; form.reset(); form.clearErrors(); };
const deleteUser = () => form.delete(route('profile.destroy'), { onSuccess: closeModal });
</script>
