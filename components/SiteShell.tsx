import type { ReactNode } from "react";
import { auth } from "@/auth";
import type { SiteMessages } from "@/lib/messages/types";
import { ConnectModalProvider } from "./ConnectModalContext";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export async function SiteShell({
  messages,
  children,
}: {
  messages: SiteMessages;
  children: ReactNode;
}) {
  const session = await auth();
  const user =
    session?.user?.id && session.user.email
      ? {
          id: Number(session.user.id),
          email: session.user.email,
          name: session.user.name ?? null,
        }
      : null;
  return (
    <ConnectModalProvider labels={messages.modal}>
      <SiteHeader messages={messages} user={user} />
      {children}
      <SiteFooter messages={messages} />
    </ConnectModalProvider>
  );
}
