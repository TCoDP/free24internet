import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { adminDeletePricingTerm, adminUpsertPricingTerm } from "@/lib/admin/pricing-admin";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let body: {
    months?: number;
    discountRate?: number;
    referrerBonusDays?: number;
    sortOrder?: number;
    isActive?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const months = Number(body.months);
  const discountRate = Number(body.discountRate);
  const referrerBonusDays = Number(body.referrerBonusDays);
  const sortOrder = Number(body.sortOrder);
  const isActive = Boolean(body.isActive);
  if (!Number.isFinite(months) || !Number.isFinite(discountRate) || !Number.isFinite(referrerBonusDays)) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    const result = await adminUpsertPricingTerm({
      id,
      months,
      discountRate,
      referrerBonusDays,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive,
    });
    if (result === "months_taken") {
      return NextResponse.json({ ok: false, error: "months_taken" }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/pricing/terms PATCH]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  const { id: raw } = await ctx.params;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    const ok = await adminDeletePricingTerm(id);
    if (!ok) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/pricing/terms DELETE]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
