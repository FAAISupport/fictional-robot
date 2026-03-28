import { smsResponseSchema } from "@/lib/validation/checkins";
import { processSmsResponse } from "@/services/checkins/checkin.service";

function xml(message: string) {
  return new Response(`<Response><Message>${message}</Message></Response>`, {
    headers: { "Content-Type": "text/xml" }
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const parsed = smsResponseSchema.safeParse(raw);

  if (!parsed.success) {
    return xml("We could not read your response. Reply YES, OK, DONE, or HELP.");
  }

  await processSmsResponse({
    from: parsed.data.From,
    body: parsed.data.Body,
    payload: raw
  });

  return xml("LifeSignal received your check-in response. Thank you.");
}
