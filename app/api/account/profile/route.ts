import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeName } from "@/lib/auth/validate";
import { findUserById, updateUserProfile } from "@/lib/auth/users";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const id = Number(session?.user?.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const row = await findUserById(id);
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const patch: { name?: string | null; language?: "ru" | "en" } = {};

    if ("name" in body) {
      patch.name = normalizeName(body.name);
    }
    if (body.language === "ru" || body.language === "en") {
      patch.language = body.language;
    }

    if (!("name" in body) && patch.language === undefined) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    await updateUserProfile(id, patch);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account/profile]", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
