import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SiteShell } from "@/components/SiteShell";
import { SITE_ORIGIN } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_ORIGIN}/en/admin` },
};

export default async function EnAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("en");
  const messages = getMessages("en");
  return (
    <SiteShell messages={messages}>
      <AdminShell messages={messages}>{children}</AdminShell>
    </SiteShell>
  );
}
