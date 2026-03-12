import Twilio from "twilio";
import { env } from "@/lib/validation/env";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";

const twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendSms(input: {
  to: string;
  body: string;
  monitoredPersonId?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}) {
  const statusCallback = `${env.TWILIO_STATUS_CALLBACK_BASE_URL}/api/webhooks/twilio/status`;
  const result = await twilioClient.messages.create({
    to: input.to,
    body: input.body,
    messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
    statusCallback
  });

  const supabase = createSupabaseAdminClient();
  await supabase.from("communication_logs").insert({
    monitored_person_id: input.monitoredPersonId ?? null,
    profile_id: input.profileId ?? null,
    channel: "sms",
    direction: "outbound",
    provider: "twilio",
    provider_message_id: result.sid,
    status: result.status ?? "queued",
    content: input.body,
    metadata: input.metadata ?? {},
    occurred_at: new Date().toISOString()
  });

  return result;
}

export async function startVoiceCheckin(input: {
  to: string;
  monitoredPersonId?: string;
  profileId?: string;
  checkinId: string;
}) {
  const callbackBase = env.TWILIO_STATUS_CALLBACK_BASE_URL;
  const call = await twilioClient.calls.create({
    to: input.to,
    from: env.TWILIO_PHONE_NUMBER,
    url: `${callbackBase}/api/webhooks/twilio/voice?checkinId=${input.checkinId}`,
    statusCallback: `${callbackBase}/api/webhooks/twilio/status`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"]
  });

  const supabase = createSupabaseAdminClient();
  await supabase.from("communication_logs").insert({
    monitored_person_id: input.monitoredPersonId ?? null,
    profile_id: input.profileId ?? null,
    channel: "voice",
    direction: "outbound",
    provider: "twilio",
    provider_call_id: call.sid,
    status: call.status ?? "queued",
    content: "Voice check-in call initiated",
    metadata: { checkinId: input.checkinId },
    occurred_at: new Date().toISOString()
  });

  return call;
}

export async function logTwilioStatus(input: {
  messageSid?: string;
  callSid?: string;
  status: string;
  payload: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("communication_logs").insert({
    channel: input.callSid ? "voice" : "sms",
    direction: "inbound",
    provider: "twilio",
    provider_message_id: input.messageSid ?? null,
    provider_call_id: input.callSid ?? null,
    status: input.status,
    content: "Twilio status callback",
    metadata: input.payload,
    occurred_at: new Date().toISOString()
  });
}
