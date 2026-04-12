import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addTicketMessage } from "@/lib/support/ticket-messages";
import { getTicketForUser } from "@/lib/support/tickets";
import { normalizeTicketReply } from "@/lib/support/validate-ticket";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id: raw } = await ctx.params;
    const ticketId = Number(raw);
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const ticket = await getTicketForUser(ticketId, userId);
    if (!ticket) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const text = normalizeTicketReply(body.body);
    if (!text) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const messageId = await addTicketMessage(ticketId, "user", userId, text);
    return NextResponse.json({ ok: true, id: messageId });
  } catch (e) {
    console.error("[account/tickets/[id]/messages]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
