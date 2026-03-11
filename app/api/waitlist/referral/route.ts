import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { fail, ok } from "@/utils/api";

const schema = z.object({ referralCode: z.string().min(3) });

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid referral payload", 422, parsed.error.flatten());

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("waitlist_users")
    .select("id,name,referral_code,referral_count,spots_gained,beta_eligibility")
    .eq("referral_code", parsed.data.referralCode)
    .maybeSingle();

  if (!data) return fail("NOT_FOUND", "Referral code not found", 404);
  return ok({ referrer: data });
}
