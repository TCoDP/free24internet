"use client";

import { AccountPurchaseModal } from "@/components/account/AccountPurchaseModal";
import type { PricingCard, SiteMessages } from "@/lib/messages/types";
import type { PricingConfig } from "@/lib/pricing/pricing-config";
import { TELEGRAM_BOT_URL } from "@/lib/constants";
import { sortPricingCardsForDisplay } from "@/lib/pricing/sort-pricing-cards";
import { BotOrAccountTrigger } from "@/components/bot-or-account/BotOrAccountProvider";
import { useCallback, useMemo, useState, type ReactNode } from "react";

function DirectBotLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

const ctaTableClass =
  "inline-flex w-full min-w-[9rem] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-extrabold transition-all sm:text-base";

function colCellClass(card: PricingCard) {
  return card.highlight
    ? "border-l border-r border-primary/15 bg-primary/[0.07] align-top"
    : "align-top";
}

function PricingPlanTable({
  sortedCards,
  renderAction,
}: {
  sortedCards: PricingCard[];
  renderAction: (card: PricingCard) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {sortedCards.map((card) => (
              <th
                key={card.title}
                scope="col"
                className={`min-w-42 px-3 py-4 text-center text-base font-extrabold text-dark ${colCellClass(card)}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span>{card.title}</span>
                  {card.badge ? (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-extrabold text-white">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            {sortedCards.map((card) => (
              <td
                key={card.title}
                className={`px-3 py-4 text-center ${colCellClass(card)} ${card.highlight ? "" : "bg-white"}`}
              >
                <span className="text-xl font-black text-dark">{card.price}</span>
                <span className="text-slate-500">{card.period}</span>
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            {sortedCards.map((card) => (
              <td
                key={card.title}
                className={`px-3 py-4 text-center text-slate-600 ${colCellClass(card)} ${card.highlight ? "" : "bg-white"}`}
              >
                {card.blurb}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            {sortedCards.map((card) => (
              <td
                key={card.title}
                className={`px-3 py-4 ${colCellClass(card)} ${card.highlight ? "" : "bg-white"}`}
              >
                <ul className="mx-auto max-w-[16rem] space-y-1.5 font-semibold text-dark">
                  {card.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="shrink-0 font-bold text-primary">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            {sortedCards.map((card) => (
              <td
                key={card.title}
                className={`px-3 py-4 ${colCellClass(card)} ${card.highlight ? "" : "bg-white"}`}
              >
                <div className="flex justify-center">{renderAction(card)}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PricingPlanGrid({
  pricingSection,
  mode,
  messages,
  pricing,
  canPayOnSite = true,
}: {
  pricingSection: SiteMessages["pricingSection"];
  mode: "modal" | "direct" | "account";
  messages?: SiteMessages;
  /** Конфиг цен из БД: сортировка карточек; в режиме account — ещё и модалка оплаты */
  pricing: PricingConfig;
  /** Только режим account: кнопка «Купить» для платных тарифов */
  canPayOnSite?: boolean;
}) {
  const sortedCards = useMemo(
    () => sortPricingCardsForDisplay(pricingSection.cards, pricing),
    [pricingSection.cards, pricing],
  );

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [lockedPlanMonths, setLockedPlanMonths] = useState<number | null>(null);
  const [trialOnly, setTrialOnly] = useState(false);
  const [planHeading, setPlanHeading] = useState<string | undefined>(undefined);

  const openPurchase = useCallback((card: (typeof sortedCards)[number]) => {
    if (card.planMonths != null) {
      setLockedPlanMonths(card.planMonths);
      setTrialOnly(false);
    } else {
      setLockedPlanMonths(null);
      setTrialOnly(true);
    }
    setPlanHeading(card.title);
    setPurchaseOpen(true);
  }, []);

  const closePurchase = useCallback(() => setPurchaseOpen(false), []);

  if (mode === "account") {
    if (!messages) {
      throw new Error("PricingPlanGrid: mode account requires `messages`");
    }
    const buyLabel = messages.auth.profileBuyCta;
    const a = messages.auth;

    return (
      <>
        <PricingPlanTable
          sortedCards={sortedCards}
          renderAction={(card) => {
            const paid = card.planMonths != null;
            const blocked = paid && !canPayOnSite;
            return (
              <button
                type="button"
                disabled={blocked}
                title={blocked ? a.plansPaymentNotEligible : undefined}
                onClick={() => {
                  if (blocked) return;
                  openPurchase(card);
                }}
                className={`${ctaTableClass} ${
                  blocked
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : card.highlight
                      ? "bg-dark text-white hover:bg-slate-800"
                      : "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary-hover"
                }`}
              >
                {paid ? buyLabel : card.cta}
              </button>
            );
          }}
        />
        <AccountPurchaseModal
          messages={messages}
          pricing={pricing}
          open={purchaseOpen}
          onClose={closePurchase}
          lockedPlanMonths={lockedPlanMonths}
          trialOnly={trialOnly}
          planHeading={planHeading}
        />
      </>
    );
  }

  const Cta = mode === "modal" ? BotOrAccountTrigger : DirectBotLink;

  return (
    <PricingPlanTable
      sortedCards={sortedCards}
      renderAction={(card) => (
        <Cta
          className={`${ctaTableClass} ${
            card.highlight
              ? "bg-dark text-white hover:bg-slate-800"
              : "animate-pulse-custom bg-primary text-white hover:bg-primary-hover"
          }`}
        >
          {card.cta}
        </Cta>
      )}
    />
  );
}
