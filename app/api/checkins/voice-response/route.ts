import { voiceResponseSchema } from "@/lib/validation/checkins";
import { processVoiceResponse } from "@/services/checkins/checkin.service";

function xml(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/xml" } });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const checkinId = url.searchParams.get("checkinId");
  if (!checkinId) {
    return xml("<Response><Say>Invalid check-in.</Say></Response>", 400);
  }

  const form = await request.formData();
  const raw = Object.fromEntries(form.entries());
  const parsed = voiceResponseSchema.safeParse(raw);

  if (!parsed.success) {
    return xml("<Response><Say>We could not process your response.</Say></Response>", 422);
  }

  const result = await processVoiceResponse({
    checkinId,
    digits: parsed.data.Digits,
    from: parsed.data.From,
    payload: raw
  });

  if (result.valid) {
    return xml("<Response><Say>Thank you. Your check in is confirmed.</Say></Response>");
  }

  return xml(
    `<Response>
      <Gather numDigits="1" action="/api/checkins/voice-response?checkinId=${checkinId}" method="POST">
        <Say>Please press 1 to confirm you are okay.</Say>
      </Gather>
      <Say>We did not receive a valid response.</Say>
    </Response>`
  );
}
