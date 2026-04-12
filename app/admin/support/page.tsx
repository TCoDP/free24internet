import Link from "next/link";
import { AdminThSort } from "@/components/admin/AdminThSort";
import { adminListTickets } from "@/lib/admin/tickets-admin";
import { adminQs, parseAdminLimit, parseAdminPage, parseSortDir, type SortDir } from "@/lib/admin/table-params";
import { pathPrefix } from "@/lib/locale";
import { getMessages } from "@/lib/messages";
import { ticketStatusLabel } from "@/lib/support/ticket-status-label";

const TICK_SORT = ["id", "user_id", "subject", "status", "created_at", "updated_at"] as const;

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function AdminSupportPage({ searchParams }: Props) {
  const messages = getMessages("ru");
  const a = messages.adminPanel;
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const limit = parseAdminLimit(sp.limit, 25);
  const q = sp.q?.trim() || undefined;
  const sort =
    sp.sort && (TICK_SORT as readonly string[]).includes(sp.sort) ? sp.sort : "created_at";
  const dir: SortDir = parseSortDir(sp.dir);
  const { rows, total } = await adminListTickets({ page, pageSize: limit, q, sort, sortDir: dir });
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";
  const basePath = `${base}/support`;
  const pages = Math.max(1, Math.ceil(total / limit));

  const common: Record<string, string | number | undefined> = {
    q,
    limit,
    sort,
    dir,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.supportTitle}</h1>
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
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
            <tr>
              <AdminThSort
                label={a.supportColId}
                column="id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.supportColUser}
                column="user_id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.supportColSubject}
                column="subject"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.supportColStatus}
                column="status"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.supportColDate}
                column="created_at"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-3 py-2 font-mono font-semibold">
                  <Link href={`${base}/support/${t.id}`} className="text-primary hover:underline">
                    {t.id}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-xs">{t.user_id}</span>
                  <br />
                  <span className="text-xs text-slate-600">{t.user_email ?? t.user_name ?? "—"}</span>
                </td>
                <td className="max-w-[240px] truncate px-3 py-2">{t.subject}</td>
                <td className="px-3 py-2">{ticketStatusLabel(messages, t.status)}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {new Date(t.created_at).toISOString().slice(0, 16).replace("T", " ")}
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
