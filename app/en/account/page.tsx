import Link from "next/link";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LogoutButton } from "@/components/LogoutButton";
import { auth } from "@/auth";
import { SITE_ORIGIN } from "@/lib/constants";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Account",
  description: "Your profile",
  alternates: { canonical: `${SITE_ORIGIN}/en/account` },
};

export default async function EnAccountPage() {
  const messages = getMessages("en");
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;

  return (
    <SiteShell messages={messages}>
      <div className="min-h-[calc(100vh-4rem)] bg-light px-4 pb-20 pt-32 md:pt-40">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl md:p-10">
            <h1 className="mb-2 text-3xl font-black text-dark">{messages.auth.accountTitle}</h1>
            <p className="mb-8 text-slate-600">
              {messages.auth.accountWelcome}{" "}
              <span className="font-bold text-dark">{user.name || user.email}</span>
            </p>
            <dl className="mb-8 space-y-4">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {messages.auth.accountEmail}
                </dt>
                <dd className="text-lg font-semibold text-dark">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {messages.auth.accountId}
                </dt>
                <dd className="text-lg font-semibold text-dark">{user.id}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-4">
              <LogoutButton label={messages.auth.logout} locale="en" />
              <Link
                href="/en"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
              >
                {messages.auth.backHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
