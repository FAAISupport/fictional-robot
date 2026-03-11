import { z } from "zod";
import { joinWaitlist } from "@/services/waitlist/waitlist.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  relationshipType: z.string().min(2),
  city: z.string().optional(),
  state: z.string().optional(),
  referralCode: z.string().optional()
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid waitlist payload", 422, parsed.error.flatten());

  const result = await joinWaitlist(parsed.data);
  return ok({ waitlistUser: result }, 201);
}
