import Link from "next/link";
import { AdminThSort } from "@/components/admin/AdminThSort";
import { adminListTransactions } from "@/lib/admin/transactions-admin";
import { adminQs, parseAdminLimit, parseAdminPage, parseSortDir, type SortDir } from "@/lib/admin/table-params";
import { pathPrefix } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const TX_SORT = ["id", "user_id", "amount_rub", "plan_months", "provider", "created_at", "completed_at"] as const;

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function EnAdminPaymentsPage({ searchParams }: Props) {
  const messages = getMessages("en");
  const a = messages.adminPanel;
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const limit = parseAdminLimit(sp.limit, 25);
  const q = sp.q?.trim() || undefined;
  const sort =
    sp.sort && (TX_SORT as readonly string[]).includes(sp.sort) ? sp.sort : "created_at";
  const dir: SortDir = parseSortDir(sp.dir);
  const { rows, total } = await adminListTransactions({ page, pageSize: limit, q, sort, sortDir: dir });
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";
  const basePath = `${base}/payments`;
  const pages = Math.max(1, Math.ceil(total / limit));

  const common: Record<string, string | number | undefined> = {
    q,
    limit,
    sort,
    dir,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.paymentsTitle}</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {a.adminTableSearch}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={a.adminTableSearchPlaceholder}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm normal-case font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {a.adminTablePerPage}
          <select
            name="limit"
            defaultValue={limit}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono normal-case"
          >
            {[10, 20, 25, 40, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          {a.adminTableApply}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <AdminThSort
                label={a.paymentsColId}
                column="id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.paymentsColUser}
                column="user_id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.paymentsColAmount}
                column="amount_rub"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.paymentsColPlan}
                column="plan_months"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.paymentsColProvider}
                column="provider"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <th className="px-3 py-3">Ext. ID</th>
              <AdminThSort
                label={a.paymentsColDate}
                column="created_at"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono">{r.id}</td>
                <td className="px-3 py-2 font-mono font-semibold">{r.user_id}</td>
                <td className="px-3 py-2 font-mono">{r.amount_rub}</td>
                <td className="px-3 py-2">{r.plan_months}</td>
                <td className="max-w-[120px] truncate px-3 py-2 text-xs">{r.provider}</td>
                <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs">
                  {r.external_payment_id ?? "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">
          {a.adminTableTotal}: {total} · {page} / {pages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={adminQs(basePath, { ...common, page: page - 1 })}
              className="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
            >
              {a.paginationPrev}
            </Link>
          ) : null}
          {page < pages ? (
            <Link
              href={adminQs(basePath, { ...common, page: page + 1 })}
              className="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
            >
              {a.paginationNext}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
