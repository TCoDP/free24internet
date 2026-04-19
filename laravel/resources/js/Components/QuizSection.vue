<template>
  <section class="bg-slate-200 py-16 md:py-24" id="quiz">
    <div class="mx-auto max-w-[700px] px-4 md:px-8">
      <div class="relative flex min-h-[400px] flex-col justify-center rounded-3xl bg-white p-8 shadow-xl md:p-12">
        <template v-if="phase === 'quiz'">
          <div class="quiz-header mb-8 text-center">
            <h2 class="mb-2 text-2xl font-extrabold text-dark md:text-3xl">{{ quiz.title }}</h2>
            <p class="mb-6 text-slate-600">{{ quiz.subtitle }}</p>
            <div class="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full bg-primary transition-all duration-500 ease-out"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <div class="text-sm font-bold text-slate-400">{{ stepLabel }}</div>
          </div>
          
          <div v-for="s in 3" :key="s" :class="['quiz-step', { active: step === s }]">
            <p class="mb-6 text-center text-xl font-extrabold text-dark">
              {{ s === 1 ? quiz.q1 : s === 2 ? quiz.q2 : quiz.q3 }}
            </p>
            <div class="flex flex-col gap-4">
              <button
                v-for="label in options[s - 1]"
                :key="label"
                type="button"
                class="w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-4 text-left font-bold text-slate-700 transition-all hover:translate-x-1 hover:border-primary hover:bg-slate-100 hover:text-primary"
                @click="s === 3 ? finish() : next(s)"
              >
                {{ label }}
              </button>
            </div>
          </div>
        </template>

        <template v-else-if="phase === 'loading'">
          <div class="flex flex-col items-center gap-6 py-8">
            <div class="spinner"></div>
            <p class="text-lg font-bold text-slate-600">{{ quiz.loading }}</p>
          </div>
        </template>

        <template v-else-if="phase === 'result'">
          <div class="animate-fade-in text-center">
            <h3 class="mb-4 text-3xl font-extrabold text-primary">{{ quiz.resultTitle }}</h3>
            <p class="mb-8 text-lg text-slate-600">{{ quiz.resultBody }}</p>
            <BotOrAccountTrigger :messages="messages" class="animate-pulse-custom inline-block w-full rounded-full bg-primary py-4 text-center text-xl font-extrabold text-white transition-all hover:bg-primary-hover">
              {{ quiz.resultCta }}
            </BotOrAccountTrigger>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import BotOrAccountTrigger from './BotOrAccountTrigger.vue';

const props = defineProps({
  quiz: {
    type: Object,
    required: true,
  },
  locale: {
    type: String,
    default: 'ru',
  },
  messages: Object,
});

const step = ref(1);
const phase = ref('quiz'); // 'quiz' | 'loading' | 'result'

const progress = computed(() => (step.value / 3) * 100);

const stepLabel = computed(() => {
  return props.locale === 'en' ? `Question ${step.value} of 3` : `Вопрос ${step.value} из 3`;
});

const next = (from) => {
  if (from < 3) step.value = from + 1;
};

const finish = () => {
  phase.value = 'loading';
  setTimeout(() => {
    phase.value = 'result';
  }, 2000);
};

const options = computed(() => [
  props.quiz.q1Options || [],
  props.quiz.q2Options || [],
  props.quiz.q3Options || [],
]);
</script>
