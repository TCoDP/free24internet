import type { SupportTicketRow } from "@/lib/support/types";
import type { SupportTicketMessageRow } from "@/lib/support/ticket-messages";
import { formatTicketDateTime } from "@/lib/support/format-ticket-date";
import type { SiteMessages } from "@/lib/messages/types";

function bubbleLabel(
  role: "user" | "admin",
  perspective: "account" | "admin",
  messages: SiteMessages["supportTickets"],
): string {
  if (role === "user") return perspective === "account" ? messages.labelYou : messages.labelUser;
  return messages.labelSupport;
}

export function TicketMessageThread({
  ticket,
  replies,
  siteMessages,
  perspective,
}: {
  ticket: SupportTicketRow;
  replies: SupportTicketMessageRow[];
  siteMessages: SiteMessages;
  perspective: "account" | "admin";
}) {
  const t = siteMessages.supportTickets;
  const locale = siteMessages.locale;

  const items: { key: string; role: "user" | "admin"; body: string; at: Date }[] = [
    {
      key: "initial",
      role: "user",
      body: ticket.body,
      at: ticket.created_at,
    },
    ...replies.map((m) => ({
      key: `m-${m.id}`,
      role: m.author_role,
      body: m.body,
      at: m.created_at,
    })),
  ];

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.threadTitle}</h3>
      <ul className="space-y-4">
        {items.map((item) => {
          const fromUser = item.role === "user";
          return (
            <li
              key={item.key}
              className={`flex ${fromUser ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[min(100%,42rem)] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                  fromUser
                    ? "border-slate-200/80 bg-slate-50 text-dark"
                    : "border-primary/25 bg-primary/5 text-dark"
                }`}
              >
                <p className="text-xs font-bold text-slate-500">
                  {bubbleLabel(item.role, perspective, t)} · {formatTicketDateTime(item.at, locale)}
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans leading-relaxed">{item.body}</pre>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
