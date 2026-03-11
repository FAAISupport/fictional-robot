import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { computeRiskLevel, computeTrendDirection } from "@/services/risk/risk.service";

function percent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

export async function calculateDailyRiskSnapshots(snapshotDate: string) {
  const supabase = createSupabaseAdminClient();
  const { data: people } = await supabase.from("monitored_people").select("id").eq("is_active", true).limit(5000);

  let calculated = 0;
  for (const person of people ?? []) {
    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    const [{ data: c7 }, { data: c30 }, { data: med7 }, { data: rec7 }, { count: interventions30 }, { count: emergencies30 }] =
      await Promise.all([
        supabase.from("checkins").select("status,response_latency_minutes,attempts_used").eq("monitored_person_id", person.id).gte("expected_at", since7),
        supabase.from("checkins").select("status,response_latency_minutes,attempts_used").eq("monitored_person_id", person.id).gte("expected_at", since30),
        supabase.from("medication_logs").select("status").eq("monitored_person_id", person.id).gte("expected_at", since7),
        supabase.from("recovery_checkins").select("status").eq("monitored_person_id", person.id).gte("expected_at", since7),
        supabase.from("escalations").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).gte("triggered_at", since30),
        supabase.from("emergency_events").select("id", { count: "exact", head: true }).eq("monitored_person_id", person.id).gte("created_at", since30)
      ]);

    const total7 = c7?.length ?? 0;
    const total30 = c30?.length ?? 0;
    const misses7 = c7?.filter((c) => c.status === "missed").length ?? 0;
    const misses30 = c30?.filter((c) => c.status === "missed").length ?? 0;
    const late7 = c7?.filter((c) => (c.response_latency_minutes ?? 0) > 15).length ?? 0;
    const late30 = c30?.filter((c) => (c.response_latency_minutes ?? 0) > 15).length ?? 0;
    const avg7 = total7 > 0 ? (c7 ?? []).reduce((a, c) => a + (c.response_latency_minutes ?? 0), 0) / total7 : 0;
    const avg30 = total30 > 0 ? (c30 ?? []).reduce((a, c) => a + (c.response_latency_minutes ?? 0), 0) / total30 : 0;
    const retries7 = c7?.filter((c) => (c.attempts_used ?? 0) > 1).length ?? 0;
    const medMiss7 = med7?.filter((m) => m.status === "missed").length ?? 0;
    const recMiss7 = rec7?.filter((r) => r.status === "missed").length ?? 0;

    const factors = {
      missed_checkins_7d: Math.round(percent(misses7, total7) * 0.30),
      missed_checkins_30d: Math.round(percent(misses30, total30) * 0.15),
      response_latency_7d: Math.min(20, Math.round(avg7 / 2)),
      late_response_rate_7d: Math.round(percent(late7, total7) * 0.15),
      retry_dependence_7d: Math.round(percent(retries7, total7) * 0.1),
      medication_miss_7d: Math.round(percent(medMiss7, med7?.length ?? 0) * 0.08),
      recovery_miss_7d: Math.round(percent(recMiss7, rec7?.length ?? 0) * 0.08),
      guardian_interventions_30d: Math.min(10, (interventions30 ?? 0) * 2),
      emergency_events_30d: Math.min(12, (emergencies30 ?? 0) * 4)
    };

    const riskScore = Math.min(100, Object.values(factors).reduce((a, n) => a + n, 0));
    const riskLevel = computeRiskLevel(riskScore);

    const { data: previous } = await supabase
      .from("risk_snapshots")
      .select("risk_score, risk_level")
      .eq("monitored_person_id", person.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const trend = computeTrendDirection(riskScore, previous?.risk_score ?? riskScore);
    const thresholdCrossed = previous ? previous.risk_level !== riskLevel : false;

    const explanation = [
      `missed ${misses7} of last ${Math.max(total7, 1)} check-ins`,
      `average response time ${Math.round(avg7)} min (30d ${Math.round(avg30)} min)`,
      `${retries7} recent check-ins required retries`
    ].join("; ");

    const { data: snapshot, error } = await supabase
      .from("risk_snapshots")
      .upsert(
        {
          monitored_person_id: person.id,
          snapshot_date: snapshotDate,
          risk_score: riskScore,
          risk_level: riskLevel,
          miss_rate_7d: percent(misses7, total7),
          miss_rate_30d: percent(misses30, total30),
          avg_response_minutes_7d: Math.round(avg7 * 100) / 100,
          avg_response_minutes_30d: Math.round(avg30 * 100) / 100,
          late_response_rate_7d: percent(late7, total7),
          late_response_rate_30d: percent(late30, total30),
          retry_dependence_rate_7d: percent(retries7, total7),
          medication_miss_rate_7d: percent(medMiss7, med7?.length ?? 0),
          recovery_miss_rate_7d: percent(recMiss7, rec7?.length ?? 0),
          guardian_intervention_count_30d: interventions30 ?? 0,
          recent_emergency_event_count_30d: emergencies30 ?? 0,
          score_factors: factors,
          explanation,
          trend_direction: trend,
          threshold_crossed: thresholdCrossed
        },
        { onConflict: "monitored_person_id,snapshot_date" }
      )
      .select("id")
      .single();

    if (error || !snapshot) throw new Error(`risk_snapshot_failed:${error?.message}`);

    if (thresholdCrossed) {
      await supabase.from("risk_threshold_events").insert({
        monitored_person_id: person.id,
        risk_snapshot_id: snapshot.id,
        previous_level: previous?.risk_level ?? null,
        new_level: riskLevel,
        notified: false
      });
    }

    calculated += 1;
  }

  return { calculated };
}

export async function processRiskThresholdNotifications() {
  const supabase = createSupabaseAdminClient();
  const { data: events } = await supabase
    .from("risk_threshold_events")
    .select("id, monitored_person_id, new_level")
    .eq("notified", false)
    .limit(200);

  for (const evt of events ?? []) {
    await supabase.from("notifications").insert({
      monitored_person_id: evt.monitored_person_id,
      category: "risk_threshold",
      title: "Routine stability changed",
      body: `Risk threshold crossed to ${evt.new_level}.`,
      status: "sent",
      metadata: { riskThresholdEventId: evt.id }
    });

    await supabase.from("risk_threshold_events").update({ notified: true }).eq("id", evt.id);
  }

  return { processed: events?.length ?? 0 };
}
