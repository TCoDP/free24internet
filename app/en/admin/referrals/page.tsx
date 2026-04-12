import Link from "next/link";
import { AdminThSort } from "@/components/admin/AdminThSort";
import { adminListReferralRewards } from "@/lib/admin/referrals-admin";
import { adminQs, parseAdminLimit, parseAdminPage, parseSortDir, type SortDir } from "@/lib/admin/table-params";
import { pathPrefix } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const REF_SORT = [
  "id",
  "referrer_user_id",
  "referee_user_id",
  "plan_months",
  "bonus_days",
  "created_at",
] as const;

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function EnAdminReferralsPage({ searchParams }: Props) {
  const messages = getMessages("en");
  const a = messages.adminPanel;
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const limit = parseAdminLimit(sp.limit, 25);
  const q = sp.q?.trim() || undefined;
  const sort =
    sp.sort && (REF_SORT as readonly string[]).includes(sp.sort) ? sp.sort : "created_at";
  const dir: SortDir = parseSortDir(sp.dir);
  const { rows, total } = await adminListReferralRewards({
    page,
    pageSize: limit,
    q,
    sort,
    sortDir: dir,
  });
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";
  const basePath = `${base}/referrals`;
  const pages = Math.max(1, Math.ceil(total / limit));

  const common: Record<string, string | number | undefined> = {
    q,
    limit,
    sort,
    dir,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.referralsTitle}</h1>
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
        <table className="w-full min-w-[640px] text-left text-sm">
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
                label={a.referralsColReferrer}
                column="referrer_user_id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.referralsColReferee}
                column="referee_user_id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.referralsColMonths}
                column="plan_months"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.referralsColDays}
                column="bonus_days"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
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
                <td className="px-3 py-2 font-mono">{r.referrer_user_id}</td>
                <td className="px-3 py-2 font-mono">{r.referee_user_id}</td>
                <td className="px-3 py-2">{r.plan_months}</td>
                <td className="px-3 py-2">{r.bonus_days}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(r.created_at).toISOString().slice(0, 19).replace("T", " ")}
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
