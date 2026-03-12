import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { getVerticalBySlug, type VerticalSlug } from "@/lib/marketing/verticals";

export async function verticalDashboardData(slug: VerticalSlug) {
  const definition = getVerticalBySlug(slug);
  if (!definition) return null;

  const supabase = createSupabaseAdminClient();
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: monitoredCount },
    { count: respondedCount },
    { count: missedCount },
    { count: escalationCount },
    { count: emergencyCount },
    { count: waitlistCount }
  ] = await Promise.all([
    supabase.from("monitored_people").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("status", "responded").gte("expected_at", since7),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("status", "missed").gte("expected_at", since7),
    supabase.from("escalations").select("id", { count: "exact", head: true }).gte("triggered_at", since7),
    supabase.from("emergency_events").select("id", { count: "exact", head: true }).gte("created_at", since7),
    supabase.from("waitlist_users").select("id", { count: "exact", head: true })
  ]);

  const responseRate =
    (respondedCount ?? 0) + (missedCount ?? 0) > 0
      ? Math.round(((respondedCount ?? 0) / ((respondedCount ?? 0) + (missedCount ?? 0))) * 10000) / 100
      : 0;

  return {
    definition,
    metrics: {
      monitoredCount: monitoredCount ?? 0,
      responseRate7d: responseRate,
      missed7d: missedCount ?? 0,
      escalations7d: escalationCount ?? 0,
      emergencyEvents7d: emergencyCount ?? 0,
      waitlistTotal: waitlistCount ?? 0
    }
  };
}
