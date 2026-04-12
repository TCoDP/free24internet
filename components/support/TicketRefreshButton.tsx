"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { SiteMessages } from "@/lib/messages/types";

export function TicketRefreshButton({
  messages,
  className = "",
}: {
  messages: SiteMessages;
  className?: string;
}) {
  const t = messages.supportTickets;
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className={`rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-dark hover:bg-slate-50 disabled:opacity-60 ${className}`.trim()}
    >
      {pending ? t.refreshing : t.refreshButton}
    </button>
  );
}
