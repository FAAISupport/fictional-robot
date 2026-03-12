import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { sendSms, startVoiceCheckin } from "@/services/messaging/twilio.service";
import { writeAuditLog } from "@/services/audit/audit.service";

interface MaterializeInput {
  windowStart: string;
  windowEnd: string;
}

export async function materializeCheckins(input: MaterializeInput) {
  const supabase = createSupabaseAdminClient();
  const start = new Date(input.windowStart);
  const end = new Date(input.windowEnd);

  const { data: schedules, error: schedulesError } = await supabase
    .from("schedules")
    .select("id, monitored_person_id, channels, local_time, grace_minutes, timezone, active")
    .eq("active", true);

  if (schedulesError) {
    throw new Error(`schedule_query_failed:${schedulesError.message}`);
  }

  let created = 0;
  for (const schedule of schedules ?? []) {
    const now = new Date();
    if (now < start || now > end) {
      continue;
    }

    const expectedAt = now.toISOString();
    const dueAt = new Date(now.getTime() + (schedule.grace_minutes ?? 15) * 60_000).toISOString();

    const { data: existing } = await supabase
      .from("checkins")
      .select("id")
      .eq("schedule_id", schedule.id)
      .gte("expected_at", start.toISOString())
      .lt("expected_at", end.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      continue;
    }

    const channelPreference = Array.isArray(schedule.channels) && schedule.channels.includes("sms") ? "sms" : "voice";
    const { error: insertError } = await supabase.from("checkins").insert({
      monitored_person_id: schedule.monitored_person_id,
      schedule_id: schedule.id,
      expected_at: expectedAt,
      due_at: dueAt,
      status: "pending",
      channel_preference: channelPreference
    });

    if (!insertError) {
      created += 1;
      await writeAuditLog({
        action: "checkin.materialized",
        entityType: "checkins",
        context: { scheduleId: schedule.id, monitoredPersonId: schedule.monitored_person_id, expectedAt }
      });
    }
  }

  return { created };
}

export async function processPendingCheckins(nowIso?: string) {
  const supabase = createSupabaseAdminClient();
  const now = nowIso ? new Date(nowIso) : new Date();

  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("id, monitored_person_id, status, attempts_used, channel_preference, due_at")
    .in("status", ["pending", "in_progress"])
    .lte("expected_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(200);

  if (error) {
    throw new Error(`checkin_query_failed:${error.message}`);
  }

  let processed = 0;

  for (const checkin of checkins ?? []) {
    const { data: mp } = await supabase
      .from("monitored_people")
      .select("id, profile_id, preferred_name, phone")
      .eq("id", checkin.monitored_person_id)
      .single();

    if (!mp?.phone) {
      continue;
    }

    const attemptNumber = (checkin.attempts_used ?? 0) + 1;
    const message = `LifeSignal check-in for ${mp.preferred_name ?? "you"}. Reply YES if you are okay.`;

    if (checkin.channel_preference === "sms") {
      const sms = await sendSms({
        to: mp.phone,
        body: message,
        monitoredPersonId: mp.id,
        profileId: mp.profile_id,
        metadata: { checkinId: checkin.id, attemptNumber }
      });

      await supabase.from("checkin_attempts").insert({
        checkin_id: checkin.id,
        attempt_number: attemptNumber,
        channel: "sms",
        status: "sent",
        provider_message_id: sms.sid
      });
    } else {
      const call = await startVoiceCheckin({
        to: mp.phone,
        monitoredPersonId: mp.id,
        profileId: mp.profile_id,
        checkinId: checkin.id
      });

      await supabase.from("checkin_attempts").insert({
        checkin_id: checkin.id,
        attempt_number: attemptNumber,
        channel: "voice",
        status: "sent",
        provider_call_id: call.sid
      });
    }

    await supabase
      .from("checkins")
      .update({ status: "in_progress", attempts_used: attemptNumber })
      .eq("id", checkin.id);

    await writeAuditLog({
      action: "checkin.attempt_sent",
      entityType: "checkins",
      entityId: checkin.id,
      context: { attemptNumber, channel: checkin.channel_preference }
    });

    processed += 1;
  }

  const { data: overdue } = await supabase
    .from("checkins")
    .select("id, monitored_person_id")
    .in("status", ["pending", "in_progress"])
    .lt("due_at", now.toISOString())
    .limit(200);

  for (const late of overdue ?? []) {
    await supabase.from("checkins").update({ status: "missed", closed_reason: "due_window_expired" }).eq("id", late.id);

    await supabase.from("escalations").insert({
      monitored_person_id: late.monitored_person_id,
      checkin_id: late.id,
      status: "pending",
      reason: "missed_checkin"
    });

    await writeAuditLog({
      action: "checkin.missed",
      entityType: "checkins",
      entityId: late.id,
      context: { reason: "due_window_expired" }
    });
  }

  return { processed, escalationsCreated: overdue?.length ?? 0 };
}

export async function processSmsResponse(input: { from: string; body: string; payload: Record<string, unknown> }) {
  const supabase = createSupabaseAdminClient();

  const { data: person } = await supabase
    .from("monitored_people")
    .select("id")
    .eq("phone", input.from)
    .single();

  if (!person) {
    return { matched: false };
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select("id, expected_at")
    .eq("monitored_person_id", person.id)
    .in("status", ["pending", "in_progress"])
    .order("expected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkin) {
    return { matched: false };
  }

  const normalized = input.body.trim().toUpperCase();
  const valid = ["YES", "Y", "OK", "I'M OK", "IM OK"].includes(normalized);

  await supabase.from("checkin_responses").insert({
    checkin_id: checkin.id,
    channel: "sms",
    raw_payload: input.payload,
    normalized_response: normalized,
    is_valid: valid,
    source_contact: input.from
  });

  if (valid) {
    const expected = new Date(checkin.expected_at).getTime();
    const now = Date.now();
    const latency = Math.max(0, Math.round((now - expected) / 60000));

    await supabase
      .from("checkins")
      .update({
        status: "responded",
        responded_at: new Date().toISOString(),
        response_source: "sms",
        response_latency_minutes: latency,
        closed_reason: "affirmed"
      })
      .eq("id", checkin.id)
      .in("status", ["pending", "in_progress"]);

    await writeAuditLog({
      action: "checkin.responded",
      entityType: "checkins",
      entityId: checkin.id,
      context: { channel: "sms", latency }
    });
  }

  return { matched: true, valid };
}

export async function processVoiceResponse(input: {
  checkinId: string;
  digits?: string;
  from?: string;
  payload: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const valid = input.digits === "1";

  await supabase.from("checkin_responses").insert({
    checkin_id: input.checkinId,
    channel: "voice",
    raw_payload: input.payload,
    normalized_response: input.digits ?? "",
    is_valid: valid,
    source_contact: input.from ?? null
  });

  if (valid) {
    const { data: checkin } = await supabase.from("checkins").select("expected_at").eq("id", input.checkinId).single();
    const latency = checkin?.expected_at
      ? Math.max(0, Math.round((Date.now() - new Date(checkin.expected_at).getTime()) / 60000))
      : null;

    await supabase
      .from("checkins")
      .update({
        status: "responded",
        responded_at: new Date().toISOString(),
        response_source: "voice",
        response_latency_minutes: latency,
        closed_reason: "affirmed"
      })
      .eq("id", input.checkinId)
      .in("status", ["pending", "in_progress"]);

    await writeAuditLog({
      action: "checkin.responded",
      entityType: "checkins",
      entityId: input.checkinId,
      context: { channel: "voice", digits: input.digits }
    });
  }

  return { valid };
}
