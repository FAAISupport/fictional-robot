import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { bootstrapProfile } from "@/services/auth/auth.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(4).optional(),
  role: z.enum(["senior", "caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin", "waitlist_only"]),
  timezone: z.string().min(2).default("UTC")
});

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid payload", 422, parsed.error.flatten());
  }

  const profile = await bootstrapProfile({
    profileId: auth.profileId,
    email: auth.email,
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    role: parsed.data.role,
    timezone: parsed.data.timezone
  });

  return ok({ profile }, 201);
}
