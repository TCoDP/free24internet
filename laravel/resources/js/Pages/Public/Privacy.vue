<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="messages.privacyPage.metaTitle"
      :description="messages.privacyPage.description"
      :keywords="messages.privacyPage.keywords"
      :og-title="messages.privacyPage.ogTitle"
      :og-description="messages.privacyPage.ogDescription"
      :twitter-title="messages.privacyPage.ogTitle"
      :twitter-description="messages.privacyPage.ogDescription"
      :canonical-url="canonicalUrl"
      :og-locale="ogLocale"
      :og-locale-alternate="ogLocaleAlternate"
      :alternates="hreflangAlternates"
    />
    <main class="min-h-screen flex-grow px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <div class="mx-auto w-full max-w-[1000px]">
        <BreadcrumbTrail
          v-if="breadcrumbItems.length > 0"
          :ariaLabel="messages.breadcrumb?.ariaLabel || 'Breadcrumbs'"
          :items="breadcrumbItems"
          class="mb-6"
        />
        <h1 class="mb-8 text-center text-3xl font-extrabold text-dark md:text-4xl">
          {{ locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности' }}
        </h1>
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div v-if="locale === 'en'" class="prose max-w-none space-y-6 text-slate-600">
            <p>
              The Privacy Policy governs the collection, use, and protection of user information. Account
              identifiers, technical information, and interaction history may be collected. Data is used
              to operate the service, communicate with users, and for analysis. Disclosure to third
              parties is only where required by law or with user consent. Data is retained as needed and
              protected within reasonable limits. Users bear risks related to data transmission. The
              administration may update the Policy without notice; continued use constitutes acceptance.
            </p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">1. General Provisions</h3>
            <p>1.1. This Privacy Policy (the "Policy") governs how information provided by the User when using the service (the "Service") is processed and protected.</p>
            <p>1.2. By using the Service, the User confirms their consent to the terms of the Policy. If the User does not agree with the terms, they must stop using the Service.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">2. Information Collection</h3>
            <p>2.1. The Service may collect the following types of data:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>account identifiers (login, ID, nickname, etc.);</li>
              <li>technical information (IP address, browser, device, and operating system data);</li>
              <li>interaction history with the Service.</li>
            </ul>
            <p>2.2. The Service does not require passport data, documents, photos, or other personal information beyond the minimum necessary for operation.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">3. Information Usage</h3>
            <p>3.1. The Service may use the received information exclusively for:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>ensuring functionality;</li>
              <li>communication with the User (including notifications and support);</li>
              <li>analysis and improvement of the Service.</li>
            </ul>
            
            <h3 class="mt-8 text-xl font-bold text-dark">4. Transfer of Information to Third Parties</h3>
            <p>4.1. The Administration does not transfer data to third parties except:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>where required by law;</li>
              <li>where necessary to fulfill obligations to the User (e.g. payment systems);</li>
              <li>where the User has given consent.</li>
            </ul>
            
            <h3 class="mt-8 text-xl font-bold text-dark">5. Data Storage and Protection</h3>
            <p>5.1. Data is stored for the period necessary to achieve processing purposes.</p>
            <p>5.2. The Administration takes reasonable measures to protect data but does not guarantee absolute security of information transmitted over the internet.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">6. Disclaimer</h3>
            <p>6.1. The User understands that data transmission over the internet involves risks.</p>
            <p>6.2. The Administration is not responsible for loss, theft, or disclosure of data caused by third parties or the User.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">7. Changes to the Policy</h3>
            <p>7.1. The Administration may change the terms of the Policy without prior notice.</p>
            <p>7.2. Continued use of the Service after changes means the User agrees to the new version of the Policy.</p>
          </div>

          <div v-else class="prose max-w-none space-y-6 text-slate-600">
            <p>
              Политика конфиденциальности регулирует сбор, использование и защиту информации пользователей сервиса. Собираются идентификаторы аккаунта, техническая информация и история взаимодействий. Данные используются для обеспечения работы сервиса, связи с пользователем и анализа. Передача информации третьим лицам возможна только в законодательно установленных случаях или с согласия пользователя. Хранение данных осуществляется в течение необходимого срока, их защита — в разумных пределах. Пользователь самостоятельно несёт ответственность за риски, связанные с передачей данных. Администрация вправе вносить изменения в Политику без уведомления — согласие считается принятым при дальнейшем использовании сервиса.
            </p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">1. Общие положения</h3>
            <p>1.1. Настоящая Политика конфиденциальности (далее — «Политика») регулирует порядок обработки и защиты информации, которую Пользователь передаёт при использовании сервиса (далее — «Сервис»).</p>
            <p>1.2. Используя Сервис, Пользователь подтверждает своё согласие с условиями Политики. Если Пользователь не согласен с условиями — он обязан прекратить использование Сервиса.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">2. Сбор информации</h3>
            <p>2.1. Сервис может собирать следующие типы данных:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>идентификаторы аккаунта (логин, ID, никнейм и т.п.);</li>
              <li>техническую информацию (IP-адрес, данные о браузере, устройстве и операционной системе);</li>
              <li>историю взаимодействий с Сервисом.</li>
            </ul>
            <p>2.2. Сервис не требует от Пользователя предоставления паспортных данных, документов, фотографий или другой личной информации, кроме минимально необходимой для работы.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">3. Использование информации</h3>
            <p>3.1. Сервис может использовать полученную информацию исключительно для:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>обеспечения работы функционала;</li>
              <li>связи с Пользователем (в том числе для уведомлений и поддержки);</li>
              <li>анализа и улучшения работы Сервиса.</li>
            </ul>
            
            <h3 class="mt-8 text-xl font-bold text-dark">4. Передача информации третьим лицам</h3>
            <p>4.1. Администрация не передаёт полученные данные третьим лицам, за исключением случаев:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>если это требуется по закону;</li>
              <li>если это необходимо для исполнения обязательств перед Пользователем (например, при работе с платёжными системами);</li>
              <li>если Пользователь сам дал на это согласие.</li>
            </ul>
            
            <h3 class="mt-8 text-xl font-bold text-dark">5. Хранение и защита данных</h3>
            <p>5.1. Данные хранятся в течение срока, необходимого для достижения целей обработки.</p>
            <p>5.2. Администрация принимает разумные меры для защиты данных, но не гарантирует абсолютную безопасность информации при передаче через интернет.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">6. Отказ от ответственности</h3>
            <p>6.1. Пользователь понимает и соглашается, что передача информации через интернет всегда сопряжена с рисками.</p>
            <p>6.2. Администрация не несёт ответственности за утрату, кражу или раскрытие данных, если это произошло по вине третьих лиц или самого Пользователя.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">7. Изменения в Политике</h3>
            <p>7.1. Администрация вправе изменять условия Политики без предварительного уведомления.</p>
            <p>7.2. Продолжение использования Сервиса после внесения изменений означает согласие Пользователя с новой редакцией Политики.</p>
          </div>
        </div>
      </div>
    </main>
  </PublicLayout>
</template>

<script setup>
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import PublicLayout from '@/Layouts/PublicLayout.vue';
import PublicSeoHead from '@/Components/PublicSeoHead.vue';
import BreadcrumbTrail from '@/Components/BreadcrumbTrail.vue';
import { publicMessages } from '@/public/messages';

const props = defineProps({
  locale: {
    type: String,
    default: 'ru',
  },
});

const messages = computed(() => publicMessages[props.locale]);

const page = usePage();
const siteBase = computed(() => String(page.props.site?.base_url || '').replace(/\/$/, ''));

const canonicalUrl = computed(() => {
  const path = props.locale === 'en' ? '/en/privacy' : '/privacy';
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: '/privacy' },
      { hreflang: 'en', href: '/en/privacy' },
      { hreflang: 'x-default', href: '/privacy' },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/privacy` },
    { hreflang: 'en', href: `${b}/en/privacy` },
    { hreflang: 'x-default', href: `${b}/privacy` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  const label = props.locale === 'en' ? 'Privacy Policy' : 'Политика конфиденциальности';
  return [
    { href: homeHref, label: b.home },
    { label },
  ];
});
</script>
