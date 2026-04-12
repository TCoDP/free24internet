import { notFound } from "next/navigation";
import { AdminUserEditForm } from "@/components/admin/AdminUserEditForm";
import { findUserById } from "@/lib/auth/users";
import { getMessages } from "@/lib/messages";

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserEditPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) notFound();
  const user = await findUserById(id);
  if (!user) notFound();
  const messages = getMessages("ru");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{messages.adminPanel.userEditTitle}</h1>
      <AdminUserEditForm user={user} messages={messages} />
    </div>
  );
}
