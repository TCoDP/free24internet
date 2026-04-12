"use client";

import { useId, useState } from "react";
import { AccountTransactionTable } from "@/components/account/AccountTransactionTable";
import { PricingPlanGrid } from "@/components/PricingPlanGrid";
import type { SiteMessages } from "@/lib/messages/types";
import type { PricingConfig } from "@/lib/pricing/pricing-config";
import type { UserTransactionRowInput } from "@/lib/payments/transactions";

type PlansTab = "tariffs" | "history";

export function AccountPlansTabs({
  messages,
  transactions,
  pricing,
  canPayOnSite = true,
}: {
  messages: SiteMessages;
  transactions: UserTransactionRowInput[];
  pricing: PricingConfig;
  /** Оплата на сайте (Moneta) только при users.is_their = 1 */
  canPayOnSite?: boolean;
}) {
  const a = messages.auth;
  const baseId = useId();
  const tabTariffsId = `${baseId}-tab-tariffs`;
  const tabHistoryId = `${baseId}-tab-history`;
  const panelTariffsId = `${baseId}-panel-tariffs`;
  const panelHistoryId = `${baseId}-panel-history`;

  const [tab, setTab] = useState<PlansTab>("tariffs");

  const tabClass = (active: boolean) =>
    `rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:px-5 sm:text-base ${
      active
        ? "bg-primary text-white shadow-md shadow-primary/25"
        : "bg-white/80 text-slate-600 ring-1 ring-slate-200/80 hover:bg-white hover:text-dark hover:ring-slate-300"
    }`;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">{a.accountSectionPlans}</h2>
      </header>

      <div className="border-b border-slate-200 pb-3">
        <nav className="flex flex-wrap gap-2 sm:gap-3" role="tablist" aria-label={a.accountSectionPlans}>
          <button
            type="button"
            role="tab"
            id={tabTariffsId}
            aria-selected={tab === "tariffs"}
            aria-controls={panelTariffsId}
            tabIndex={tab === "tariffs" ? 0 : -1}
            className={tabClass(tab === "tariffs")}
            onClick={() => setTab("tariffs")}
          >
            {a.accountTabPlans}
          </button>
          <button
            type="button"
            role="tab"
            id={tabHistoryId}
            aria-selected={tab === "history"}
            aria-controls={panelHistoryId}
            tabIndex={tab === "history" ? 0 : -1}
            className={tabClass(tab === "history")}
            onClick={() => setTab("history")}
          >
            {a.transactionsTitle}
          </button>
        </nav>
      </div>

      <div
        id={panelTariffsId}
        role="tabpanel"
        aria-labelledby={tabTariffsId}
        hidden={tab !== "tariffs"}
        className={tab === "tariffs" ? "space-y-8" : undefined}
      >
        <section className="text-center">
          <PricingPlanGrid
            pricingSection={messages.pricingSection}
            mode="account"
            messages={messages}
            pricing={pricing}
            canPayOnSite={canPayOnSite}
          />
        </section>
      </div>

      <div
        id={panelHistoryId}
        role="tabpanel"
        aria-labelledby={tabHistoryId}
        hidden={tab !== "history"}
        className={tab === "history" ? "space-y-4" : undefined}
      >
        <AccountTransactionTable messages={messages} rows={transactions} />
      </div>
    </div>
  );
}
