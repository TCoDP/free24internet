import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/lib/auth/users";
import { normalizeEmail, normalizeName, normalizePassword } from "@/lib/auth/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const name = normalizeName(body.name);

    if (!email || !password) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const userId = await createUser(email, passwordHash, name);

    return NextResponse.json({ ok: true, user: { id: userId, email, name } });
  } catch (e) {
    console.error("[auth/register]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
