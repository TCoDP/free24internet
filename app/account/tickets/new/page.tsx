import Link from "next/link";
import type { Metadata } from "next";
import { NewTicketForm } from "@/components/support/NewTicketForm";
import { accountSectionPath } from "@/lib/account/paths";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export async function generateMetadata(): Promise<Metadata> {
  const messages = getMessages("ru");
  const t = messages.supportTickets;
  return {
    title: `${t.newTicket} — ${t.pageTitle}`,
    description: t.metaDescription,
    alternates: { canonical: `${SITE_ORIGIN}/account/tickets/new` },
  };
}

export default async function AccountTicketsNewPage() {
  const messages = getMessages("ru");
  const t = messages.supportTickets;
  const base = accountSectionPath(messages.locale, "tickets");

  return (
    <div className="space-y-8">
      <header>
        <Link
          href={base}
          className="text-sm font-bold text-primary hover:underline"
        >
          ← {t.backToList}
        </Link>
        <h2 className="mt-4 text-xl font-black tracking-tight text-dark sm:text-2xl">{t.newTicket}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.pageSubtitle}</p>
      </header>
      <NewTicketForm messages={messages} />
    </div>
  );
}
