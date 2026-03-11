import { requireCronToken } from "@/lib/auth/guards";
import { processEscalationSteps } from "@/services/escalations/escalation.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));

  try {
    const result = await processEscalationSteps(body.now);
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Process escalations failed", 500, String(error));
  }
}
