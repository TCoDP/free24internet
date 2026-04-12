"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";
import type { SiteMessages } from "@/lib/messages/types";
import { accountSectionPath } from "@/lib/account/paths";
import { pathPrefix } from "@/lib/locale";
import { TELEGRAM_BOT_URL } from "@/lib/constants";
import { useConnectModal } from "./ConnectModalContext";

export function SiteHeader({
  messages,
  user,
}: {
  messages: SiteMessages;
  user: SessionUser | null;
}) {
  const { openModal } = useConnectModal();
  const p = pathPrefix(messages.locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobile = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /** Не оставлять фокус внутри закрытого оверлея (конфликт с aria-hidden / inert). */
  useEffect(() => {
    if (menuOpen) {
      const id = requestAnimationFrame(() => {
        closeButtonRef.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(id);
    }
    const root = menuPanelRef.current;
    const active = document.activeElement;
    if (root && active instanceof HTMLElement && root.contains(active)) {
      menuButtonRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  const langActiveRu = messages.locale === "ru";
  const langActiveEn = messages.locale === "en";

  return (
    <>
    <header className="fixed top-0 z-[1000] w-full bg-gray-900/95 shadow-lg backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 md:gap-4 md:px-8">
        <Link
          href={p || "/"}
          className="flex shrink-0 items-center gap-2 text-xl font-black text-white md:text-2xl"
        >
          <span className="text-primary">{messages.brandPrimary}</span>
          {messages.brandSecondary}
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-6 lg:flex xl:gap-8">
          <Link
            href={`${p || ""}/#about`}
            className="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            {messages.nav.about}
          </Link>
          <Link
            href={`${p || ""}/#features`}
            className="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            {messages.nav.features}
          </Link>
          <Link
            href={`${p || ""}/#pricing`}
            className="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            {messages.nav.pricing}
          </Link>
          <Link
            href={`${p || ""}/#faq`}
            className="shrink-0 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
          >
            {messages.nav.faq}
          </Link>
        </div>

        {/* Один блок справа: авторизация + язык + CTA — иначе justify-between сжимает «Вход» и «Регистрацию» в одну строку без зазора */}
        <div className="hidden shrink-0 items-center gap-3 md:gap-5 lg:flex">
          {user ? (
            <div className="flex items-center gap-4 border-r border-slate-600/80 pr-4 md:pr-5">
              <Link
                href={accountSectionPath(messages.locale, "profile")}
                className="whitespace-nowrap text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                {messages.auth.accountTitle}
              </Link>
              {user.isAdmin ? (
                <Link
                  href={p ? `${p}/admin` : "/admin"}
                  className="whitespace-nowrap text-sm font-bold text-amber-400 transition-colors hover:text-amber-200"
                >
                  {messages.adminPanel.title}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-4 border-r border-slate-600/80 pr-4 md:pr-5">
              <Link
                href={`${p}/login`}
                className="whitespace-nowrap text-sm font-semibold text-gray-300 transition-colors hover:text-white"
              >
                {messages.auth.loginTitle}
              </Link>
              <Link
                href={`${p}/register`}
                className="whitespace-nowrap text-sm font-bold text-primary transition-colors hover:text-white"
              >
                {messages.auth.registerTitle}
              </Link>
            </div>
          )}
          <div className="group relative">
            <button
              type="button"
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-gray-300 transition-colors hover:text-white"
            >
              {messages.locale === "ru" ? "RU" : "EN"}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div className="invisible absolute right-0 z-50 mt-2 w-32 origin-top-right scale-95 rounded-xl border border-slate-100 bg-white p-2 opacity-0 shadow-xl transition-all duration-300 group-hover:visible group-hover:scale-100 group-hover:opacity-100">
              <div className="flex flex-col gap-1">
                <Link
                  href="/"
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold ${langActiveRu ? "bg-slate-50 text-primary" : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary"}`}
                >
                  {messages.nav.langRu}
                  <span className="text-base">🇷🇺</span>
                </Link>
                <Link
                  href="/en"
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${langActiveEn ? "bg-slate-50 font-bold text-primary" : "font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary"}`}
                >
                  {messages.nav.langEn}
                  <span className="text-base">🇬🇧</span>
                </Link>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="animate-pulse-custom shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-hover hover:-translate-y-0.5 md:px-6"
          >
            {messages.nav.connect}
          </button>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="p-2 text-white lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-dialog"
          aria-label="Menu"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>
    </header>

      {/* Вне <header>: backdrop-blur на предке ломает position:fixed у потомков (меню «не закрывается»). */}
      <div
        id="mobile-nav-dialog"
        ref={menuPanelRef}
        className={`mobile-nav-drawer fixed inset-0 z-[1001] flex flex-col bg-white pb-8 pt-[env(safe-area-inset-top)] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          WebkitTransform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          // Не используем inert/pointer-events:none в закрытом состоянии: если transform не сработал бы,
          // панель оставалась бы видимой, но клики не доходили бы до кнопки закрытия.
        }}
        aria-hidden={!menuOpen}
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen ? true : undefined}
        aria-label={menuOpen ? "Menu" : undefined}
      >
        <div className="mb-2 mt-2 flex items-center justify-between border-b border-slate-200 p-4">
          <Link
            href={p || "/"}
            onClick={closeMobile}
            className="flex items-center gap-2 pl-2 text-xl font-black text-dark"
          >
            <span className="text-primary">{messages.brandPrimary}</span>
            {messages.brandSecondary}
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            className="mr-2 flex items-center justify-center rounded-lg border-2 border-amber-500 bg-white p-1.5 text-slate-800 transition-all hover:bg-slate-50"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex flex-col px-6">
          <Link
            href={`${p || ""}/#about`}
            onClick={closeMobile}
            className="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary"
          >
            {messages.mobileNav.about}
          </Link>
          <Link
            href={`${p || ""}/#features`}
            onClick={closeMobile}
            className="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary"
          >
            {messages.mobileNav.features}
          </Link>
          <Link
            href={`${p || ""}/#pricing`}
            onClick={closeMobile}
            className="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary"
          >
            {messages.mobileNav.pricing}
          </Link>
          <Link
            href={`${p || ""}/#reviews`}
            onClick={closeMobile}
            className="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary"
          >
            {messages.mobileNav.reviews}
          </Link>
          <Link
            href={`${p || ""}/#faq`}
            onClick={closeMobile}
            className="mobile-link border-b border-slate-200 py-5 text-lg font-bold text-dark transition-colors hover:text-primary"
          >
            {messages.mobileNav.faq}
          </Link>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 px-6 pt-6">
          {user ? (
            <>
              <Link
                href={accountSectionPath(messages.locale, "profile")}
                onClick={closeMobile}
                className="rounded-xl bg-slate-100 py-4 text-center text-lg font-bold text-dark transition-colors hover:bg-slate-200"
              >
                {messages.auth.accountTitle}
              </Link>
              {user.isAdmin ? (
                <Link
                  href={p ? `${p}/admin` : "/admin"}
                  onClick={closeMobile}
                  className="rounded-xl border-2 border-amber-500 py-4 text-center text-lg font-bold text-amber-800 transition-colors hover:bg-amber-50"
                >
                  {messages.adminPanel.title}
                </Link>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href={`${p}/login`}
                onClick={closeMobile}
                className="rounded-xl border-2 border-slate-200 py-4 text-center text-lg font-bold text-dark transition-colors hover:border-primary hover:text-primary"
              >
                {messages.auth.loginTitle}
              </Link>
              <Link
                href={`${p}/register`}
                onClick={closeMobile}
                className="rounded-xl bg-primary py-4 text-center text-lg font-bold text-white shadow-md transition-colors hover:bg-primary-hover"
              >
                {messages.auth.registerTitle}
              </Link>
            </>
          )}
        </div>
        <div className="mt-auto flex flex-col px-6 pt-8">
          <div className="mb-8 flex items-center justify-center gap-4">
            <Link
              href="/"
              onClick={closeMobile}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 ${langActiveRu ? "bg-slate-100 font-bold text-primary" : "font-semibold text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="text-xl">🇷🇺</span> RU
            </Link>
            <Link
              href="/en"
              onClick={closeMobile}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 ${langActiveEn ? "bg-slate-100 font-bold text-primary" : "font-semibold text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="text-xl">🇬🇧</span> EN
            </Link>
          </div>
          <div className="mb-6 flex items-center gap-3">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.33-1.08-.7.02-.19.27-.39.75-.59 2.95-1.28 4.91-2.13 5.89-2.53 2.79-1.15 3.37-1.35 3.76-1.36.09 0 .28.02.39.11.09.07.12.18.13.26 0 .04.01.12.01.19z"
              />
            </svg>
            <a
              href={TELEGRAM_BOT_URL}
              className="text-xl font-extrabold text-dark transition-colors hover:text-primary"
            >
              {messages.mobileNav.support}
            </a>
          </div>
          <a
            href={TELEGRAM_BOT_URL}
            onClick={closeMobile}
            className="w-full rounded-xl bg-[#991b1b] py-4 text-center text-lg font-bold text-white shadow-md transition-all hover:bg-[#7f1d1d]"
          >
            {messages.mobileNav.connect}
          </a>
        </div>
      </div>
    </>
  );
}
