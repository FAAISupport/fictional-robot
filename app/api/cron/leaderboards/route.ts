import { requireCronToken } from "@/lib/auth/guards";
import { refreshLeaderboards } from "@/services/waitlist/waitlist.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const snapshotDate = body.snapshotDate ?? new Date().toISOString().slice(0, 10);

  try {
    const result = await refreshLeaderboards(snapshotDate);
    return ok({ snapshotDate, ...result });
  } catch (error) {
    return fail("CRON_FAILED", "Leaderboard refresh failed", 500, String(error));
  }
}
