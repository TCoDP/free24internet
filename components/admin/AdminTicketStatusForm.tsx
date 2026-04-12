"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TicketStatus } from "@/lib/support/types";
import type { SiteMessages } from "@/lib/messages/types";

export function AdminTicketStatusForm({
  ticketId,
  current,
  messages,
}: {
  ticketId: number;
  current: TicketStatus;
  messages: SiteMessages;
}) {
  const a = messages.adminPanel;
  const t = messages.supportTickets;
  const router = useRouter();
  const [status, setStatus] = useState<TicketStatus>(current);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setErr(a.errors.saveFailed);
        return;
      }
      router.refresh();
    } catch {
      setErr(a.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-sm font-bold text-dark" htmlFor="adm-ticket-st">
          {a.ticketChangeStatus}
        </label>
        <select
          id="adm-ticket-st"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold"
        >
          <option value="open">{t.statusOpen}</option>
          <option value="in_progress">{t.statusInProgress}</option>
          <option value="closed">{t.statusClosed}</option>
        </select>
      </div>
      <button
        type="button"
        disabled={loading || status === current}
        onClick={() => void submit()}
        className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "…" : a.userSave}
      </button>
      {err ? <p className="w-full text-sm font-semibold text-red-700">{err}</p> : null}
    </div>
  );
}
