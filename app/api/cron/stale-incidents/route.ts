import { requireCronToken } from "@/lib/auth/guards";
import { flagStaleIncidents } from "@/services/reporting/reporting.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  try {
    const result = await flagStaleIncidents();
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Stale incident detection failed", 500, String(error));
  }
}
