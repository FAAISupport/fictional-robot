import { requireAuth } from "@/lib/auth/guards";
import { processCheckinsSchema } from "@/lib/validation/checkins";
import { processPendingCheckins } from "@/services/checkins/checkin.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const auth = await requireAuth(["caregiver", "agency_admin", "agency_staff", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => ({}));
  const parsed = processCheckinsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  const result = await processPendingCheckins(parsed.data.now);
  return ok(result);
}
