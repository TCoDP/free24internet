import Link from "next/link";
import { adminQs, nextSortParams, type SortDir } from "@/lib/admin/table-params";

export function AdminThSort({
  label,
  column,
  sort,
  dir,
  basePath,
  common,
  className = "px-3 py-3",
}: {
  label: string;
  column: string;
  sort: string;
  dir: SortDir;
  basePath: string;
  common: Record<string, string | number | undefined>;
  className?: string;
}) {
  const { sort: ns, dir: nd } = nextSortParams(sort, dir, column);
  const href = adminQs(basePath, { ...common, sort: ns, dir: nd });
  const active = sort === column;
  return (
    <th className={`${className} font-bold uppercase`}>
      <Link
        href={href}
        className={`inline-flex items-center gap-1 hover:text-primary ${active ? "text-primary" : ""}`}
      >
        {label}
        {active ? <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span> : null}
      </Link>
    </th>
  );
}
