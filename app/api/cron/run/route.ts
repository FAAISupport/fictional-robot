import { requireCronToken } from "@/lib/auth/guards";
import { materializeCheckins, processPendingCheckins } from "@/services/checkins/checkin.service";
import { processEscalationSteps } from "@/services/escalations/escalation.service";
import { generateWeeklySafetyReports } from "@/services/reporting/reporting.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const now = new Date().toISOString();

    const materialized = await materializeCheckins({
      windowStart: new Date().toISOString().slice(0, 10),
      windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    });

    const processed = await processPendingCheckins(now);
    const escalations = await processEscalationSteps(now);
    const reports = await generateWeeklySafetyReports();

    return ok({ materialized, processed, escalations, reports });
  } catch (error) {
    return fail("CRON_RUN_FAILED", "LifeSignal orchestration failed", 500, String(error));
  }
}
