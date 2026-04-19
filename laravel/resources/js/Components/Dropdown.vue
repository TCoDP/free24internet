<template>
  <div class="relative">
    <slot />
  </div>
</template>

<script setup>
import { ref, provide, inject } from 'vue';
import { Link } from '@inertiajs/vue3';

const openKey = Symbol('open');
const setOpenKey = Symbol('setOpen');

const open = ref(false);
provide(openKey, open);
provide(setOpenKey, (value) => { open.value = value; });

const Trigger = {
  template: `<div @click="toggle"><slot /></div><div v-if="open" class="fixed inset-0 z-40" @click="setOpen(false)"></div>`,
  setup() {
    const open = inject(openKey);
    const setOpen = inject(setOpenKey);
    const toggle = () => setOpen(!open.value);
    return { open, setOpen, toggle };
  },
};

const Content = {
  props: { align: { type: String, default: 'right' }, width: { type: String, default: '48' }, contentClasses: { type: String, default: 'py-1 bg-white' } },
  template: `<Transition enter-active-class="transition ease-out duration-200" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95"><div v-show="open" class="absolute z-50 mt-2 rounded-md shadow-lg" :class="alignmentClasses + ' ' + widthClasses" @click="setOpen(false)"><div class="rounded-md ring-1 ring-black ring-opacity-5" :class="contentClasses"><slot /></div></div></Transition>`,
  setup(props) {
    const open = inject(openKey);
    const setOpen = inject(setOpenKey);
    const alignmentClasses = props.align === 'left' ? 'ltr:origin-top-left rtl:origin-top-right start-0' : 'ltr:origin-top-right rtl:origin-top-left end-0';
    const widthClasses = props.width === '48' ? 'w-48' : '';
    return { open, setOpen, alignmentClasses, widthClasses };
  },
};

const DropdownLink = { components: { Link }, props: { className: { type: String, default: '' } }, template: `<Link v-bind="$attrs" class="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none" :class="className"><slot /></Link>` };

defineExpose({ Trigger, Content, Link: DropdownLink });
</script>
