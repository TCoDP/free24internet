import { NextResponse } from "next/server";
import { adminGetTicket } from "@/lib/admin/tickets-admin";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { addTicketMessage } from "@/lib/support/ticket-messages";
import { normalizeTicketReply } from "@/lib/support/validate-ticket";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  try {
    const { id: raw } = await ctx.params;
    const ticketId = Number(raw);
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }

    const ticket = await adminGetTicket(ticketId);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }

    const text = normalizeTicketReply(body.body);
    if (!text) {
      return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
    }

    const messageId = await addTicketMessage(ticketId, "admin", gate.userId, text);
    return NextResponse.json({ ok: true, id: messageId });
  } catch (e) {
    console.error("[admin/tickets/[id]/messages]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
