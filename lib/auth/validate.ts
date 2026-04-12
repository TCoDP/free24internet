export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (s.length < 3 || s.length > 255) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null;
  return s;
}

export function normalizePassword(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length < 8 || raw.length > 128) return null;
  return raw;
}

export function normalizeName(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.length > 100) return null;
  return s.length ? s : null;
}
