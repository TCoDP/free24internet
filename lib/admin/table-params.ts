export type SortDir = "asc" | "desc";

const ALLOWED_LIMITS = [10, 20, 25, 40, 50, 100] as const;

export function parseAdminPage(raw: string | undefined): number {
  const n = Number(raw);
  return Math.max(1, Number.isFinite(n) ? Math.floor(n) : 1);
}

export function parseAdminLimit(raw: string | undefined, fallback = 25, max = 100): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const x = Math.round(n);
  if ((ALLOWED_LIMITS as readonly number[]).includes(x)) return x;
  return Math.min(max, Math.max(10, x));
}

export function parseSortDir(raw: string | undefined): SortDir {
  return raw === "asc" ? "asc" : "desc";
}

export function adminQs(
  basePath: string,
  params: Record<string, string | number | undefined | null>,
): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function nextSortParams(
  currentSort: string,
  currentDir: SortDir,
  clickedCol: string,
): { sort: string; dir: SortDir } {
  if (currentSort !== clickedCol) return { sort: clickedCol, dir: "desc" };
  return { sort: clickedCol, dir: currentDir === "asc" ? "desc" : "asc" };
}
