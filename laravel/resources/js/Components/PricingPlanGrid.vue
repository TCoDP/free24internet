<template>
  <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table class="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200">
          <th
            v-for="card in sortedCards"
            :key="card.title"
            scope="col"
            :class="['min-w-42 px-3 py-4 text-center text-base font-extrabold text-dark', colCellClass(card)]"
          >
            <div class="flex flex-col items-center gap-2">
              <span>{{ card.title }}</span>
              <span v-if="card.badge" class="rounded-full bg-primary px-2.5 py-0.5 text-xs font-extrabold text-white">
                {{ card.badge }}
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-slate-100">
          <td
            v-for="card in sortedCards"
            :key="card.title"
            :class="['px-3 py-4 text-center', colCellClass(card), card.highlight ? '' : 'bg-white']"
          >
            <span class="text-xl font-black text-dark">{{ card.price }}</span>
            <span class="text-slate-500">{{ card.period }}</span>
          </td>
        </tr>
        <tr class="border-b border-slate-100">
          <td
            v-for="card in sortedCards"
            :key="card.title"
            :class="['px-3 py-4 text-center text-slate-600', colCellClass(card), card.highlight ? '' : 'bg-white']"
          >
            {{ card.blurb }}
          </td>
        </tr>
        <tr class="border-b border-slate-100">
          <td
            v-for="card in sortedCards"
            :key="card.title"
            :class="['px-3 py-4', colCellClass(card), card.highlight ? '' : 'bg-white']"
          >
            <ul class="mx-auto max-w-[16rem] space-y-1.5 font-semibold text-dark">
              <li v-for="f in card.features" :key="f" class="flex gap-2">
                <span class="shrink-0 font-bold text-primary">✓</span>
                <span>{{ f }}</span>
              </li>
            </ul>
          </td>
        </tr>
        <tr>
          <td
            v-for="card in sortedCards"
            :key="card.title"
            :class="['px-3 py-4', colCellClass(card), card.highlight ? '' : 'bg-white']"
          >
            <div class="flex justify-center">
              <template v-if="mode === 'account'">
                <button
                  type="button"
                  @click="() => handleCtaClick(card)"
                  :class="[
                    ctaTableClass,
                    card.highlight ? 'bg-dark text-white hover:bg-slate-800' : 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover',
                  ]"
                >
                  {{ accountCtaLabel(card) }}
                </button>
              </template>
              <template v-else-if="mode === 'modal'">
                <BotOrAccountTrigger :messages="messages" :class="[ctaTableClass, card.highlight ? 'bg-dark text-white hover:bg-slate-800' : 'animate-pulse-custom bg-primary text-white hover:bg-primary-hover']">
                  {{ card.cta }}
                </BotOrAccountTrigger>
              </template>
              <template v-else>
                <a href="https://t.me/free24_internet_bot" target="_blank" rel="noopener noreferrer" :class="[ctaTableClass, card.highlight ? 'bg-dark text-white hover:bg-slate-800' : 'animate-pulse-custom bg-primary text-white hover:bg-primary-hover']">
                  {{ card.cta }}
                </a>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import BotOrAccountTrigger from './BotOrAccountTrigger.vue';

const props = defineProps({
  pricingSection: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'modal', // 'modal', 'direct', 'account'
  },
  messages: Object,
  pricing: Object,
  canPayOnSite: {
    type: Boolean,
    default: true,
  },
  paymentProviders: {
    type: Object,
    default: () => ({ moneta: false, platega: false, platega_crypto: false }),
  },
});

const emit = defineEmits(['openPurchase', 'startTrial']);

const accountCtaLabel = (card) => {
  if (card.planMonths != null) {
    return props.messages?.auth?.profileBuyCta || 'Купить';
  }

  return props.messages?.auth?.plansTrialActivateCta || 'Активировать';
};

const handleCtaClick = (card) => {
  if (card.planMonths == null) {
    emit('startTrial', card);
  } else {
    emit('openPurchase', card);
  }
};

// Assuming cards are already passed in correct order or sorting by planMonths descending, and trial at the end
const sortedCards = computed(() => {
  if (!props.pricingSection?.cards) return [];
  return [...props.pricingSection.cards].sort((a, b) => {
    if (a.planMonths == null && b.planMonths == null) return 0;
    if (a.planMonths == null) return -1; // Trial first
    if (b.planMonths == null) return 1;
    return b.planMonths - a.planMonths; // Descending by months
  });
});

const ctaTableClass = "inline-flex w-full min-w-[9rem] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-extrabold transition-all sm:text-base";

const colCellClass = (card) => {
  return card.highlight ? "border-l border-r border-primary/15 bg-primary/[0.07] align-top" : "align-top";
};
</script>
