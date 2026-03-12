import { requireCronToken } from "@/lib/auth/guards";
import { materializeCheckins } from "@/services/checkins/checkin.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const now = new Date();
  const windowStart = body.windowStart ?? now.toISOString();
  const windowEnd = body.windowEnd ?? new Date(now.getTime() + 10 * 60_000).toISOString();

  try {
    const result = await materializeCheckins({ windowStart, windowEnd });
    return ok({ ...result, windowStart, windowEnd });
  } catch (error) {
    return fail("CRON_FAILED", "Materialize check-ins failed", 500, String(error));
  }
}
