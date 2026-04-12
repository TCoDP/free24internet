import type { SiteMessages } from "@/lib/messages/types";

export function AccountProfileInfoCards({
  messages,
  emailDisplay,
  tgDisplay,
  userId,
  memberSinceFormatted,
}: {
  messages: SiteMessages;
  emailDisplay: string;
  tgDisplay: string | null;
  userId: string;
  memberSinceFormatted: string;
}) {
  const { auth } = messages;

  const items: { label: string; value: string; mono?: boolean }[] = [];
  if (emailDisplay) items.push({ label: auth.accountDisplayEmail, value: emailDisplay, mono: true });
  if (tgDisplay) items.push({ label: auth.accountTelegram, value: tgDisplay });
  items.push({ label: auth.accountId, value: userId, mono: true });
  items.push({ label: auth.memberSince, value: memberSinceFormatted });

  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50/90 p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-primary/[0.06] transition-colors group-hover:bg-primary/10" />
          <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.label}</dt>
          <dd
            className={`mt-2 text-lg font-bold leading-snug text-dark ${item.mono ? "break-all font-mono text-base" : ""}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
