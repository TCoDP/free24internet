import Link from "next/link";
import type { Metadata } from "next";
import { getAccountContext } from "@/lib/account/get-account-context";
import { accountSectionPath } from "@/lib/account/paths";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { formatTicketDateTime } from "@/lib/support/format-ticket-date";
import { ticketStatusLabel, ticketStatusStyles } from "@/lib/support/ticket-status-label";
import { listTicketsForUser } from "@/lib/support/tickets";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("en");
  return {
    title: `${messages.supportTickets.pageTitle} — ${messages.auth.accountTitle}`,
    description: messages.supportTickets.metaDescription,
    alternates: { canonical: `${SITE_ORIGIN}/en/account/tickets` },
  };
}

export default async function EnAccountTicketsListPage() {
  const messages = getMessages("en");
  const ctx = await getAccountContext();
  if (!ctx) return null;
  const tickets = await listTicketsForUser(ctx.row.id);
  const t = messages.supportTickets;
  const base = accountSectionPath(messages.locale, "tickets");

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-dark sm:text-2xl">{t.pageTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.pageSubtitle}</p>
        </div>
        <Link
          href={`${base}/new`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover"
        >
          {t.newTicket}
        </Link>
      </header>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-16 text-center">
          <p className="mx-auto max-w-md text-slate-600">{t.listEmpty}</p>
          <Link
            href={`${base}/new`}
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-primary ring-2 ring-primary/30 transition-colors hover:bg-primary hover:text-white"
          >
            {t.newTicket}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tickets.map((row) => (
            <li key={row.id}>
              <Link
                href={`${base}/${row.id}`}
                className="group flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-slate-400">
                    #{row.id} · {formatTicketDateTime(row.created_at, messages.locale)}
                  </p>
                  <p className="mt-1 font-bold text-dark group-hover:text-primary">{row.subject}</p>
                </div>
                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${ticketStatusStyles(row.status)}`}
                >
                  {ticketStatusLabel(messages, row.status)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
