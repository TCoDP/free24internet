"use client";

import type { SiteMessages } from "@/lib/messages/types";
import type { PricingConfig } from "@/lib/pricing/pricing-config";
import { useState } from "react";
import { AccountPurchaseModal } from "./AccountPurchaseModal";

export function AccountProfileBuyButton({
  messages,
  pricing,
}: {
  messages: SiteMessages;
  pricing: PricingConfig;
}) {
  const a = messages.auth;
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-primary-hover"
      >
        {a.profileBuyCta}
      </button>
      <AccountPurchaseModal
        messages={messages}
        pricing={pricing}
        open={open}
        onClose={() => setOpen(false)}
        lockedPlanMonths={null}
        trialOnly={false}
      />
    </>
  );
}
