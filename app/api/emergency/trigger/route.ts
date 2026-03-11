import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { triggerEmergencyEvent } from "@/services/checkins/health-modules.service";
import { triggerEscalation } from "@/services/escalations/escalation.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  monitoredPersonId: z.string().uuid(),
  triggerSource: z.enum(["sms", "voice", "dashboard", "caregiver", "automatic"]).default("dashboard"),
  details: z.string().max(500).optional()
});

export async function POST(request: Request) {
  const auth = await requireAuth(["senior", "caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid emergency payload", 422, parsed.error.flatten());

  const emergency = await triggerEmergencyEvent({
    monitoredPersonId: parsed.data.monitoredPersonId,
    actorProfileId: auth.profileId,
    triggerSource: parsed.data.triggerSource,
    details: parsed.data.details
  });

  const escalation = await triggerEscalation({
    monitoredPersonId: parsed.data.monitoredPersonId,
    reason: "emergency_trigger"
  });

  return ok({ emergency, escalation }, 201);
}
