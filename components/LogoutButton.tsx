"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { pathPrefix } from "@/lib/locale";
import type { Locale } from "@/lib/locale";

export function LogoutButton({
  label,
  locale,
  className = "",
  onAction,
}: {
  label: string;
  locale: Locale;
  className?: string;
  onAction?: () => void;
}) {
  const router = useRouter();
  const p = pathPrefix(locale);
  const home = p || "/";

  return (
    <button
      type="button"
      onClick={() => {
        onAction?.();
        void signOut({ redirect: false })
          .then(() => {
            router.push(home);
            router.refresh();
          })
          .catch(() => {
            router.push(home);
            router.refresh();
          });
      }}
      className={`rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}
