import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccountContext } from "@/lib/account/get-account-context";
import { accountSectionPath } from "@/lib/account/paths";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";
import { TicketMessageThread } from "@/components/support/TicketMessageThread";
import { TicketRefreshButton } from "@/components/support/TicketRefreshButton";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { formatTicketDateTime } from "@/lib/support/format-ticket-date";
import { listMessagesForTicket } from "@/lib/support/ticket-messages";
import { ticketStatusLabel, ticketStatusStyles } from "@/lib/support/ticket-status-label";
import { getTicketForUser } from "@/lib/support/tickets";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: raw } = await params;
  const id = Number(raw);
  const messages = getMessages("ru");
  const t = messages.supportTickets;
  if (!Number.isFinite(id) || id <= 0) {
    return { title: t.pageTitle };
  }
  return {
    title: `${t.ticketPrefix} #${id} — ${t.pageTitle}`,
    alternates: { canonical: `${SITE_ORIGIN}/account/tickets/${id}` },
  };
}

export default async function AccountTicketDetailPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const messages = getMessages("ru");
  const ctx = await getAccountContext();
  if (!ctx) return null;

  const ticket = await getTicketForUser(id, ctx.row.id);
  if (!ticket) notFound();

  const replies = await listMessagesForTicket(ticket.id);
  const t = messages.supportTickets;
  const base = accountSectionPath(messages.locale, "tickets");

  return (
    <div className="space-y-8">
      <header>
        <Link href={base} className="text-sm font-bold text-primary hover:underline">
          ← {t.backToList}
        </Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-slate-500">
              {t.ticketPrefix} #{ticket.id}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-dark sm:text-2xl">{ticket.subject}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t.createdAt}: {formatTicketDateTime(ticket.created_at, messages.locale)}
              {ticket.updated_at ? (
                <>
                  {" · "}
                  {t.updatedAt}: {formatTicketDateTime(ticket.updated_at, messages.locale)}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <TicketRefreshButton messages={messages} />
            <span
              className={`inline-flex w-fit rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-inset ${ticketStatusStyles(ticket.status)}`}
            >
              {t.statusLabel}: {ticketStatusLabel(messages, ticket.status)}
            </span>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <TicketMessageThread ticket={ticket} replies={replies} siteMessages={messages} perspective="account" />
        <div className="mt-8 border-t border-slate-100 pt-8">
          <TicketReplyForm ticketId={ticket.id} variant="account" messages={messages} />
        </div>
      </section>

      <p className="text-sm text-slate-500">{t.successHint}</p>
    </div>
  );
}
