import { z } from "zod";
import { fail, ok } from "@/utils/api";
import { waitlistPublicLeaderboard } from "@/services/waitlist/waitlist.service";

const schema = z.object({
  type: z.enum(["all_time", "weekly", "geo"]).default("all_time"),
  region: z.string().optional()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    type: url.searchParams.get("type") ?? "all_time",
    region: url.searchParams.get("region") ?? undefined
  });

  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid leaderboard query", 422, parsed.error.flatten());

  const leaderboard = await waitlistPublicLeaderboard(parsed.data.type, parsed.data.region);
  return ok({ leaderboard });
}
