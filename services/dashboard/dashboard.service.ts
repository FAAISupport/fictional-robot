import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { caregiverRiskSummary } from "@/services/risk/risk.service";

export async function seniorDashboardData(profileId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: monitored } = await supabase
    .from("monitored_people")
    .select("id, preferred_name")
    .eq("profile_id", profileId)
    .single();

  if (!monitored) {
    return null;
  }

  const [{ data: latestCheckins }, { data: guardians }, { data: risk }] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, expected_at, status, responded_at")
      .eq("monitored_person_id", monitored.id)
      .order("expected_at", { ascending: false })
      .limit(7),
    supabase
      .from("guardian_network")
      .select("priority_order, relationship, guardian_profile_id")
      .eq("monitored_person_id", monitored.id)
      .eq("active", true)
      .order("priority_order", { ascending: true }),
    supabase
      .from("risk_snapshots")
      .select("risk_level, explanation, trend_direction")
      .eq("monitored_person_id", monitored.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return {
    monitored,
    latestCheckins: latestCheckins ?? [],
    guardians: guardians ?? [],
    routineConsistency: risk
      ? {
          level: risk.risk_level,
          trend: risk.trend_direction,
          message: risk.explanation
        }
      : null
  };
}

export async function caregiverDashboardData(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: linked } = await supabase
    .from("guardian_network")
    .select("monitored_person_id")
    .eq("guardian_profile_id", profileId)
    .eq("active", true);

  const monitoredIds = (linked ?? []).map((x) => x.monitored_person_id);

  const cards = [] as Array<Record<string, unknown>>;
  for (const monitoredPersonId of monitoredIds) {
    const [{ data: monitored }, { data: checkin }, riskSummary] = await Promise.all([
      supabase.from("monitored_people").select("id, preferred_name").eq("id", monitoredPersonId).single(),
      supabase
        .from("checkins")
        .select("status, expected_at, responded_at")
        .eq("monitored_person_id", monitoredPersonId)
        .order("expected_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      caregiverRiskSummary(monitoredPersonId)
    ]);

    cards.push({
      monitoredPersonId,
      name: monitored?.preferred_name ?? "Monitored person",
      latestCheckinStatus: checkin?.status ?? "none",
      latestCheckinAt: checkin?.expected_at ?? null,
      riskLevel: riskSummary.snapshot?.risk_level ?? "stable",
      trend: riskSummary.trend,
      topReasons: riskSummary.topReasons,
      explanation: riskSummary.snapshot?.explanation ?? "No risk explanation available yet."
    });
  }

  return { cards };
}

export async function agencyDashboardData(profileId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  if (!membership) return { agency: null, highConcernQueue: [], elevatedQueue: [], newlyIncreased24h: [] };

  const { data: agency } = await supabase.from("agencies").select("id, name").eq("id", membership.agency_id).single();

  const { data: residents } = await supabase
    .from("monitored_people")
    .select("id, preferred_name")
    .eq("agency_id", membership.agency_id)
    .eq("is_active", true)
    .limit(300);

  const residentIds = (residents ?? []).map((r) => r.id);

  const { data: snapshots } = await supabase
    .from("risk_snapshots")
    .select("monitored_person_id, risk_score, risk_level, trend_direction, explanation, snapshot_date")
    .in("monitored_person_id", residentIds.length ? residentIds : ["00000000-0000-0000-0000-000000000000"])
    .order("snapshot_date", { ascending: false });

  type SnapshotRow = NonNullable<typeof snapshots>[number];
  const latestByResident = new Map<string, SnapshotRow>();
  for (const snap of snapshots ?? []) {
    if (!latestByResident.has(snap.monitored_person_id)) latestByResident.set(snap.monitored_person_id, snap);
  }

  const rows = (residents ?? []).map((r) => {
    const snap = latestByResident.get(r.id);
    return {
      monitoredPersonId: r.id,
      name: r.preferred_name ?? "Resident",
      riskLevel: snap?.risk_level ?? "stable",
      trend: snap?.trend_direction ?? "stable",
      explanation: snap?.explanation ?? "No snapshot yet",
      score: snap?.risk_score ?? 0
    };
  });

  const highConcernQueue = rows.filter((r) => r.riskLevel === "high");
  const elevatedQueue = rows.filter((r) => r.riskLevel === "elevated");
  const newlyIncreased24h = rows.filter((r) => r.trend === "worsening");

  return { agency, highConcernQueue, elevatedQueue, newlyIncreased24h };
}
