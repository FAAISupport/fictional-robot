import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { fail, ok } from "@/utils/api";

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

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("leaderboard_snapshots")
    .select("snapshot_type,region_key,waitlist_user_id,rank,referral_count,score,snapshot_date")
    .eq("snapshot_type", parsed.data.type)
    .order("snapshot_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(50);

  if (parsed.data.type === "geo" && parsed.data.region) {
    query = query.eq("region_key", parsed.data.region);
  }

  const { data } = await query;
  return ok({ leaderboard: data ?? [] });
}
