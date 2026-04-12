"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { accountSectionPath } from "@/lib/account/paths";
import { pickAccountError } from "@/lib/account/pick-account-error";

export function AccountLanguageSwitcher({
  messages,
  storedLanguage,
}: {
  messages: SiteMessages;
  storedLanguage: "ru" | "en";
}) {
  const router = useRouter();
  const { auth } = messages;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLanguage = useCallback(
    async (next: "ru" | "en") => {
      if (next === storedLanguage) return;
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: next }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(pickAccountError(auth.errors, data.error));
          setLoading(false);
          return;
        }
        router.push(accountSectionPath(next, "language"));
        router.refresh();
      } catch {
        setError(auth.errors.network);
      } finally {
        setLoading(false);
      }
    },
    [storedLanguage, router, auth.errors],
  );

  const btn = (code: "ru" | "en", label: string, flag: string) => {
    const active = storedLanguage === code;
    return (
      <button
        type="button"
        disabled={loading}
        onClick={() => void setLanguage(code)}
        className={`flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-4 py-4 text-center transition-all disabled:opacity-60 sm:min-h-[5rem] sm:flex-initial sm:min-w-[10rem] ${
          active
            ? "border-primary bg-primary/10 text-primary shadow-md shadow-primary/10"
            : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <span className="text-2xl leading-none" aria-hidden>
          {flag}
        </span>
        <span className="text-sm font-bold">{label}</span>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/80 p-6 sm:p-8">
      <p className="mb-6 max-w-xl text-slate-600">{auth.languageInterface}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {btn("ru", messages.nav.langRu, "🇷🇺")}
        {btn("en", messages.nav.langEn, "🇬🇧")}
      </div>
      {error ? (
        <p className="mt-4 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-6 text-xs text-slate-500">{auth.accountLanguageNavHint}</p>
    </div>
  );
}
