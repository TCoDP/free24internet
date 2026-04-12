import { adminDashboardStats } from "@/lib/admin/stats";
import { getMessages } from "@/lib/messages";

export default async function AdminDashboardPage() {
  const messages = getMessages("ru");
  const a = messages.adminPanel;
  const s = await adminDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-dark">{a.navDashboard}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={a.dashboardUsers} value={s.users} />
        <StatCard label={a.dashboardTicketsOpen} value={s.ticketsOpen} />
        <StatCard label={a.dashboardTicketsTotal} value={s.ticketsTotal} />
        <StatCard label={a.dashboardTx} value={s.transactionsCompleted} />
        <StatCard label={a.dashboardReferralRows} value={s.referralRewards} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-dark">{value}</p>
    </div>
  );
}
