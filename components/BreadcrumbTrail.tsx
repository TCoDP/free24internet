"use client";

import Link from "next/link";

export type BreadcrumbItem = { href?: string; label: string };

export function BreadcrumbTrail({
  ariaLabel,
  items,
  className = "mb-6",
}: {
  ariaLabel: string;
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav className={className} aria-label={ariaLabel}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex min-w-0 items-center gap-2">
              {i > 0 ? (
                <span className="select-none text-slate-300" aria-hidden>
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="truncate font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${last ? "font-bold text-slate-700" : ""}`}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
