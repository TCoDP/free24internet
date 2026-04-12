import type { SiteMessages } from "@/lib/messages/types";
import type { TicketStatus } from "./types";

export function ticketStatusLabel(messages: SiteMessages, status: TicketStatus): string {
  const { supportTickets: t } = messages;
  switch (status) {
    case "open":
      return t.statusOpen;
    case "in_progress":
      return t.statusInProgress;
    case "closed":
      return t.statusClosed;
    default:
      return status;
  }
}

export function ticketStatusStyles(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "in_progress":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}
