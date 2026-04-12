import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SiteShell } from "@/components/SiteShell";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getMessages } from "@/lib/messages";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("ru");
  const messages = getMessages("ru");
  return (
    <SiteShell messages={messages}>
      <AdminShell messages={messages}>{children}</AdminShell>
    </SiteShell>
  );
}
