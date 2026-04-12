export type Locale = "ru" | "en";

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
    connect: string;
    langRu: string;
    langEn: string;
  };
  mobileNav: {
    about: string;
    features: string;
    pricing: string;
    reviews: string;
    faq: string;
    support: string;
    connect: string;
  };
  modal: {
    title: string;
    body: string;
    cta: string;
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
    cards: [PricingCard, PricingCard, PricingCard];
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
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    accountTitle: string;
    email: string;
    password: string;
    name: string;
    nameHint: string;
    submitLogin: string;
    submitRegister: string;
    needAccount: string;
    needAccountLink: string;
    haveAccount: string;
    haveAccountLink: string;
    accountWelcome: string;
    accountEmail: string;
    accountId: string;
    logout: string;
    backHome: string;
    errors: {
      validation: string;
      email_taken: string;
      credentials: string;
      server: string;
      network: string;
    };
  };
}
