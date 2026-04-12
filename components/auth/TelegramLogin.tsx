"use client";

import { TELEGRAM_BOT_USERNAME } from "@/lib/constants";
import type { SiteMessages } from "@/lib/messages/types";
import { accountSectionPath } from "@/lib/account/paths";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function isLocalHttp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "http:" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  );
}

export function TelegramLogin({
  messages,
  enabled,
}: {
  messages: SiteMessages;
  enabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tgError, setTgError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const accountPath = accountSectionPath(messages.locale, "profile");

  const onTelegramPayload = useCallback(
    async (user: unknown) => {
      setTgError(null);
      setLoading(true);
      try {
        const res = await signIn("telegram", {
          payload: JSON.stringify(user),
          redirect: false,
        });
        if (res?.error || !res?.ok) {
          setTgError(messages.auth.telegramError);
          return;
        }
        const nextRaw = searchParams.get("next");
        const nextOk =
          nextRaw &&
          nextRaw.startsWith("/") &&
          !nextRaw.startsWith("//") &&
          !nextRaw.includes("://");
        router.push(nextOk ? nextRaw : accountPath);
        router.refresh();
      } catch {
        setTgError(messages.auth.errors.network);
      } finally {
        setLoading(false);
      }
    },
    [router, searchParams, accountPath, messages.auth],
  );

  const handlerRef = useRef(onTelegramPayload);
  handlerRef.current = onTelegramPayload;

  useLayoutEffect(() => {
    if (!enabled) return;

    const el = containerRef.current;
    if (!el) return;

    const localHttp = isLocalHttp();
    if (localHttp) setShowTroubleshoot(true);

    const w = window as Window & { onTelegramAuth?: (user: unknown) => void };
    w.onTelegramAuth = (u: unknown) => {
      void handlerRef.current(u);
    };

    el.replaceChildren();

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "14");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    let emptyCheckId: number | undefined;

    script.addEventListener("load", () => {
      emptyCheckId = window.setTimeout(() => {
        if (!el.querySelector("iframe")) setShowTroubleshoot(true);
      }, 3500);
    });
    script.addEventListener("error", () => setShowTroubleshoot(true));

    el.appendChild(script);

    return () => {
      if (emptyCheckId !== undefined) window.clearTimeout(emptyCheckId);
      delete w.onTelegramAuth;
      script.remove();
      el.replaceChildren();
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <p className="text-center text-sm text-slate-500">{messages.auth.telegramNotConfigured}</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {tgError ? (
        <p
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-800"
          role="alert"
        >
          {tgError}
        </p>
      ) : null}
      {loading ? <p className="text-sm font-semibold text-slate-500">…</p> : null}

      <div
        ref={containerRef}
        className="flex min-h-[52px] w-full max-w-sm justify-center [&_iframe]:max-w-full"
      />

      {showTroubleshoot ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-semibold leading-relaxed text-amber-950">
          {messages.auth.telegramLocalHttpsHint}
        </p>
      ) : null}

      <p className="text-center text-xs text-slate-500">{messages.auth.telegramLoginHint}</p>
    </div>
  );
}
