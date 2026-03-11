import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { acknowledgeEscalationByToken } from "@/services/escalations/escalation.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({ token: z.string().min(16) });

export async function GET(request: Request) {
  const auth = await requireAuth(["caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const parsed = schema.safeParse({ token: url.searchParams.get("token") });
  if (!parsed.success) return fail("VALIDATION_ERROR", "Missing token", 422, parsed.error.flatten());

  const result = await acknowledgeEscalationByToken(parsed.data.token, auth.profileId);
  if (!result.acknowledged) return fail("NOT_FOUND", "Escalation acknowledgment token not found", 404);

  return ok(result);
}
