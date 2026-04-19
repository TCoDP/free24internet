import type { PlanMonths } from "@/lib/pricing/pricing-config";

export type Locale = "ru" | "en";

export type ManualPlatform = "ios" | "android" | "macos" | "windows";

export interface ManualGuideImage {
  file: string;
  caption?: string;
}

export interface ManualGuideStep {
  heading: string;
  paragraphs?: string[];
  links?: { text: string; href: string }[];
  images?: ManualGuideImage[];
}

/** Текст одной инструкции по ОС (скриншоты в /public/assets/manuals/) */
export interface ManualGuideCopy {
  metaTitle: string;
  title: string;
  intro?: string;
  notices?: string[];
  steps: ManualGuideStep[];
  backToList: string;
}

export interface HeroSlide {
  image: string;
  badge: string;
  title: string;
  titleLine2?: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  secondaryHref?: boolean;
}

export interface PricingCard {
  title: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
  /** Для кабинета /account/plans: платный тариф и фиксированный срок в модалке */
  planMonths?: PlanMonths;
}

export interface SiteMessages {
  locale: Locale;
  brandPrimary: string;
  brandSecondary: string;
  htmlLang: string;
  meta: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogUrl: string;
    twitterTitle: string;
    twitterDescription: string;
  };
  nav: {
    about: string;
    features: string;
    pricing: string;
    faq: string;
    manuals: string;
    articles: string;
    connect: string;
    langRu: string;
    langEn: string;
  };
  breadcrumb: {
    ariaLabel: string;
    home: string;
    login: string;
    register: string;
    terms: string;
    privacy: string;
    manuals: string;
    articles: string;
    forgotPassword: string;
    resetPassword: string;
    verifyEmail: string;
  };
  mobileNav: {
    about: string;
    features: string;
    pricing: string;
    reviews: string;
    faq: string;
    manuals: string;
    articles: string;
    support: string;
    connect: string;
  };
  modal: {
    title: string;
    body: string;
    cta: string;
  };
  /** Главная: выбор «в бот» или «в кабинет» */
  botChoice: {
    title: string;
    body: string;
    goBot: string;
    goAccount: string;
    close: string;
  };
  promo: string;
  heroSlides: HeroSlide[];
  heroBar: {
    security: string;
    securitySub: string;
    speed: string;
    speedSub: string;
    prices: string;
    pricesSub: string;
  };
  about: {
    title: string;
    p1: string;
    p2: string;
    statServers: string;
    statClients: string;
    statUptime: string;
    imageAlt: string;
  };
  featuresSection: {
    title: string;
    subtitle: string;
    items: { icon: string; title: string; body: string }[];
  };
  pricingSection: {
    title: string;
    subtitle: string;
    cards: PricingCard[];
  };
  quiz: {
    title: string;
    subtitle: string;
    q1: string;
    q1Options: string[];
    q2: string;
    q2Options: string[];
    q3: string;
    q3Options: string[];
    loading: string;
    resultTitle: string;
    resultBody: string;
    resultCta: string;
  };
  faqSection: {
    title: string;
    subtitle: string;
    items: { q: string; a: string }[];
  };
  reviewsSection: {
    title: string;
    items: {
      stars: string;
      text: string;
      name: string;
      role: string;
      initial: string;
      avatarClass?: string;
    }[];
  };
  footer: {
    tagline: string;
    menu: string;
    home: string;
    about: string;
    pricing: string;
    reviews: string;
    services: string;
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    support: string;
    bot: string;
    contact: string;
    faq: string;
    helpChoice: string;
    copyright: string;
    privacy: string;
    terms: string;
    manuals: string;
  };
  /** Пользовательское соглашение (SEO) */
  legalPage: {
    metaTitle: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };
  /** Политика конфиденциальности (SEO) */
  privacyPage: {
    metaTitle: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };
  /** Список статей */
  articlesIndex: {
    metaTitle: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    heading: string;
    lead: string;
    empty: string;
  };
  /** Страница одной статьи */
  articlesShow: {
    tocTitle: string;
    tocAria: string;
  };
  /** Публичная страница инструкций */
  manualsPage: {
    metaTitle: string;
    description: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    heading: string;
    deviceIos: string;
    deviceAndroid: string;
    deviceMacos: string;
    deviceWindows: string;
  };
  manualsGuide: Record<ManualPlatform, ManualGuideCopy>;
  auth: {
    loginTitle: string;
    registerTitle: string;
    accountTitle: string;
    email: string;
    password: string;
    submitLogin: string;
    submitRegister: string;
    needAccount: string;
    needAccountLink: string;
    haveAccount: string;
    haveAccountLink: string;
    forgotPasswordLink: string;
    forgotPasswordTitle: string;
    forgotPasswordBlurb: string;
    submitForgotPassword: string;
    /** Ссылка на повторную отправку письма (страница сброса по токену) */
    requestAnotherResetLink: string;
    backToLogin: string;
    resetPasswordTitle: string;
    resetPasswordSubmit: string;
    /** Подзаголовок на странице нового пароля по ссылке из письма */
    resetPasswordBlurb: string;
    /** Разделитель между основной кнопкой и ссылкой «забыли пароль» на регистрации */
    authDividerOr: string;
    accountWelcome: string;
    /** Баннеры напоминаний в личном кабинете (подписка / пробный период). */
    accountNotificationsRegion: string;
    accountNotificationRenew: string;
    accountNotificationDismiss: string;
    accountEmail: string;
    accountTelegram: string;
    /** Кнопка «Привязать Telegram» в кабинете (уникальная ссылка в бота). */
    accountTelegramBindCta: string;
    accountTelegramBindHint: string;
    /** После генерации ссылки — явная ссылка во вкладку (обход блокировки popup). */
    accountTelegramBindOpenHint: string;
    accountTelegramBindOpenCta: string;
    /** Статус в кабинете: привязан только числовой ID (username в БД пустой). Подставьте {id}. */
    accountTelegramLinkedById: string;
    /** Статус: Telegram не привязан. */
    accountTelegramNotLinked: string;
    accountId: string;
    logout: string;
    accountSettingsTitle: string;
    /** Короткая подпись вкладки */
    accountTabLanguage: string;
    accountSectionProfile: string;
    accountTabPlans: string;
    accountTabMyServices: string;
    accountSectionPlans: string;
    accountSectionSecurity: string;
    accountSectionLanguage: string;
    accountDisplayEmail: string;
    accountPasswordHintEmail: string;
    /** У аккаунта ещё нет пароля для входа на сайт — можно задать первый. */
    accountPasswordSetInitialBlurb: string;
    currentPasswordLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    savePassword: string;
    passwordSaved: string;
    languageInterface: string;
    memberSince: string;
    accountLanguageNavHint: string;
    accountTabTickets: string;
    accountTabReferrals: string;
    accountSectionReferrals: string;
    referralPageTitle: string;
    referralPageBlurb: string;
    referralYourCode: string;
    referralShareLink: string;
    referralCopyCode: string;
    referralCopyLink: string;
    referralCopied: string;
    referralInvitedCount: string;
    referralBonusDaysTotal: string;
    referralRewardTableTitle: string;
    referralRewardRows: string[];
    referralHowPayment: string;
    referralApplyTitle: string;
    referralApplyBlurb: string;
    referralApplyPlaceholder: string;
    referralApplySubmit: string;
    referralApplySuccess: string;
    referralAlreadyLinked: string;
    accountAccessTitle: string;
    accountTrialUntil: string;
    accountSubUntil: string;
    accountAccessNone: string;
    profileBuyCta: string;
    accountBalanceTitle: string;
    accountBalanceBlurb: string;
    accountBalanceTopupCta: string;
    accountBalanceTopupModalTitle: string;
    accountBalanceTopupModalIntro: string;
    accountBalanceTopupAmountHint: string;
    accountBalanceTopupInvalid: string;
    profilePayModalTitle: string;
    profilePayModalIntro: string;
    profilePayMethodSbp: string;
    profilePayMethodCrypto: string;
    profilePaySoon: string;
    profilePayClose: string;
    profilePayPlanLabel: string;
    profilePayPriceLabel: string;
    profilePayDiscountLabel: string;
    profilePayNoDiscount: string;
    plansPayMonthsLabel: string;
    plansPayReferralCodeLabel: string;
    plansPayOnSite: string;
    plansPayMoneta: string;
    plansPayPlatega: string;
    plansPayPlategaFiat: string;
    plansPayPlategaCrypto: string;
    plansPaymentNotReady: string;
    plansPaymentNotEligible: string;
    plansPaymentPlanUnavailable: string;
    plansPaymentNoAuthUrl: string;
    plansPaymentProviderUnavailable: string;
    plansPaymentPlategaError: string;
    plansPaymentPopupBlocked: string;
    plansPaymentManualOpenLink: string;
    plansMyServicesTitle: string;
    plansMyServicesBlurb: string;
    plansTableColService: string;
    plansTableColUntil: string;
    plansTableColDetails: string;
    plansVpnBlockTitle: string;
    plansVpnExpires: string;
    plansVpnCopyLink: string;
    plansVpnQrCaption: string;
    plansVpnNoKey: string;
    plansRenewCta: string;
    plansRenewModalHint: string;
    plansTrialBlockTitle: string;
    plansTrialTelegramHint: string;
    plansTrialAlreadyUsed: string;
    plansTrialActivate: string;
    plansTrialActivating: string;
    plansTrialSuccess: string;
    plansTrialServerError: string;
    plansTrialEmailUnverified: string;
    plansTrialEmailUnverifiedHint: string;
    /** Сообщение об ошибке при активации пробного периода без подтверждённой почты */
    plansTrialEmailUnverifiedError: string;
    plansTrialActivateCta: string;
    /** Баннер над карточкой кабинета, если email не подтверждён */
    accountEmailUnverifiedBanner: string;
    accountProfileVerificationLinkCta: string;
    profileEmailVerificationNeverSent: string;
    profileEmailVerificationSend: string;
    profileEmailVerificationResend: string;
    profileEmailVerificationWaitSeconds: string;
    verifyEmailTitle: string;
    verifyEmailSubtitle: string;
    verifyEmailStatusResent: string;
    verifyEmailResendCta: string;
    verifyEmailLogout: string;
    transactionsTitle: string;
    transactionsEmpty: string;
    transactionsColDate: string;
    transactionsColAmount: string;
    transactionsColPlan: string;
    transactionsColStatus: string;
    transactionsColChannel: string;
    transactionsMonthsSuffix: string;
    transactionStatusCompleted: string;
    transactionStatusPending: string;
    transactionProviderTelegramBot: string;
    transactionProviderMoneta: string;
    transactionProviderPlatega: string;
    transactionProviderTestRedeem: string;
    transactionProviderSiteTrial: string;
    transactionsPlanTrial: string;
    transactionProviderUnknown: string;
    errors: {
      validation: string;
      email_taken: string;
      credentials: string;
      server: string;
      network: string;
      unauthorized: string;
      not_found: string;
      wrong_password: string;
      no_password: string;
      password_mismatch: string;
      referral_invalid: string;
      referral_self: string;
      referral_already: string;
      referral_mismatch: string;
    };
  };
  supportTickets: {
    pageTitle: string;
    pageSubtitle: string;
    metaDescription: string;
    newTicket: string;
    listEmpty: string;
    subject: string;
    message: string;
    placeholderSubject: string;
    placeholderMessage: string;
    submit: string;
    submitting: string;
    backToList: string;
    ticketPrefix: string;
    statusLabel: string;
    statusOpen: string;
    statusInProgress: string;
    statusClosed: string;
    createdAt: string;
    updatedAt: string;
    ticketBody: string;
    successHint: string;
    threadTitle: string;
    labelYou: string;
    labelUser: string;
    labelSupport: string;
    replyPlaceholder: string;
    replySubmit: string;
    replySubmitting: string;
    refreshButton: string;
    refreshing: string;
    errors: {
      validation: string;
      server: string;
      network: string;
      replyValidation: string;
      replyServer: string;
    };
  };
  adminPanel: {
    title: string;
    backToSite: string;
    navDashboard: string;
    navUsers: string;
    navTariffs: string;
    navReferrals: string;
    navSupport: string;
    navPayments: string;
    navMoneta: string;
    navArticles: string;
    articlesTitle: string;
    articlesCreate: string;
    articlesColId: string;
    articlesColLocale: string;
    articlesColSlug: string;
    articlesColTitle: string;
    articlesColPublished: string;
    articlesColUpdated: string;
    articlesActionEdit: string;
    articlesFiltersLocale: string;
    articlesFiltersAll: string;
    articlesFiltersSearch: string;
    articlesFiltersApply: string;
    articlesFormCreate: string;
    articlesFormEdit: string;
    articlesFormLocale: string;
    articlesFormSlug: string;
    articlesFormTitle: string;
    articlesFormMetaTitle: string;
    articlesFormMetaDesc: string;
    articlesFormMetaKeywords: string;
    articlesFormOgTitle: string;
    articlesFormOgDesc: string;
    articlesFormExcerpt: string;
    articlesFormBody: string;
    articlesFormPublished: string;
    articlesFormPublishedAt: string;
    articlesFormSave: string;
    articlesFormBack: string;
    dashboardUsers: string;
    dashboardTicketsOpen: string;
    dashboardTicketsTotal: string;
    dashboardTx: string;
    dashboardReferralRows: string;
    usersTitle: string;
    usersSearch: string;
    usersSearchPlaceholder: string;
    usersColId: string;
    usersColEmail: string;
    usersColName: string;
    usersColSub: string;
    usersColRegistered: string;
    usersColTheir: string;
    usersColAdmin: string;
    usersAction: string;
    userEditTitle: string;
    userSaved: string;
    userSave: string;
    userFieldName: string;
    userEmailReadonly: string;
    userFieldLanguage: string;
    userFieldIsTheir: string;
    userFieldIsAdmin: string;
    userSuperadminNote: string;
    userFieldSubUntil: string;
    userFieldTrialUntil: string;
    userFieldReferralCode: string;
    userFieldReferredBy: string;
    tariffsTitle: string;
    tariffsIntro: string;
    tariffsTablePlan: string;
    tariffsTablePrice: string;
    tariffsSectionGlobal: string;
    tariffsLabelBaseMonthly: string;
    tariffsLabelTrialDays: string;
    tariffsSaveGlobal: string;
    tariffsSectionTerms: string;
    tariffsColMonths: string;
    tariffsColDiscount: string;
    tariffsColReferrerDays: string;
    tariffsColSort: string;
    tariffsColActive: string;
    tariffsColPay: string;
    tariffsAddTerm: string;
    tariffsSaveTerm: string;
    tariffsDeleteTerm: string;
    tariffsSaved: string;
    tariffsMonthsTaken: string;
    adminTablePerPage: string;
    adminTableSearch: string;
    adminTableSearchPlaceholder: string;
    adminTableApply: string;
    adminTableTotal: string;
    referralsTitle: string;
    referralsColReferrer: string;
    referralsColReferee: string;
    referralsColMonths: string;
    referralsColDays: string;
    supportTitle: string;
    supportColId: string;
    supportColUser: string;
    supportColSubject: string;
    supportColStatus: string;
    supportColDate: string;
    ticketDetailTitle: string;
    ticketChangeStatus: string;
    paymentsTitle: string;
    paymentsColId: string;
    paymentsColUser: string;
    paymentsColAmount: string;
    paymentsColPlan: string;
    paymentsColProvider: string;
    paymentsColDate: string;
    monetaTitle: string;
    monetaColId: string;
    monetaColUser: string;
    monetaColMonths: string;
    monetaPurposeBalance: string;
    monetaColCreated: string;
    monetaColTx: string;
    monetaColAmount: string;
    monetaColDone: string;
    paginationPrev: string;
    paginationNext: string;
    yes: string;
    no: string;
    errors: {
      saveFailed: string;
      referralTaken: string;
    };
  };
}
