import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTicketStatusForm } from "@/components/admin/AdminTicketStatusForm";
import { TicketMessageThread } from "@/components/support/TicketMessageThread";
import { TicketRefreshButton } from "@/components/support/TicketRefreshButton";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { adminGetTicket } from "@/lib/admin/tickets-admin";
import { pathPrefix } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import { listMessagesForTicket } from "@/lib/support/ticket-messages";
import { ticketStatusLabel } from "@/lib/support/ticket-status-label";

type Props = { params: Promise<{ id: string }> };

export default async function EnAdminTicketDetailPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const ticket = await adminGetTicket(id);
  if (!ticket) notFound();

  const replies = await listMessagesForTicket(ticket.id);
  const messages = getMessages("en");
  const a = messages.adminPanel;
  const t = messages.supportTickets;
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";

  return (
    <div className="space-y-6">
      <Link href={`${base}/support`} className="text-sm font-bold text-primary hover:underline">
        ← {t.backToList}
      </Link>
      <h1 className="text-2xl font-black text-dark">
        {a.ticketDetailTitle} #{ticket.id}
      </h1>
      <p className="text-sm text-slate-600">
        User ID: <span className="font-mono font-bold">{ticket.user_id}</span> ·{" "}
        {ticket.user_email ?? ticket.user_name ?? "—"}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          <span className="font-bold">{t.statusLabel}:</span>{" "}
          {ticketStatusLabel(messages, ticket.status)}
        </p>
        <TicketRefreshButton messages={messages} />
      </div>
      <AdminTicketStatusForm
        key={`${ticket.id}-${ticket.status}`}
        ticketId={ticket.id}
        current={ticket.status}
        messages={messages}
      />
      <div>
        <h2 className="mb-2 text-lg font-bold text-dark">{t.subject}</h2>
        <p className="text-dark">{ticket.subject}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TicketMessageThread
          ticket={ticket}
          replies={replies}
          siteMessages={messages}
          perspective="admin"
        />
        <div className="mt-8 border-t border-slate-100 pt-8">
          <TicketReplyForm ticketId={ticket.id} variant="admin" messages={messages} />
        </div>
      </div>
    </div>
  );
}
