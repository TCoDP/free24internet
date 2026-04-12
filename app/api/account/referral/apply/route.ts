import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { setReferredByIfEmpty } from "@/lib/auth/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = Number(session?.user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code : "";
    if (!code.trim()) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const result = await setReferredByIfEmpty(userId, code);
    if (result === "invalid") {
      return NextResponse.json({ error: "referral_invalid" }, { status: 400 });
    }
    if (result === "self") {
      return NextResponse.json({ error: "referral_self" }, { status: 400 });
    }
    if (result === "already") {
      return NextResponse.json({ error: "referral_already" }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/referral/apply]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
