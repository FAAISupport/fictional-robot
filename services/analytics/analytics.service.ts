import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export async function recordAnalyticsEvent(input: {
  profileId?: string;
  eventName: string;
  eventCategory: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("analytics_events").insert({
    profile_id: input.profileId ?? null,
    event_name: input.eventName,
    event_category: input.eventCategory,
    event_payload: input.payload ?? {},
    occurred_at: new Date().toISOString()
  });
}

export async function aggregateAnalyticsSnapshot() {
  const supabase = createSupabaseAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: dau }, { count: monitoredCount }, { count: checkinsCompleted }, { count: checkinsTotal }, { count: escalations }] =
    await Promise.all([
      supabase.from("analytics_events").select("id", { count: "exact", head: true }).gte("occurred_at", since),
      supabase.from("monitored_people").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("checkins").select("id", { count: "exact", head: true }).eq("status", "responded").gte("expected_at", weekSince),
      supabase.from("checkins").select("id", { count: "exact", head: true }).gte("expected_at", weekSince),
      supabase.from("escalations").select("id", { count: "exact", head: true }).gte("triggered_at", weekSince)
    ]);

  const successRate = (checkinsTotal ?? 0) > 0 ? Math.round(((checkinsCompleted ?? 0) / (checkinsTotal ?? 1)) * 10000) / 100 : 0;

  await recordAnalyticsEvent({
    eventName: "platform.rollup.daily",
    eventCategory: "rollup",
    payload: {
      dau: dau ?? 0,
      monitoredCount: monitoredCount ?? 0,
      checkinSuccessRate7d: successRate,
      escalationCount7d: escalations ?? 0
    }
  });

  return {
    dau: dau ?? 0,
    monitoredCount: monitoredCount ?? 0,
    checkinSuccessRate7d: successRate,
    escalationCount7d: escalations ?? 0
  };
}
