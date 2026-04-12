import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth/admin-api";
import { adminUpdatePricingGlobal } from "@/lib/admin/pricing-admin";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const gate = await assertAdminApi();
  if (gate instanceof NextResponse) return gate;

  let body: { baseMonthlyRub?: number; trialDays?: number };
  try {
    body = (await req.json()) as { baseMonthlyRub?: number; trialDays?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const baseMonthlyRub = Number(body.baseMonthlyRub);
  const trialDays = Number(body.trialDays);
  if (!Number.isFinite(baseMonthlyRub) || !Number.isFinite(trialDays)) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  try {
    await adminUpdatePricingGlobal({ baseMonthlyRub, trialDays });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/admin/pricing/global]", e);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
