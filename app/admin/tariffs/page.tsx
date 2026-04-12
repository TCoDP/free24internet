import { AdminPricingEditor } from "@/components/admin/AdminPricingEditor";
import { adminGetPricingGlobalRow, adminListPricingTerms } from "@/lib/admin/pricing-admin";
import { getMessages } from "@/lib/messages";
import { formatRub, planPayRubFromConfig } from "@/lib/pricing/pricing-config";
import { getPricingConfig } from "@/lib/pricing/load-pricing";

export default async function AdminTariffsPage() {
  const messages = getMessages("ru");
  const a = messages.adminPanel;

  let globalRow = { base_monthly_rub: 60, trial_days: 7 };
  let terms: Awaited<ReturnType<typeof adminListPricingTerms>> = [];
  try {
    globalRow = await adminGetPricingGlobalRow();
    terms = await adminListPricingTerms();
  } catch {
    /* таблицы ещё не мигрированы */
  }

  const cfg = await getPricingConfig();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.tariffsTitle}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{a.tariffsIntro}</p>

      <AdminPricingEditor
        key={terms.map((t) => t.id).join("-")}
        messages={messages}
        initialGlobal={globalRow}
        initialTerms={terms}
      />

      <section className="space-y-3">
        <h2 className="text-base font-black text-dark">{a.tariffsTablePlan}</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">{a.tariffsTablePlan}</th>
                <th className="px-4 py-3">{a.tariffsTablePrice}</th>
              </tr>
            </thead>
            <tbody>
              {cfg.terms
                .filter((t) => t.isActive)
                .sort((x, y) => x.sortOrder - y.sortOrder || x.months - y.months)
                .map((t) => {
                  const pay = planPayRubFromConfig(t.months, cfg);
                  return (
                    <tr key={t.months} className="border-b border-slate-100">
                      <td className="px-4 py-3 font-bold">{t.months}</td>
                      <td className="px-4 py-3 font-mono">{pay != null ? formatRub(pay) : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
