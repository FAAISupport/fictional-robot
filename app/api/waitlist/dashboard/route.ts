import { z } from "zod";
import { waitlistDashboard } from "@/services/waitlist/waitlist.service";
import { fail, ok } from "@/utils/api";

const schema = z.object({ email: z.string().email() });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({ email: url.searchParams.get("email") });
  if (!parsed.success) return fail("VALIDATION_ERROR", "Email required", 422, parsed.error.flatten());

  const data = await waitlistDashboard(parsed.data.email);
  if (!data) return fail("NOT_FOUND", "Waitlist user not found", 404);

  return ok({ dashboard: data });
}
