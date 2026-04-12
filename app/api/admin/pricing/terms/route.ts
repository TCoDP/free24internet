import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { adminUpsertPricingTerm } from "@/lib/admin/pricing-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

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
    console.error("[api/admin/pricing/terms POST]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
