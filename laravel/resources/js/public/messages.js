import { ru as ruMessages } from '../messages/ru.ts';
import { en as enMessages } from '../messages/en.ts';

// We can just re-export the TS files if we configure Vite to compile them,
// but for pure JS we can embed them or import them if the bundler supports it.
// Since Vite supports importing TS directly into JS:
export const publicMessages = {
  ru: ruMessages,
  en: enMessages,
};
