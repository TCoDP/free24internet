<template>
  <div class="relative flex min-h-[600px] w-full flex-col bg-dark pb-32 md:h-[calc(100vh-110px)] md:pb-0">
    <div class="relative h-full min-h-[480px] w-full flex-grow">
      <div
        v-for="(slide, index) in slides"
        :key="slide.image"
        :class="['hero-slide absolute inset-0 flex items-center bg-cover bg-center pt-10 md:pt-0', { active: index === current }]"
        :style="{ backgroundImage: `url('${slide.image}')` }"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/70 to-transparent md:bg-gradient-to-r md:via-gray-900/40"></div>
        <div class="relative z-20 mx-auto w-full max-w-[1400px] px-4 md:px-8">
          <div class="slide-content-inner max-w-2xl">
            <span class="mb-4 inline-block rounded-full border border-primary bg-primary/10 px-4 py-1.5 text-xs font-extrabold text-primary md:mb-6 md:text-sm">
              {{ slide.badge }}
            </span>
            <h1 class="mb-4 text-4xl font-black leading-tight text-white md:mb-6 md:text-5xl lg:text-7xl">
              {{ slide.title }}
              <template v-if="slide.titleLine2">
                <br />
                {{ slide.titleLine2 }}
              </template>
            </h1>
            <p class="mb-8 text-base text-gray-300 md:mb-10 md:text-lg lg:text-xl">
              {{ slide.description }}
            </p>
            <div class="flex flex-col gap-4 sm:flex-row">
              <BotOrAccountTrigger
                :messages="messages"
                class="animate-pulse-custom rounded-full bg-primary px-8 py-3.5 text-center text-base font-extrabold text-white transition-all hover:bg-primary-hover md:text-lg"
              >
                {{ slide.primaryCta }}
              </BotOrAccountTrigger>
              <BotOrAccountTrigger
                v-if="slide.secondaryCta"
                :messages="messages"
                class="rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-center text-base font-extrabold text-white transition-all hover:bg-white/20 md:text-lg"
              >
                {{ slide.secondaryCta }}
              </BotOrAccountTrigger>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="absolute bottom-0 left-0 z-30 w-full border-t border-white/10 bg-gray-900/90 py-4 backdrop-blur-md md:py-6">
      <div class="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-4 px-4 md:px-8 lg:flex-row lg:justify-between lg:gap-0">
        <div class="hidden gap-8 lg:flex xl:gap-12">
          <div class="flex items-center gap-4 text-white">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">🛡️</div>
            <div class="flex flex-col">
              <strong class="text-sm font-extrabold tracking-wide">{{ bar?.security }}</strong>
              <span class="text-xs text-gray-400">{{ bar?.securitySub }}</span>
            </div>
          </div>
          <div class="flex items-center gap-4 text-white">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">🚀</div>
            <div class="flex flex-col">
              <strong class="text-sm font-extrabold tracking-wide">{{ bar?.speed }}</strong>
              <span class="text-xs text-gray-400">{{ bar?.speedSub }}</span>
            </div>
          </div>
          <div class="flex items-center gap-4 text-white">
            <div class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-xl text-primary">⚖️</div>
            <div class="flex flex-col">
              <strong class="text-sm font-extrabold tracking-wide">{{ bar?.prices }}</strong>
              <span class="text-xs text-gray-400">{{ bar?.pricesSub }}</span>
            </div>
          </div>
        </div>
        <div class="flex w-full items-center justify-between gap-8 lg:w-auto">
          <div class="flex gap-2">
            <button
              v-for="(_, i) in slides"
              :key="i"
              type="button"
              :aria-label="`Slide ${i + 1}`"
              @click="go(i)"
              :class="['h-2.5 cursor-pointer rounded-full transition-all', i === current ? 'w-[30px] bg-primary' : 'w-2.5 bg-white/30']"
            ></button>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              @click="go(current - 1)"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all hover:bg-white hover:text-dark"
            >
              &#10094;
            </button>
            <button
              type="button"
              @click="go(current + 1)"
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all hover:bg-white hover:text-dark"
            >
              &#10095;
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import BotOrAccountTrigger from './BotOrAccountTrigger.vue';

const props = defineProps({
  slides: {
    type: Array,
    required: true,
  },
  bar: Object,
  messages: Object,
});

const current = ref(0);
let intervalId = null;

const go = (i) => {
  current.value = (i + props.slides.length) % props.slides.length;
};

onMounted(() => {
  intervalId = setInterval(() => {
    current.value = (current.value + 1) % props.slides.length;
  }, 6000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
