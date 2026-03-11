import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { confirmMedicationLog } from "@/services/checkins/health-modules.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  medicationLogId: z.string().uuid(),
  source: z.enum(["sms", "voice", "dashboard", "caregiver"]).default("dashboard")
});

export async function POST(request: Request) {
  const auth = await requireAuth(["senior", "caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid medication confirmation", 422, parsed.error.flatten());

  const result = await confirmMedicationLog({
    medicationLogId: parsed.data.medicationLogId,
    actorProfileId: auth.profileId,
    source: parsed.data.source
  });

  return ok({ medicationLog: result });
}
