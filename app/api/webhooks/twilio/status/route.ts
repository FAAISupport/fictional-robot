import { logTwilioStatus } from "@/services/messaging/twilio.service";

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = Object.fromEntries(form.entries());
  await logTwilioStatus({
    messageSid: typeof payload.MessageSid === "string" ? payload.MessageSid : undefined,
    callSid: typeof payload.CallSid === "string" ? payload.CallSid : undefined,
    status:
      (typeof payload.MessageStatus === "string" ? payload.MessageStatus : undefined) ??
      (typeof payload.CallStatus === "string" ? payload.CallStatus : undefined) ??
      "unknown",
    payload
  });

  return new Response("ok", { status: 200 });
}
