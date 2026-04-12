"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";

export function TicketReplyForm({
  ticketId,
  variant,
  messages: siteMessages,
}: {
  ticketId: number;
  variant: "account" | "admin";
  messages: SiteMessages;
}) {
  const t = siteMessages.supportTickets;
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const url =
    variant === "account"
      ? `/api/account/tickets/${ticketId}/messages`
      : `/api/admin/tickets/${ticketId}/messages`;

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error === "validation" ? t.errors.replyValidation : t.errors.replyServer);
        return;
      }
      setText("");
      router.refresh();
    } catch {
      setErr(t.errors.network);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor={`reply-${variant}-${ticketId}`}>
        {t.message}
      </label>
      <textarea
        id={`reply-${variant}-${ticketId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={t.replyPlaceholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-dark placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        disabled={loading || !text.trim()}
        onClick={() => void submit()}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? t.replySubmitting : t.replySubmit}
      </button>
      {err ? <p className="text-sm font-semibold text-red-700">{err}</p> : null}
    </div>
  );
}
