"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { SiteMessages } from "@/lib/messages/types";
import { formatRub } from "@/lib/pricing/pricing-config";

type TermRow = {
  id: number;
  months: number;
  discount_rate: number;
  referrer_bonus_days: number;
  sort_order: number;
  is_active: number;
};

export function AdminPricingEditor({
  messages,
  initialGlobal,
  initialTerms,
}: {
  messages: SiteMessages;
  initialGlobal: { base_monthly_rub: number; trial_days: number };
  initialTerms: TermRow[];
}) {
  const a = messages.adminPanel;
  const router = useRouter();
  const [base, setBase] = useState(String(initialGlobal.base_monthly_rub));
  const [trial, setTrial] = useState(String(initialGlobal.trial_days));
  const [terms, setTerms] = useState<TermRow[]>(initialTerms);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [newMonths, setNewMonths] = useState("1");
  const [newDisc, setNewDisc] = useState("0");
  const [newRef, setNewRef] = useState("7");
  const [newSort, setNewSort] = useState("100");
  const [newActive, setNewActive] = useState(true);

  const saveGlobal = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing/global", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseMonthlyRub: Number(base),
          trialDays: Number(trial),
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setMsg(a.errors.saveFailed);
        return;
      }
      setMsg(a.tariffsSaved);
      router.refresh();
    } catch {
      setMsg(a.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }, [a.errors.saveFailed, a.tariffsSaved, base, router, trial]);

  const patchTerm = useCallback(
    async (row: TermRow) => {
      setMsg(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/pricing/terms/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            months: row.months,
            discountRate: row.discount_rate,
            referrerBonusDays: row.referrer_bonus_days,
            sortOrder: row.sort_order,
            isActive: Boolean(row.is_active),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (data.error === "months_taken") {
          setMsg(a.tariffsMonthsTaken);
          return;
        }
        if (!res.ok || !data.ok) {
          setMsg(a.errors.saveFailed);
          return;
        }
        setMsg(a.tariffsSaved);
        router.refresh();
      } catch {
        setMsg(a.errors.saveFailed);
      } finally {
        setLoading(false);
      }
    },
    [a.errors.saveFailed, a.tariffsMonthsTaken, a.tariffsSaved, router],
  );

  const removeTerm = useCallback(
    async (id: number) => {
      if (!window.confirm("OK?")) return;
      setMsg(null);
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/pricing/terms/${id}`, { method: "DELETE" });
        const data = (await res.json()) as { ok?: boolean };
        if (!res.ok || !data.ok) {
          setMsg(a.errors.saveFailed);
          return;
        }
        setMsg(a.tariffsSaved);
        setTerms((t) => t.filter((x) => x.id !== id));
        router.refresh();
      } catch {
        setMsg(a.errors.saveFailed);
      } finally {
        setLoading(false);
      }
    },
    [a.errors.saveFailed, a.tariffsSaved, router],
  );

  const addTerm = useCallback(async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          months: Number(newMonths),
          discountRate: Number(newDisc),
          referrerBonusDays: Number(newRef),
          sortOrder: Number(newSort),
          isActive: newActive,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.error === "months_taken") {
        setMsg(a.tariffsMonthsTaken);
        return;
      }
      if (!res.ok || !data.ok) {
        setMsg(a.errors.saveFailed);
        return;
      }
      setMsg(a.tariffsSaved);
      router.refresh();
    } catch {
      setMsg(a.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  }, [a.errors.saveFailed, a.tariffsMonthsTaken, a.tariffsSaved, newActive, newDisc, newMonths, newRef, newSort, router]);

  const updateTerm = (id: number, patch: Partial<TermRow>) => {
    setTerms((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-10">
      {msg ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          {msg}
        </p>
      ) : null}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-dark">{a.tariffsSectionGlobal}</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            {a.tariffsLabelBaseMonthly}
            <input
              type="number"
              min={1}
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 font-mono"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
            {a.tariffsLabelTrialDays}
            <input
              type="number"
              min={0}
              value={trial}
              onChange={(e) => setTrial(e.target.value)}
              className="w-40 rounded-lg border border-slate-200 px-3 py-2 font-mono"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void saveGlobal()}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {a.tariffsSaveGlobal}
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-black text-dark">{a.tariffsSectionTerms}</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
              <tr>
                <th className="px-3 py-3">{a.tariffsColMonths}</th>
                <th className="px-3 py-3">{a.tariffsColDiscount}</th>
                <th className="px-3 py-3">{a.tariffsColReferrerDays}</th>
                <th className="px-3 py-3">{a.tariffsColSort}</th>
                <th className="px-3 py-3">{a.tariffsColActive}</th>
                <th className="px-3 py-3">{a.tariffsColPay}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {terms.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={row.months}
                      onChange={(e) => updateTerm(row.id, { months: Number(e.target.value) })}
                      className="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.00001"
                      min={0}
                      max={0.99999}
                      value={row.discount_rate}
                      onChange={(e) => updateTerm(row.id, { discount_rate: Number(e.target.value) })}
                      className="w-28 rounded border border-slate-200 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={row.referrer_bonus_days}
                      onChange={(e) =>
                        updateTerm(row.id, { referrer_bonus_days: Number(e.target.value) })
                      }
                      className="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={row.sort_order}
                      onChange={(e) => updateTerm(row.id, { sort_order: Number(e.target.value) })}
                      className="w-20 rounded border border-slate-200 px-2 py-1 font-mono"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(row.is_active)}
                      onChange={(e) => updateTerm(row.id, { is_active: e.target.checked ? 1 : 0 })}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold">
                    {formatRub(
                      Math.round((Number(base) || 0) * row.months * (1 - (Number(row.discount_rate) || 0))),
                    )}
                  </td>
                  <td className="space-x-2 px-3 py-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void patchTerm(row)}
                      className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                      {a.tariffsSaveTerm}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void removeTerm(row.id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {a.tariffsDeleteTerm}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
          <span className="w-full text-sm font-bold text-slate-600">{a.tariffsAddTerm}</span>
          <input
            type="number"
            min={1}
            placeholder={a.tariffsColMonths}
            value={newMonths}
            onChange={(e) => setNewMonths(e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
          />
          <input
            type="number"
            step="0.01"
            placeholder={a.tariffsColDiscount}
            value={newDisc}
            onChange={(e) => setNewDisc(e.target.value)}
            className="w-24 rounded-lg border border-slate-200 px-2 py-2 font-mono"
          />
          <input
            type="number"
            min={0}
            placeholder={a.tariffsColReferrerDays}
            value={newRef}
            onChange={(e) => setNewRef(e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
          />
          <input
            type="number"
            placeholder={a.tariffsColSort}
            value={newSort}
            onChange={(e) => setNewSort(e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-2 py-2 font-mono"
          />
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={newActive} onChange={(e) => setNewActive(e.target.checked)} />
            {a.tariffsColActive}
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={() => void addTerm()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {a.tariffsAddTerm}
          </button>
        </div>
      </section>
    </div>
  );
}
