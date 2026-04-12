import Link from "next/link";
import type { SiteMessages } from "@/lib/messages/types";
import { pathPrefix } from "@/lib/locale";

const NAV_CONFIG = [
  { path: "", key: "navDashboard" },
  { path: "users", key: "navUsers" },
  { path: "tariffs", key: "navTariffs" },
  { path: "referrals", key: "navReferrals" },
  { path: "support", key: "navSupport" },
  { path: "payments", key: "navPayments" },
  { path: "moneta", key: "navMoneta" },
] as const satisfies readonly { path: string; key: keyof SiteMessages["adminPanel"] }[];

export function AdminShell({
  messages,
  children,
}: {
  messages: SiteMessages;
  children: React.ReactNode;
}) {
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";
  const a = messages.adminPanel;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 pb-20 pt-24 md:pt-28">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 lg:flex-row lg:px-8">
        <aside className="shrink-0 lg:w-56">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{a.title}</p>
            <nav className="flex flex-col gap-1">
              {NAV_CONFIG.map(({ path, key }) => (
                <Link
                  key={path || "dash"}
                  href={path ? `${base}/${path}` : base}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-dark"
                >
                  {a[key]}
                </Link>
              ))}
            </nav>
            <Link
              href={p || "/"}
              className="mt-4 block text-sm font-bold text-primary underline-offset-2 hover:underline"
            >
              {a.backToSite}
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
