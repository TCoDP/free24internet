"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { accountSectionPath } from "@/lib/account/paths";
import { TELEGRAM_BOT_URL } from "@/lib/constants";
import type { SiteMessages } from "@/lib/messages/types";

type Ctx = { openBotChoice: () => void };

const BotOrAccountContext = createContext<Ctx | null>(null);

export function useBotOrAccount(): Ctx | null {
  return useContext(BotOrAccountContext);
}

export function BotOrAccountProvider({
  messages,
  children,
}: {
  messages: SiteMessages;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openBotChoice = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const { botChoice } = messages;
  const plansHref = accountSectionPath(messages.locale, "plans");

  return (
    <BotOrAccountContext.Provider value={{ openBotChoice }}>
      {children}
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bot-choice-title"
        >
          <button
            type="button"
            aria-label={botChoice.close}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <h2 id="bot-choice-title" className="text-xl font-black text-dark md:text-2xl">
              {botChoice.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{botChoice.body}</p>
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="rounded-xl bg-primary py-3.5 text-center text-base font-extrabold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover"
              >
                {botChoice.goBot}
              </a>
              <Link
                href={plansHref}
                onClick={close}
                className="rounded-xl border-2 border-slate-200 py-3.5 text-center text-base font-extrabold text-dark hover:border-primary hover:text-primary"
              >
                {botChoice.goAccount}
              </Link>
              <button
                type="button"
                onClick={close}
                className="py-2 text-sm font-bold text-slate-500 hover:text-dark"
              >
                {botChoice.close}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </BotOrAccountContext.Provider>
  );
}

export function BotOrAccountTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(BotOrAccountContext);
  if (!ctx) {
    return (
      <a href={TELEGRAM_BOT_URL} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={`cursor-pointer ${className ?? ""}`} onClick={ctx.openBotChoice}>
      {children}
    </button>
  );
}
