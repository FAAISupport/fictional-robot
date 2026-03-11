import { StatusCard } from "@/components/ui/StatusCard";
import { createSupabaseServerClient } from "@/lib/supabase/clients";
import { seniorDashboardData } from "@/services/dashboard/dashboard.service";

export default async function SeniorDashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <main className="mx-auto max-w-4xl p-6">Please sign in to view your dashboard.</main>;
  }

  const data = await seniorDashboardData(user.id);
  if (!data) {
    return <main className="mx-auto max-w-4xl p-6">No monitored profile found.</main>;
  }

  const latest = data.latestCheckins[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-2">
      <StatusCard
        title="Today"
        value={latest ? latest.status : "No check-ins yet"}
        description={
          latest
            ? `Latest expected check-in: ${new Date(latest.expected_at).toLocaleString()}`
            : "Your schedule will appear here once your caregiver sets it up."
        }
      />
      <StatusCard
        title="Routine consistency"
        value={data.routineConsistency ? String(data.routineConsistency.level).toUpperCase() : "Steady"}
        description={
          data.routineConsistency
            ? data.routineConsistency.message
            : "No consistency trend yet. Keep checking in to build your routine."
        }
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
        <h2 className="text-lg font-semibold text-slate-900">Guardian contacts</h2>
        <ul className="mt-4 space-y-2">
          {data.guardians.map((g) => (
            <li key={g.guardian_profile_id} className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Priority {g.priority_order}: {g.relationship}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
