import { requireCronToken } from "@/lib/auth/guards";
import { ok } from "@/utils/api";

export async function GET(request: Request) {
  const denied = requireCronToken(request);
  if (denied) return denied;

  return ok({ service: "cron", healthy: true, at: new Date().toISOString() });
}
