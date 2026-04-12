import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { HtmlLang } from "@/components/HtmlLang";
import { SessionProvider } from "@/components/SessionProvider";
import { YandexMetrika } from "@/components/YandexMetrika";
import { SITE_ORIGIN } from "@/lib/constants";
import { ru } from "@/lib/messages/ru";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: ru.meta.title,
    template: "%s — Свободный Интернет",
  },
  description: ru.meta.description,
  keywords: ru.meta.keywords,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: ru.meta.ogTitle,
    description: ru.meta.ogDescription,
    url: ru.meta.ogUrl,
    images: [{ url: "/assets/img/hero-1.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: ru.meta.twitterTitle,
    description: ru.meta.twitterDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${nunito.variable} scroll-smooth`}>
      <body className="overflow-x-hidden bg-light font-sans leading-relaxed text-slate-700 antialiased">
        <HtmlLang />
        <SessionProvider>{children}</SessionProvider>
        <YandexMetrika />
      </body>
    </html>
  );
}
