"use client";

import { pickAccountError } from "@/lib/account/pick-account-error";
import type { SiteMessages } from "@/lib/messages/types";
import { useCallback, useState } from "react";

export function TelegramAccountLink({
  messages,
  botConfigured,
  webhookConfigured,
  linked,
  tgUsername,
}: {
  messages: SiteMessages;
  botConfigured: boolean;
  webhookConfigured: boolean;
  linked: boolean;
  tgUsername: string | null;
}) {
  const { auth: a } = messages;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    setError(null);
    setCopied(false);
    setLoading(true);
    try {
      const res = await fetch("/api/account/telegram-link-token", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        deepLink?: string;
        expiresAt?: string;
      };
      if (!res.ok) {
        if (data.error === "not_configured") setError(a.telegramNotConfigured);
        else setError(pickAccountError(a.errors, data.error));
        setDeepLink(null);
        setExpiresAt(null);
        return;
      }
      if (data.deepLink && data.expiresAt) {
        setDeepLink(data.deepLink);
        setExpiresAt(data.expiresAt);
      }
    } catch {
      setError(a.errors.network);
    } finally {
      setLoading(false);
    }
  }, [a]);

  const copyLink = useCallback(async () => {
    if (!deepLink) return;
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(a.errors.network);
    }
  }, [deepLink, a.errors.network]);

  if (linked) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-emerald-800">{a.linkTelegramTitle}</h3>
        <p className="mt-2 text-sm font-semibold text-emerald-900">{a.linkTelegramLinked}</p>
        {tgUsername ? (
          <p className="mt-2 font-mono text-lg font-bold text-dark">@{tgUsername}</p>
        ) : null}
      </div>
    );
  }

  if (!botConfigured) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-600">{a.linkTelegramTitle}</h3>
        <p className="mt-2 text-sm text-slate-600">{a.telegramNotConfigured}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/50 to-white p-6 shadow-inner sm:p-8">
      <h3 className="text-sm font-black uppercase tracking-wide text-primary">{a.linkTelegramTitle}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.linkTelegramBlurb}</p>

      {!webhookConfigured ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-950">
          {a.linkTelegramWebhookMissing}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? "…" : a.linkTelegramGenerate}
        </button>
        {deepLink ? (
          <>
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-extrabold text-dark transition-colors hover:border-primary hover:text-primary"
            >
              {a.linkTelegramOpenTelegram}
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-300"
            >
              {copied ? a.linkTelegramCopied : a.linkTelegramCopy}
            </button>
          </>
        ) : null}
      </div>

      {deepLink && expiresAt ? (
        <p className="mt-4 text-xs text-slate-500">
          {a.linkTelegramExpiresHint}{" "}
          <span className="font-mono">
            {new Date(expiresAt).toLocaleString(messages.locale === "en" ? "en-GB" : "ru-RU", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </p>
      ) : null}
    </div>
  );
}
