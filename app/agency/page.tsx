import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { agencyDashboardData } from "@/services/dashboard/dashboard.service";

function Queue({ title, rows }: { title: string; rows: Array<{ name: string; riskLevel: string; trend: string; explanation: string }> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li key={`${row.name}-${row.riskLevel}`} className="rounded-lg bg-slate-50 p-3">
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-sm text-slate-600">
              {row.riskLevel} • {row.trend}
            </p>
            <p className="mt-1 text-sm text-slate-700">{row.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function AgencyDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="mx-auto max-w-4xl p-6">Please sign in to view your agency dashboard.</main>;
  }

  const data = await agencyDashboardData(user.id);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">{data.agency?.name ?? "Agency"} operations</h1>
      <p className="mt-2 text-slate-600">High concern and elevated routine instability queues for staff triage.</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Queue title="High concern" rows={data.highConcernQueue} />
        <Queue title="Elevated concern" rows={data.elevatedQueue} />
        <Queue title="Newly increased in last 24h" rows={data.newlyIncreased24h} />
      </div>
    </main>
  );
}
