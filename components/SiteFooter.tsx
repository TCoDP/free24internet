import Link from "next/link";
import type { SiteMessages } from "@/lib/messages/types";
import { pathPrefix } from "@/lib/locale";
import { TELEGRAM_BOT_URL } from "@/lib/constants";

export function SiteFooter({ messages }: { messages: SiteMessages }) {
  const p = pathPrefix(messages.locale);
  const base = p || "";
  const homeHref = base || "/";
  const privacyHref = messages.locale === "en" ? "/en/privacy" : "/privacy";
  const termsHref = messages.locale === "en" ? "/en/terms" : "/terms";

  return (
    <footer className="bg-[#111418] pt-16 text-gray-300 pb-[max(3.5rem,calc(2rem+env(safe-area-inset-bottom,0px)))] md:pb-[max(4.5rem,calc(2rem+env(safe-area-inset-bottom,0px)))]">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href={homeHref}
              className="mb-4 flex items-center gap-2 text-2xl font-black text-white"
            >
              <span className="text-primary">{messages.brandPrimary}</span>
              {messages.brandSecondary}
            </Link>
            <p className="mb-6 max-w-xs leading-relaxed text-gray-400">{messages.footer.tagline}</p>
            <div className="flex gap-4">
              <a
                href={TELEGRAM_BOT_URL}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition-all hover:-translate-y-1 hover:bg-white/15"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.19.27-.39.75-.59 2.95-1.28 4.91-2.13 5.89-2.53 2.79-1.15 3.37-1.35 3.76-1.36.09 0 .28.02.39.11.09.07.12.18.13.26 0 .04.01.12.01.19z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-white">{messages.footer.menu}</h4>
            <ul className="space-y-4">
              <li>
                <Link href={homeHref} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.home}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#about`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.about}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#pricing`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.pricing}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#reviews`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.reviews}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-white">{messages.footer.services}</h4>
            <ul className="space-y-4">
              <li>
                <Link href={`${base}/#features`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.s1}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#features`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.s2}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#features`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.s3}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#features`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.s4}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-white">{messages.footer.support}</h4>
            <ul className="space-y-4">
              <li>
                <a href={TELEGRAM_BOT_URL} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.bot}
                </a>
              </li>
              <li>
                <a href={TELEGRAM_BOT_URL} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.contact}
                </a>
              </li>
              <li>
                <Link href={`${base}/#faq`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.faq}
                </Link>
              </li>
              <li>
                <Link href={`${base}/#quiz`} className="text-gray-400 transition-colors hover:text-primary">
                  {messages.footer.helpChoice}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">
          <p>{messages.footer.copyright}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href={privacyHref} className="transition-colors hover:text-white">
              {messages.footer.privacy}
            </Link>
            <Link href={termsHref} className="transition-colors hover:text-white">
              {messages.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
