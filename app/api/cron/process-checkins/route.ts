import { requireCronToken } from "@/lib/auth/guards";
import { processPendingCheckins } from "@/services/checkins/checkin.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));

  try {
    const result = await processPendingCheckins(body.now);
    return ok(result);
  } catch (error) {
    return fail("CRON_FAILED", "Process check-ins failed", 500, String(error));
  }
}
