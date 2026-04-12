"use client";

import type { SiteMessages } from "@/lib/messages/types";
import type { UserTransactionRowInput } from "@/lib/payments/transactions";

function providerLabel(messages: SiteMessages["auth"], code: string): string {
  const a = messages;
  if (code === "telegram_bot") return a.transactionProviderTelegramBot;
  if (code === "moneta") return a.transactionProviderMoneta;
  if (code === "test_redeem") return a.transactionProviderTestRedeem;
  return code || a.transactionProviderUnknown;
}

function statusLabel(messages: SiteMessages["auth"], status: string): string {
  const a = messages;
  if (status === "completed") return a.transactionStatusCompleted;
  if (status === "pending") return a.transactionStatusPending;
  return status;
}

export function AccountTransactionTable({
  messages,
  rows,
}: {
  messages: SiteMessages;
  rows: UserTransactionRowInput[];
}) {
  const a = messages.auth;
  const locale = messages.locale;
  const dtf = locale === "en" ? "en-GB" : "ru-RU";

  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-slate-200/80 bg-slate-50 px-6 py-8 text-center text-sm text-slate-600">
        {a.transactionsEmpty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-black uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">{a.transactionsColDate}</th>
            <th className="px-4 py-3">{a.transactionsColAmount}</th>
            <th className="px-4 py-3">{a.transactionsColPlan}</th>
            <th className="px-4 py-3">{a.transactionsColStatus}</th>
            <th className="px-4 py-3">{a.transactionsColChannel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="font-medium text-dark">
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {new Date(row.created_at).toLocaleString(dtf, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-4 py-3 font-mono">
                {Number(row.amount_rub).toLocaleString(dtf)}{" "}
                <span className="text-slate-500">₽</span>
              </td>
              <td className="px-4 py-3">
                {row.plan_months} {a.transactionsMonthsSuffix}
              </td>
              <td className="px-4 py-3">{statusLabel(a, row.status)}</td>
              <td className="px-4 py-3">
                <span className="block">{providerLabel(a, row.provider)}</span>
                {row.external_payment_id ? (
                  <span className="mt-0.5 block max-w-[200px] truncate font-mono text-[11px] text-slate-400">
                    {row.external_payment_id}
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
