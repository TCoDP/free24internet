import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupportTicket } from "@/lib/support/tickets";
import { normalizeTicketBody, normalizeTicketSubject } from "@/lib/support/validate-ticket";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const subject = normalizeTicketSubject(body.subject);
    const text = normalizeTicketBody(body.body);
    if (!subject || !text) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const id = await createSupportTicket(userId, subject, text);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[account/tickets]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
