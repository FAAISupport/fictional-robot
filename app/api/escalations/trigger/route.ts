import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { triggerEscalation } from "@/services/escalations/escalation.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  monitoredPersonId: z.string().uuid(),
  checkinId: z.string().uuid().optional(),
  reason: z.string().min(3)
});

export async function POST(request: Request) {
  const auth = await requireAuth(["caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid escalation payload", 422, parsed.error.flatten());

  const escalation = await triggerEscalation({ ...parsed.data, triggeredByProfileId: auth.profileId });
  return ok({ escalation }, 201);
}
