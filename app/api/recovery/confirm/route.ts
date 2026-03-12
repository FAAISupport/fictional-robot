import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { confirmRecoveryCheckin } from "@/services/checkins/health-modules.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  recoveryCheckinId: z.string().uuid(),
  responseChannel: z.enum(["sms", "voice", "app"]).default("app")
});

export async function POST(request: Request) {
  const auth = await requireAuth(["senior", "caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid recovery confirmation", 422, parsed.error.flatten());

  const result = await confirmRecoveryCheckin({
    recoveryCheckinId: parsed.data.recoveryCheckinId,
    actorProfileId: auth.profileId,
    responseChannel: parsed.data.responseChannel
  });

  return ok({ recoveryCheckin: result });
}
