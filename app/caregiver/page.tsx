import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { caregiverDashboardData } from "@/services/dashboard/dashboard.service";

function riskBadge(level: string) {
  if (level === "high") return "bg-red-100 text-red-700";
  if (level === "elevated") return "bg-orange-100 text-orange-700";
  if (level === "caution") return "bg-yellow-100 text-yellow-800";
  return "bg-emerald-100 text-emerald-700";
}

export default async function CaregiverDashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="mx-auto max-w-4xl p-6">Please sign in to view your caregiver dashboard.</main>;
  }

  const data = await caregiverDashboardData(user.id);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Caregiver dashboard</h1>
      <p className="mt-2 text-slate-600">Real-time check-in status, concern trends, and explanation factors.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.cards.map((card) => (
          <section key={String(card.monitoredPersonId)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{String(card.name)}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge(String(card.riskLevel))}`}>
                {String(card.riskLevel)}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">Latest check-in: {String(card.latestCheckinStatus)}</p>
            <p className="mt-1 text-sm text-slate-600">Trend: {String(card.trend)}</p>
            <p className="mt-3 text-sm text-slate-700">{String(card.explanation)}</p>

            <div className="mt-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Top contributing reasons</h3>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {(card.topReasons as string[]).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
