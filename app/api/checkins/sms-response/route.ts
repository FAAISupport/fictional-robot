import { smsResponseSchema } from "@/lib/validation/checkins";
import { processSmsResponse } from "@/services/checkins/checkin.service";
import { fail, ok } from "@/utils/api";

export async function POST(request: Request) {
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const parsed = smsResponseSchema.safeParse(raw);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid Twilio SMS payload", 422, parsed.error.flatten());
  }

  const result = await processSmsResponse({
    from: parsed.data.From,
    body: parsed.data.Body,
    payload: raw
  });

  return ok(result);
}
