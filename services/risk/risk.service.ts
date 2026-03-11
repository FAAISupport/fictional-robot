import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export function computeRiskLevel(score: number): "stable" | "caution" | "elevated" | "high" {
  if (score <= 19) return "stable";
  if (score <= 39) return "caution";
  if (score <= 64) return "elevated";
  return "high";
}

export function computeTrendDirection(current: number, baseline: number): "improving" | "stable" | "worsening" {
  if (current >= baseline + 8) return "worsening";
  if (current <= baseline - 8) return "improving";
  return "stable";
}

export async function fetchLatestRiskSnapshot(monitoredPersonId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("risk_snapshots")
    .select("*")
    .eq("monitored_person_id", monitoredPersonId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function caregiverRiskSummary(monitoredPersonId: string) {
  const supabase = createSupabaseAdminClient();

  const { data: current } = await supabase
    .from("risk_snapshots")
    .select("*")
    .eq("monitored_person_id", monitoredPersonId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: trailing } = await supabase
    .from("risk_snapshots")
    .select("risk_score")
    .eq("monitored_person_id", monitoredPersonId)
    .order("snapshot_date", { ascending: false })
    .range(1, 7);

  const baseline =
    trailing && trailing.length > 0
      ? Math.round(trailing.reduce((acc, row) => acc + (row.risk_score ?? 0), 0) / trailing.length)
      : current?.risk_score ?? 0;

  const trend = current ? computeTrendDirection(current.risk_score, baseline) : "stable";

  const factors = current?.score_factors && typeof current.score_factors === "object" ? current.score_factors : {};
  const topReasons = Object.entries(factors as Record<string, number>)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([key, value]) => `${key}: +${value}`);

  return {
    snapshot: current,
    baselineScore: baseline,
    trend,
    topReasons
  };
}
