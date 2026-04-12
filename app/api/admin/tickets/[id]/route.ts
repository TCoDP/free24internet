import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { adminUpdateTicketStatus } from "@/lib/admin/tickets-admin";
import type { TicketStatus } from "@/lib/support/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: TicketStatus[] = ["open", "in_progress", "closed"];

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  const { id: raw } = await ctx.params;
  const ticketId = Number(raw);
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const status = body.status as TicketStatus;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const ok = await adminUpdateTicketStatus(ticketId, status);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
