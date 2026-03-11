import { requireAuth } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { createBillingPortalSession } from "@/services/billing/billing.service";
import { fail, ok } from "@/utils/api";

export async function POST() {
  const auth = await requireAuth(["senior", "caregiver", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const supabase = createSupabaseAdminClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("profile_id", auth.profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) return fail("NOT_FOUND", "No billing customer found", 404);

  const portal = await createBillingPortalSession({ stripeCustomerId: sub.stripe_customer_id });
  return ok(portal);
}
