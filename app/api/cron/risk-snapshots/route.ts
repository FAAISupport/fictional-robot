import { requireCronToken } from "@/lib/auth/guards";
import { calculateDailyRiskSnapshots } from "@/services/risk/risk-calculation.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const snapshotDate = body.snapshotDate ?? new Date().toISOString().slice(0, 10);

  try {
    const result = await calculateDailyRiskSnapshots(snapshotDate);
    return ok({ snapshotDate, ...result });
  } catch (error) {
    return fail("CRON_FAILED", "Risk snapshot calculation failed", 500, String(error));
  }
}
