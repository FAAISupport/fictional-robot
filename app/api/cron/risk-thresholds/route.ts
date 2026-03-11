import { requireCronToken } from "@/lib/auth/guards";
import { processRiskThresholdNotifications } from "@/services/risk/risk-calculation.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const result = await processRiskThresholdNotifications();
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Risk threshold processing failed", 500, String(error));
  }
}
