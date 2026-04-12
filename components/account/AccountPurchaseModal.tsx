"use client";

import type { SiteMessages } from "@/lib/messages/types";
import {
  activePlanMonthValues,
  formatRub,
  planPayRubFromConfig,
  planSavingsRubFromConfig,
  type PricingConfig,
} from "@/lib/pricing/pricing-config";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

export function AccountPurchaseModal({
  messages,
  pricing,
  open,
  onClose,
  lockedPlanMonths,
  trialOnly,
  planHeading,
}: {
  messages: SiteMessages;
  pricing: PricingConfig;
  open: boolean;
  onClose: () => void;
  /** null = выбор срока в списке; число = выбранный тариф с страницы планов */
  lockedPlanMonths: number | null;
  trialOnly: boolean;
  planHeading?: string;
}) {
  const a = messages.auth;
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const firstMonth = activePlanMonthValues(pricing)[0] ?? 1;
  const [planMonths, setPlanMonths] = useState(firstMonth);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setMsg(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const opts = activePlanMonthValues(pricing);
    const fallback = opts[0] ?? 1;
    if (lockedPlanMonths != null) {
      setPlanMonths(opts.includes(lockedPlanMonths) ? lockedPlanMonths : fallback);
    } else if (!trialOnly) {
      setPlanMonths(fallback);
    }
    setReferralCode("");
    setMsg(null);
  }, [open, lockedPlanMonths, trialOnly, pricing]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const pay = useCallback(async () => {
    if (trialOnly) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planMonths,
          referralCode: referralCode.trim() || undefined,
          locale: messages.locale,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reason?: string;
        redirectUrl?: string;
      };
      if (data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.reason === "no_auth_url") setMsg(a.plansPaymentNoAuthUrl);
      else if (data.reason === "not_configured") setMsg(a.plansPaymentNotReady);
      else if (data.reason === "not_eligible") setMsg(a.plansPaymentNotEligible);
      else if (data.reason === "plan_unavailable") setMsg(a.plansPaymentPlanUnavailable);
      else setMsg(a.errors.server);
    } catch {
      setMsg(a.errors.network);
    } finally {
      setLoading(false);
    }
  }, [trialOnly, planMonths, referralCode, messages.locale, a]);

  if (!open || !mounted) return null;

  const planCard = !trialOnly
    ? messages.pricingSection.cards.find((c) => c.planMonths === planMonths)
    : undefined;
  const planTitle =
    planHeading ??
    planCard?.title ??
    `${planMonths} ${a.transactionsMonthsSuffix}`;
  const payRub = !trialOnly ? planPayRubFromConfig(planMonths, pricing) : null;
  const priceLine = planCard
    ? `${planCard.price}${planCard.period}`
    : payRub != null
      ? formatRub(payRub)
      : "—";
  const savingsRub = !trialOnly && payRub != null ? planSavingsRubFromConfig(planMonths, pricing) : 0;

  const monthChoices = activePlanMonthValues(pricing);

  const body = (
    <>
      {trialOnly ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.profilePayTrialIntro}</p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{a.profilePayModalIntro}</p>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 sm:p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {a.profilePayPlanLabel}
                </dt>
                <dd className="text-lg font-extrabold text-dark sm:text-end">{planTitle}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {a.profilePayPriceLabel}
                </dt>
                <dd className="text-lg font-black text-primary sm:text-end">{priceLine}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <dt className="shrink-0 font-bold uppercase tracking-wide text-slate-500">
                  {a.profilePayDiscountLabel}
                </dt>
                <dd className="text-lg font-extrabold text-dark sm:text-end">
                  {savingsRub > 0 ? formatRub(savingsRub) : a.profilePayNoDiscount}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {lockedPlanMonths == null ? (
              <label className="flex flex-col gap-1 text-sm font-bold text-dark">
                {a.plansPayMonthsLabel}
                <select
                  value={planMonths}
                  onChange={(e) => setPlanMonths(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono"
                >
                  {monthChoices.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="flex flex-col gap-1 text-sm font-bold text-dark">
              {a.plansPayReferralCodeLabel}
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm"
              />
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() => void pay()}
              className="rounded-xl bg-dark py-3 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "…" : a.plansPayOnSite}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-center text-sm font-bold text-slate-400">
              {a.profilePayMethodSbp}
              <span className="mt-1 block text-xs font-semibold normal-case text-slate-400">{a.profilePaySoon}</span>
            </div>
            <div className="rounded-xl border-2 border-slate-100 bg-slate-50 py-3 text-center text-sm font-bold text-slate-400">
              {a.profilePayMethodCrypto}
              <span className="mt-1 block text-xs font-semibold normal-case text-slate-400">{a.profilePaySoon}</span>
            </div>
          </div>
        </>
      )}

      {msg ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {msg}
        </p>
      ) : null}

      <button
        type="button"
        onClick={close}
        className="mt-6 w-full py-2 text-sm font-bold text-slate-500 hover:text-dark"
      >
        {a.profilePayClose}
      </button>
    </>
  );

  const portalZ = "z-[12000]";

  return createPortal(
    <div
      className={`fixed inset-0 ${portalZ} flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={a.profilePayClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />
      <div className="relative z-10 max-h-[min(90vh,720px)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-dark md:text-2xl">
          {a.profilePayModalTitle}
        </h2>
        {trialOnly && planHeading ? (
          <p className="mt-1 text-sm font-semibold text-slate-600">{planHeading}</p>
        ) : null}
        {body}
      </div>
    </div>,
    document.body,
  );
}
