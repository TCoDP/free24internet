import type { Metadata } from "next";
import { HomeView } from "@/components/HomeView";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { en } from "@/lib/messages/en";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
  keywords: en.meta.keywords,
  openGraph: {
    title: en.meta.ogTitle,
    description: en.meta.ogDescription,
    url: en.meta.ogUrl,
    images: [{ url: "/assets/img/hero-1.jpg" }],
  },
  twitter: {
    title: en.meta.twitterTitle,
    description: en.meta.twitterDescription,
  },
  alternates: {
    canonical: `${SITE_ORIGIN}/en`,
    languages: { ru: SITE_ORIGIN, en: `${SITE_ORIGIN}/en` },
  },
};

export default async function EnHomePage() {
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <HomeView messages={messages} />
    </SiteShell>
  );
}
