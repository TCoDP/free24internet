import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { adminUpdateUser, type AdminUserUpdateBody } from "@/lib/admin/users-admin";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  const { id: raw } = await ctx.params;
  const userId = Number(raw);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let body: AdminUserUpdateBody;
  try {
    body = (await req.json()) as AdminUserUpdateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    const result = await adminUpdateUser(userId, body);
    if (result === "referral_taken") {
      return NextResponse.json({ ok: false, error: "referral_taken" }, { status: 409 });
    }
    if (result === "cannot_demote_superadmin") {
      return NextResponse.json({ ok: false, error: "cannot_demote_superadmin" }, { status: 403 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/users]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
