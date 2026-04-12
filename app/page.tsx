import type { Metadata } from "next";
import { BotOrAccountProvider } from "@/components/bot-or-account/BotOrAccountProvider";
import { HomeView } from "@/components/HomeView";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { applyPricingToSiteMessages } from "@/lib/pricing/apply-pricing-to-messages";
import { getPricingConfig } from "@/lib/pricing/load-pricing";
import { ru } from "@/lib/messages/ru";

export const metadata: Metadata = {
  title: ru.meta.title,
  description: ru.meta.description,
  keywords: ru.meta.keywords,
  openGraph: {
    title: ru.meta.ogTitle,
    description: ru.meta.ogDescription,
    url: ru.meta.ogUrl,
    images: [{ url: "/assets/img/hero-1.jpg" }],
  },
  twitter: {
    title: ru.meta.twitterTitle,
    description: ru.meta.twitterDescription,
  },
  alternates: {
    canonical: SITE_ORIGIN,
    languages: { ru: SITE_ORIGIN, en: `${SITE_ORIGIN}/en` },
  },
};

export default async function HomePage() {
  const pricing = await getPricingConfig();
  const messages = applyPricingToSiteMessages(getMessages("ru"), pricing);
  return (
    <SiteShell messages={messages}>
      <BotOrAccountProvider messages={messages}>
        <HomeView messages={messages} pricing={pricing} />
      </BotOrAccountProvider>
    </SiteShell>
  );
}
