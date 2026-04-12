import type { SiteMessages } from "@/lib/messages/types";
import { PublicPageBreadcrumbs } from "@/components/PublicPageBreadcrumbs";

export function AuthCard({
  messages,
  title,
  children,
}: {
  messages: SiteMessages;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-light px-4 pb-20 pt-28 md:pt-36">
      <div className="mx-auto w-full max-w-md">
        <PublicPageBreadcrumbs messages={messages} />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl md:p-10">
          <h1 className="mb-8 text-center text-3xl font-black tracking-tight text-dark">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
