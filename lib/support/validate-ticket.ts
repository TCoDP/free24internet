export function normalizeTicketSubject(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.length < 3 || s.length > 255) return null;
  return s;
}

export function normalizeTicketBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.length < 10 || s.length > 60000) return null;
  return s;
}

/** Ответ в существующей заявке — короче, чем первое обращение. */
export function normalizeTicketReply(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (s.length < 1 || s.length > 60000) return null;
  return s;
}
