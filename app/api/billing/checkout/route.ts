import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createCheckoutSession } from "@/services/billing/billing.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({ plan: z.enum(["family", "caregiver", "enterprise"]) });

export async function POST(request: Request) {
  const auth = await requireAuth(["senior", "caregiver", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid plan", 422, parsed.error.flatten());

  const session = await createCheckoutSession({ profileId: auth.profileId, email: auth.email, plan: parsed.data.plan });
  return ok(session);
}
