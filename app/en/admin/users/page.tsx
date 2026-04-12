import Link from "next/link";
import { AdminThSort } from "@/components/admin/AdminThSort";
import { adminListUsers } from "@/lib/admin/users-admin";
import { adminQs, parseAdminLimit, parseAdminPage, parseSortDir, type SortDir } from "@/lib/admin/table-params";
import { pathPrefix } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const USER_SORT = ["id", "email", "name", "subscription_until", "created_at", "is_admin"] as const;

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    limit?: string;
    sort?: string;
    dir?: string;
  }>;
};

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EnAdminUsersPage({ searchParams }: Props) {
  const messages = getMessages("en");
  const a = messages.adminPanel;
  const sp = await searchParams;
  const page = parseAdminPage(sp.page);
  const limit = parseAdminLimit(sp.limit, 25);
  const q = sp.q?.trim() || undefined;
  const sort =
    sp.sort && (USER_SORT as readonly string[]).includes(sp.sort) ? sp.sort : "id";
  const dir: SortDir = parseSortDir(sp.dir);
  const { rows, total } = await adminListUsers({ page, pageSize: limit, q, sort, sortDir: dir });
  const p = pathPrefix(messages.locale);
  const base = p ? `${p}/admin` : "/admin";
  const basePath = `${base}/users`;
  const pages = Math.max(1, Math.ceil(total / limit));

  const common: Record<string, string | number | undefined> = {
    q,
    limit,
    sort,
    dir,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.usersTitle}</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-bold uppercase text-slate-600">
          {a.usersSearch}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={a.usersSearchPlaceholder}
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
                label={a.usersColId}
                column="id"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.usersColEmail}
                column="email"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.usersColName}
                column="name"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.usersColRegistered}
                column="created_at"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <AdminThSort
                label={a.usersColSub}
                column="subscription_until"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <th className="px-3 py-3">{a.usersColTheir}</th>
              <AdminThSort
                label={a.usersColAdmin}
                column="is_admin"
                sort={sort}
                dir={dir}
                basePath={basePath}
                common={common}
              />
              <th className="px-3 py-3">{a.usersAction}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-3 py-2 font-mono font-semibold">{u.id}</td>
                <td className="max-w-[180px] truncate px-3 py-2">{u.email ?? "—"}</td>
                <td className="max-w-[140px] truncate px-3 py-2">{u.name ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{fmt(u.created_at)}</td>
                <td className="px-3 py-2 font-mono text-xs">{fmt(u.subscription_until)}</td>
                <td className="px-3 py-2">{u.is_their ? a.yes : a.no}</td>
                <td className="px-3 py-2">{u.is_admin ? a.yes : a.no}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`${base}/users/${u.id}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {a.usersAction}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-slate-600">
          {a.adminTableTotal}: {total} · {a.paginationPrev} / {a.paginationNext}: {page} / {pages}
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
