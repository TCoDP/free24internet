"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { accountSectionPath } from "@/lib/account/paths";
import { accountInputClass } from "@/components/account/account-input-styles";

export function NewTicketForm({ messages }: { messages: SiteMessages }) {
  const router = useRouter();
  const t = messages.supportTickets;
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      const data = (await res.json()) as { error?: string; id?: number };
      if (!res.ok) {
        if (data.error === "validation") setError(t.errors.validation);
        else if (data.error === "unauthorized") setError(messages.auth.errors.unauthorized);
        else setError(t.errors.server);
        return;
      }
      if (typeof data.id === "number") {
        router.push(`${accountSectionPath(messages.locale, "tickets")}/${data.id}`);
        router.refresh();
        return;
      }
      setError(t.errors.server);
    } catch {
      setError(t.errors.network);
    } finally {
      setLoading(false);
    }
  }, [subject, body, router, messages.locale, messages.auth.errors.unauthorized, t]);

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <label htmlFor="ticket-subject" className="mb-2 block text-sm font-bold text-slate-700">
          {t.subject}
        </label>
        <input
          id="ticket-subject"
          name="subject"
          type="text"
          maxLength={255}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t.placeholderSubject}
          className={accountInputClass}
          required
          minLength={3}
        />
      </div>
      <div>
        <label htmlFor="ticket-body" className="mb-2 block text-sm font-bold text-slate-700">
          {t.message}
        </label>
        <textarea
          id="ticket-body"
          name="body"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.placeholderMessage}
          className={`${accountInputClass} min-h-[12rem] resize-y`}
          required
          minLength={10}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? t.submitting : t.submit}
        </button>
      </div>
    </form>
  );
}
