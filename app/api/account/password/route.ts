import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizePassword } from "@/lib/auth/validate";
import { findUserById, updateUserPasswordHash } from "@/lib/auth/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const id = Number(session?.user?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const currentRaw = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPass = normalizePassword(body.newPassword);
    const confirm = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!newPass) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    if (confirm !== newPass) {
      return NextResponse.json({ error: "password_mismatch" }, { status: 400 });
    }

    const row = await findUserById(id);
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!row.password_hash) {
      await updateUserPasswordHash(id, hashPassword(newPass));
      return NextResponse.json({ ok: true });
    }

    if (currentRaw.length < 1) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }
    if (!verifyPassword(currentRaw, row.password_hash)) {
      return NextResponse.json({ error: "wrong_password" }, { status: 400 });
    }

    await updateUserPasswordHash(id, hashPassword(newPass));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/password]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
