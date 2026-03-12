import { requireCronToken } from "@/lib/auth/guards";
import { generateWeeklySafetyReports } from "@/services/reporting/reporting.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const result = await generateWeeklySafetyReports();
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Weekly report generation failed", 500, String(error));
  }
}
