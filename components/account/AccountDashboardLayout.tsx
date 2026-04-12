import { redirect } from "next/navigation";
import type { SiteMessages } from "@/lib/messages/types";
import { SiteShell } from "@/components/SiteShell";
import { LogoutButton } from "@/components/LogoutButton";
import { AccountBreadcrumbs } from "@/components/account/AccountBreadcrumbs";
import { AccountTabNav } from "@/components/account/AccountTabNav";
import { getAccountContext } from "@/lib/account/get-account-context";

export async function AccountDashboardLayout({
  messages,
  logoutLocale,
  children,
}: {
  messages: SiteMessages;
  logoutLocale: "ru" | "en";
  children: React.ReactNode;
}) {
  const ctx = await getAccountContext();
  if (!ctx) {
    redirect(logoutLocale === "en" ? "/en/login" : "/login");
  }

  const { session, row } = ctx;
  const emailDisplay = row.email?.trim() ?? "";
  const tgDisplay = row.tg_username?.trim() ? `@${row.tg_username!.trim()}` : null;
  const displayLine =
    row.name?.trim() || emailDisplay || tgDisplay || `ID ${session.user?.id ?? ""}`;

  return (
    <SiteShell messages={messages}>
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-light px-4 pb-24 pt-28 sm:px-6 md:pt-36 lg:px-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(185,28,28,0.08),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-6xl">
          <AccountBreadcrumbs messages={messages} />
          <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/90">
                {messages.auth.accountSettingsTitle}
              </p>
              <h1 className="text-3xl font-black tracking-tight text-dark sm:text-4xl">
                {messages.auth.accountTitle}
              </h1>
              <p className="max-w-xl text-base text-slate-600">
                {messages.auth.accountWelcome}{" "}
                <span className="font-bold text-dark">{displayLine}</span>
              </p>
            </div>
            <LogoutButton label={messages.auth.logout} locale={logoutLocale} />
          </header>

          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] backdrop-blur-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/50 px-4 py-5 sm:px-8">
              <AccountTabNav messages={messages} />
            </div>

            <div className="animate-fade-in px-4 py-8 sm:px-8 md:py-10">{children}</div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
