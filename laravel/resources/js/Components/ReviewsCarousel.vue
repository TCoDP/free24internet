<template>
  <section class="overflow-hidden bg-light pt-16 pb-24 md:pt-24 md:pb-32" id="reviews">
    <div class="group relative mx-auto max-w-[1200px] px-4 md:px-8">
      <h2 class="mb-12 text-center text-3xl font-extrabold text-dark md:text-4xl">{{ title }}</h2>
      <button
        type="button"
        class="absolute left-4 top-1/2 z-10 mt-6 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-dark opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white focus:outline-none group-hover:opacity-100 md:flex lg:-left-6"
        @click="scrollLeft"
        aria-label="Previous"
      >
        &#10094;
      </button>
      <button
        type="button"
        class="absolute right-4 top-1/2 z-10 mt-6 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-dark opacity-0 shadow-lg transition-all hover:scale-110 hover:bg-primary hover:text-white focus:outline-none group-hover:opacity-100 md:flex lg:-right-6"
        @click="scrollRight"
        aria-label="Next"
      >
        &#10095;
      </button>
      <div
        ref="carouselRef"
        class="hide-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-8 pt-4 snap-x snap-mandatory md:mx-0 md:gap-8 md:px-0"
      >
        <div
          v-for="(r, i) in items"
          :key="i"
          class="relative w-[85%] shrink-0 snap-center rounded-3xl bg-white p-8 shadow-sm transition-transform hover:-translate-y-1 sm:w-[350px] md:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)]"
        >
          <div class="absolute right-6 top-6 font-serif text-6xl leading-none text-primary/10">
            "
          </div>
          <div class="mb-4 text-xl text-amber-500">{{ r.stars }}</div>
          <p class="relative z-10 mb-8 text-slate-600">{{ r.text }}</p>
          <div class="flex items-center gap-4">
            <div
              :class="['flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-xl font-bold text-primary', r.avatarClass || '']"
            >
              {{ r.initial }}
            </div>
            <div>
              <h4 class="font-bold leading-tight text-dark">{{ r.name }}</h4>
              <span class="text-sm text-slate-400">{{ r.role }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  title: String,
  items: {
    type: Array,
    required: true,
  },
});

const carouselRef = ref(null);

const scrollLeft = () => {
  if (carouselRef.value) {
    carouselRef.value.scrollBy({ left: -350, behavior: 'smooth' });
  }
};

const scrollRight = () => {
  if (carouselRef.value) {
    carouselRef.value.scrollBy({ left: 350, behavior: 'smooth' });
  }
};
</script>
