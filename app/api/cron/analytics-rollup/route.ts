import { requireCronToken } from "@/lib/auth/guards";
import { aggregateAnalyticsSnapshot } from "@/services/analytics/analytics.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const result = await aggregateAnalyticsSnapshot();
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Analytics rollup failed", 500, String(error));
  }
}
