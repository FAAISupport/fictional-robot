import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export async function generateWeeklySafetyReports() {
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: people } = await supabase.from("monitored_people").select("id, profile_id").eq("is_active", true).limit(1000);

  let generated = 0;
  for (const person of people ?? []) {
    const [{ count: total }, { count: responded }, { count: missed }, { count: escalations }, { data: risk }] = await Promise.all([
      supabase.from("checkins").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).gte("expected_at", since),
      supabase.from("checkins").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).eq("status", "responded").gte("expected_at", since),
      supabase.from("checkins").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).eq("status", "missed").gte("expected_at", since),
      supabase.from("escalations").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).gte("triggered_at", since),
      supabase
        .from("risk_snapshots")
        .select("risk_score,risk_level,trend_direction")
        .eq("monitored_person_id", person.id)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    await supabase.from("analytics_events").insert({
      profile_id: person.profile_id,
      event_name: "weekly_safety_report",
      event_category: "report",
      event_payload: {
        monitoredPersonId: person.id,
        checkinSuccessRate: (total ?? 0) > 0 ? Math.round(((responded ?? 0) / (total ?? 1)) * 10000) / 100 : 0,
        missedCheckins: missed ?? 0,
        escalations: escalations ?? 0,
        routine: risk ?? null
      }
    });

    generated += 1;
  }

  return { generated };
}

export async function flagStaleIncidents() {
  const supabase = createSupabaseAdminClient();
  const threshold = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id")
    .in("status", ["open", "investigating"])
    .lt("opened_at", threshold)
    .limit(200);

  for (const incident of incidents ?? []) {
    await supabase.from("notifications").insert({
      category: "stale_incident",
      title: "Incident requires review",
      body: `Incident ${incident.id} has remained open beyond SLA window.`,
      status: "sent",
      metadata: { incidentId: incident.id }
    });
  }

  return { flagged: incidents?.length ?? 0 };
}
