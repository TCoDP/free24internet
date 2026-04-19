<template>
  <PublicLayout :locale="locale" :messages="messages">
    <PublicSeoHead
      :title="messages.legalPage.metaTitle"
      :description="messages.legalPage.description"
      :keywords="messages.legalPage.keywords"
      :og-title="messages.legalPage.ogTitle"
      :og-description="messages.legalPage.ogDescription"
      :twitter-title="messages.legalPage.ogTitle"
      :twitter-description="messages.legalPage.ogDescription"
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
          {{ locale === 'en' ? 'Terms of Service' : 'Пользовательское соглашение' }}
        </h1>
        <div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div v-if="locale === 'en'" class="prose max-w-none space-y-6 text-slate-600">
            <h3 class="mt-4 text-xl font-bold text-dark">1. General Provisions</h3>
            <p>1.1. These Terms of Service (the "Agreement") govern use of the online service (the "Service") provided by the Administration.</p>
            <p>1.2. By using the Service, including launching the bot, registering, paying for services, or accessing materials, the User confirms that they have read this Agreement and accept it in full.</p>
            <p>1.3. If the User disagrees with the Agreement, they must stop using the Service.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">2. Nature of Services and Digital Goods</h3>
            <p>2.1. The Service provides intangible digital goods and services including informational materials, training, consultations, digital products, and related services.</p>
            <p>2.2. Materials may include:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>information from open sources;</li>
              <li>copyright materials of the Administration and/or third parties;</li>
              <li>analytics, collections, recommendations, structured data.</li>
            </ul>
            <p>2.3. The User acknowledges that value lies in systematization, analysis, presentation, support, and updates—not in the exclusivity of individual fragments.</p>
            <p>2.4. The Service does not claim uniqueness or exclusivity of individual elements outside the Service.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">3. Disclaimer of Warranties and Liability</h3>
            <p>3.1. The Service is provided on an "AS IS" basis.</p>
            <p>3.2. The Administration does not guarantee:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>that the Service will meet expectations;</li>
              <li>any financial, commercial, or professional results;</li>
              <li>uninterrupted or error-free operation.</li>
            </ul>
            <p>3.3. The Administration is not liable for:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>direct or indirect damages, including lost profits;</li>
              <li>consequences of applying materials received;</li>
              <li>actions or inaction of third parties;</li>
              <li>temporary failures or access restrictions.</li>
            </ul>
            <p>3.4. Decisions on applying materials and services are made by the User at their own risk.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">4. Legality of Use</h3>
            <p>4.1. The Service is not intended to facilitate illegal activity.</p>
            <p>4.2. The User undertakes to comply with applicable law and third-party rules.</p>
            <p>4.3. The User is solely responsible for lawful use of materials and services.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">5. Intellectual Property</h3>
            <p>5.1. Materials are protected by intellectual property laws.</p>
            <p>5.2. Copying, distribution, resale, or other use without permission of the rights holder is prohibited.</p>
            <p>5.3. Violations may result in access restriction without compensation.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">6. Access Restriction</h3>
            <p>6.1. The Administration may suspend or restrict access if:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>the Agreement is violated;</li>
              <li>abuse is detected;</li>
              <li>required by law or payment providers.</li>
            </ul>
            <p>6.2. Restriction does not release the User from prior obligations.</p>
            <p>6.3. The Administration may refuse service where actions create elevated risk to the Service, providers, or third parties.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">7. Payments and Refunds</h3>
            <p>7.1. Payment is made on the terms stated in the Service before payment.</p>
            <p>7.2. Due to the intangible nature of digital goods, refunds after access is granted are not provided except as below.</p>
            <p>7.3. Refunds are possible only if:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>the service was not provided due to a technical fault of the Service;</li>
              <li>access was not actually provided.</li>
            </ul>
            <p>7.4. Refund requests must be submitted to support within 24 hours of payment.</p>
            <p>7.5. Refund decisions are made individually by the Administration.</p>
            <p>7.6. The User agrees not to initiate chargebacks without first contacting Service support.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">8. Privacy</h3>
            <p>8.1. Minimum necessary technical data may be collected to operate the Service.</p>
            <p>8.2. Reasonable security measures are used; absolute security is not guaranteed.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">9. Change of Terms</h3>
            <p>9.1. The Administration may amend this Agreement.</p>
            <p>9.2. The current version is published in the Service.</p>
            <p>9.3. Continued use constitutes acceptance of updated terms.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">10. Contact Information</h3>
            <p>10.1. For questions, contact support via the form in the bot.</p>
            
            <div class="mt-8 rounded-xl border border-slate-200 bg-light p-4">
              <p class="font-semibold text-dark">
                By using the Service (including launching the bot and/or sending /start), the User
                confirms that they have read this Agreement and accept it in full.
              </p>
            </div>
          </div>
          
          <div v-else class="prose max-w-none space-y-6 text-slate-600">
            <h3 class="mt-4 text-xl font-bold text-dark">1. Общие положения</h3>
            <p>1.1. Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует порядок использования онлайн-сервиса (далее — «Сервис»), предоставляемого Администрацией.</p>
            <p>1.2. Используя Сервис, включая запуск бота, регистрацию, оплату услуг или получение доступа к материалам, Пользователь подтверждает, что полностью ознакомился с условиями настоящего Соглашения и принимает их в полном объёме.</p>
            <p>1.3. В случае несогласия с условиями Соглашения Пользователь обязан прекратить использование Сервиса.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">2. Характер услуг и цифровых товаров</h3>
            <p>2.1. Сервис предоставляет цифровые товары и услуги нематериального характера, включая, но не ограничиваясь: информационные материалы, обучающие программы, консультации, цифровые продукты и сервисные услуги.</p>
            <p>2.2. Материалы, предоставляемые через Сервис, могут включать:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>информацию из открытых источников;</li>
              <li>авторские материалы Администрации и/или третьих лиц;</li>
              <li>аналитические обзоры, подборки, рекомендации, структурированные данные.</li>
            </ul>
            <p>2.3. Пользователь осознаёт и соглашается, что ценность цифровых товаров и услуг Сервиса заключается в систематизации, анализе, форме подачи, сопровождении, поддержке и обновлениях, а не в эксклюзивности отдельных фрагментов информации.</p>
            <p>2.4. Сервис не заявляет и не гарантирует уникальность, исключительность или недоступность отдельных элементов материалов вне Сервиса.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">3. Отказ от гарантий и ответственности</h3>
            <p>3.1. Сервис предоставляется на условиях «AS IS» («как есть»).</p>
            <p>3.2. Администрация не гарантирует:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>соответствие Сервиса ожиданиям Пользователя;</li>
              <li>достижение каких-либо финансовых, коммерческих, профессиональных или иных результатов;</li>
              <li>бесперебойную и безошибочную работу Сервиса.</li>
            </ul>
            <p>3.3. Администрация не несёт ответственности за:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>любые прямые или косвенные убытки, включая упущенную выгоду;</li>
              <li>последствия применения Пользователем полученных материалов;</li>
              <li>действия или бездействие третьих лиц;</li>
              <li>временные технические сбои и ограничения доступа.</li>
            </ul>
            <p>3.4. Все решения о применении материалов, рекомендаций и услуг принимаются Пользователем самостоятельно и на его риск.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">4. Законность использования</h3>
            <p>4.1. Сервис не предназначен для поощрения, организации или содействия противоправной деятельности.</p>
            <p>4.2. Пользователь обязуется использовать Сервис исключительно в рамках применимого законодательства и правил третьих сторон.</p>
            <p>4.3. Ответственность за законность использования материалов и услуг Сервиса полностью возлагается на Пользователя.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">5. Интеллектуальная собственность</h3>
            <p>5.1. Все материалы, размещённые в Сервисе, охраняются законодательством об интеллектуальной собственности.</p>
            <p>5.2. Пользователю запрещается копировать, распространять, перепродавать, передавать третьим лицам или иным образом использовать материалы Сервиса без разрешения правообладателя.</p>
            <p>5.3. Нарушение прав интеллектуальной собственности может повлечь ограничение доступа к Сервису без компенсации.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">6. Ограничение доступа</h3>
            <p>6.1. Администрация вправе приостановить или ограничить доступ Пользователя к Сервису в случае:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>нарушения условий настоящего Соглашения;</li>
              <li>выявления злоупотреблений;</li>
              <li>требований законодательства или платёжных провайдеров.</li>
            </ul>
            <p>6.2. Ограничение доступа не освобождает Пользователя от обязательств, возникших ранее.</p>
            <p>6.3. Администрация оставляет за собой право отказывать в обслуживании Пользователям, чьи действия могут создавать повышенные риски для Сервиса, платёжных провайдеров или третьих лиц.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">7. Платежи и возвраты</h3>
            <p>7.1. Оплата услуг и цифровых товаров производится на условиях, указанных в Сервисе до момента оплаты.</p>
            <p>7.2. В связи с нематериальным характером цифровых товаров и услуг, возврат денежных средств после предоставления доступа не осуществляется, за исключением случаев, указанных ниже.</p>
            <p>7.3. Возврат средств возможен только если:</p>
            <ul class="list-disc space-y-2 pl-6">
              <li>услуга не была оказана по технической вине Сервиса;</li>
              <li>доступ к цифровому товару фактически не был предоставлен.</li>
            </ul>
            <p>7.4. Для рассмотрения вопроса о возврате Пользователь обязан обратиться в службу поддержки в течение 24 часов с момента оплаты.</p>
            <p>7.5. Решение о возврате принимается Администрацией индивидуально.</p>
            <p>7.6. Пользователь подтверждает, что обязуется не инициировать возврат платежа (chargeback) через платёжные системы без предварительного обращения в службу поддержки Сервиса.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">8. Конфиденциальность</h3>
            <p>8.1. Администрация может собирать минимально необходимые технические данные для обеспечения работы Сервиса.</p>
            <p>8.2. Администрация принимает разумные меры для защиты данных, однако не гарантирует абсолютную безопасность передаваемой информации.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">9. Изменение условий</h3>
            <p>9.1. Администрация вправе вносить изменения в настоящее Соглашение.</p>
            <p>9.2. Актуальная версия Соглашения публикуется в Сервисе.</p>
            <p>9.3. Продолжение использования Сервиса означает согласие Пользователя с обновлёнными условиями.</p>
            
            <h3 class="mt-8 text-xl font-bold text-dark">10. Контактная информация</h3>
            <p>10.1. По всем вопросам Пользователь может обратиться в службу поддержки через форму в самом боте.</p>
            
            <div class="mt-8 rounded-xl border border-slate-200 bg-light p-4">
              <p class="font-semibold text-dark">
                Используя Сервис (в том числе запуская бота и/или вводя команду /start), Пользователь подтверждает, что ознакомлен с настоящим Соглашением и принимает его условия в полном объёме.
              </p>
            </div>
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
  const path = props.locale === 'en' ? '/en/terms' : '/terms';
  return siteBase.value ? `${siteBase.value}${path}` : path;
});

const hreflangAlternates = computed(() => {
  const b = siteBase.value;
  if (!b) {
    return [
      { hreflang: 'ru-RU', href: '/terms' },
      { hreflang: 'en', href: '/en/terms' },
      { hreflang: 'x-default', href: '/terms' },
    ];
  }
  return [
    { hreflang: 'ru-RU', href: `${b}/terms` },
    { hreflang: 'en', href: `${b}/en/terms` },
    { hreflang: 'x-default', href: `${b}/terms` },
  ];
});

const ogLocale = computed(() => (props.locale === 'en' ? 'en_US' : 'ru_RU'));
const ogLocaleAlternate = computed(() => (props.locale === 'en' ? 'ru_RU' : 'en_US'));

const breadcrumbItems = computed(() => {
  const b = messages.value.breadcrumb;
  if (!b) return [];
  const homeHref = props.locale === 'en' ? '/en' : '/';
  const label = props.locale === 'en' ? 'Terms of Service' : 'Пользовательское соглашение';
  return [
    { href: homeHref, label: b.home },
    { label },
  ];
});
</script>
