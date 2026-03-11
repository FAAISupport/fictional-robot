import { requireAuth } from "@/lib/auth/guards";
import { materializeCheckinsSchema } from "@/lib/validation/checkins";
import { materializeCheckins } from "@/services/checkins/checkin.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const auth = await requireAuth(["caregiver", "agency_admin", "agency_staff", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const payload = await request.json().catch(() => null);
  const parsed = materializeCheckinsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid date window", 422, parsed.error.flatten());
  }

  const result = await materializeCheckins(parsed.data);
  return ok(result);
}
