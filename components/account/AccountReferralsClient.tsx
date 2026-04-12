"use client";

import { pickAccountError } from "@/lib/account/pick-account-error";
import { pathPrefix } from "@/lib/locale";
import { SITE_ORIGIN } from "@/lib/constants";
import type { SiteMessages } from "@/lib/messages/types";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
export function AccountReferralsClient({
  messages,
  code,
  invitedCount,
  bonusDaysTotal,
  hasReferrer,
}: {
  messages: SiteMessages;
  code: string;
  invitedCount: number;
  bonusDaysTotal: number;
  hasReferrer: boolean;
}) {
  const router = useRouter();
  const { auth: a } = messages;
  const p = pathPrefix(messages.locale);
  const registerPath = `${p}/register`;
  const shareUrl = `${SITE_ORIGIN}${registerPath}?ref=${encodeURIComponent(code)}`;

  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [applyCode, setApplyCode] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyOk, setApplyOk] = useState(false);

  const copy = useCallback(
    async (kind: "code" | "link", text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 2000);
      } catch {
        setApplyError(a.errors.network);
      }
    },
    [a.errors.network],
  );

  const applyReferral = useCallback(async () => {
    setApplyError(null);
    setApplyOk(false);
    setApplyLoading(true);
    try {
      const res = await fetch("/api/account/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: applyCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setApplyError(pickAccountError(a.errors, data.error));
        return;
      }
      setApplyOk(true);
      setApplyCode("");
      router.refresh();
    } catch {
      setApplyError(a.errors.network);
    } finally {
      setApplyLoading(false);
    }
  }, [applyCode, a.errors, router]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-primary">{a.referralYourCode}</h3>
        <p className="mt-4 font-mono text-2xl font-bold tracking-wide text-dark">{code}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copy("code", code)}
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-dark hover:border-primary"
          >
            {copied === "code" ? a.referralCopied : a.referralCopyCode}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-primary">{a.referralShareLink}</h3>
        <p className="mt-3 break-all font-mono text-sm text-slate-700">{shareUrl}</p>
        <button
          type="button"
          onClick={() => void copy("link", shareUrl)}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover"
        >
          {copied === "link" ? a.referralCopied : a.referralCopyLink}
        </button>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">{a.referralHowPayment}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{a.referralInvitedCount}</p>
          <p className="mt-2 text-3xl font-black text-emerald-950">{invitedCount}</p>
        </div>
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-900">{a.referralBonusDaysTotal}</p>
          <p className="mt-2 text-3xl font-black text-sky-950">{bonusDaysTotal}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-slate-50/40 p-6 sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-dark">{a.referralRewardTableTitle}</h3>
        <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
          {a.referralRewardRows.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-primary">✓</span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-wide text-primary">{a.referralApplyTitle}</h3>
        <p className="mt-2 text-sm text-slate-600">{a.referralApplyBlurb}</p>
        {hasReferrer ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            {a.referralAlreadyLinked}
          </p>
        ) : (
          <>
            <input
              type="text"
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value)}
              placeholder={a.referralApplyPlaceholder}
              className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm outline-none ring-primary/30 focus:ring-2"
              autoComplete="off"
            />
            {applyError ? (
              <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
                {applyError}
              </p>
            ) : null}
            {applyOk ? (
              <p className="mt-3 text-sm font-semibold text-emerald-800">{a.referralApplySuccess}</p>
            ) : null}
            <button
              type="button"
              disabled={applyLoading || !applyCode.trim()}
              onClick={() => void applyReferral()}
              className="mt-4 rounded-xl bg-dark px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {applyLoading ? "…" : a.referralApplySubmit}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
