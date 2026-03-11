import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { writeAuditLog } from "@/services/audit/audit.service";
import { sendSms } from "@/services/messaging/twilio.service";

interface TriggerEscalationInput {
  monitoredPersonId: string;
  checkinId?: string;
  reason: string;
  triggeredByProfileId?: string;
}

export async function triggerEscalation(input: TriggerEscalationInput) {
  const supabase = createSupabaseAdminClient();

  const { data: escalation, error } = await supabase
    .from("escalations")
    .insert({
      monitored_person_id: input.monitoredPersonId,
      checkin_id: input.checkinId ?? null,
      reason: input.reason,
      status: "pending"
    })
    .select("id, monitored_person_id, status, reason, triggered_at")
    .single();

  if (error || !escalation) {
    throw new Error(`escalation_trigger_failed:${error?.message}`);
  }

  const { data: guardians } = await supabase
    .from("guardian_network")
    .select("guardian_profile_id, priority_order")
    .eq("monitored_person_id", input.monitoredPersonId)
    .eq("active", true)
    .order("priority_order", { ascending: true });

  let stepOrder = 1;
  for (const guardian of guardians ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("id", guardian.guardian_profile_id)
      .single();

    await supabase.from("escalation_steps").insert({
      escalation_id: escalation.id,
      step_order: stepOrder,
      guardian_profile_id: guardian.guardian_profile_id,
      channel: profile?.phone ? "sms" : "app",
      delay_minutes: Math.max(0, (stepOrder - 1) * 5),
      execute_after: new Date(Date.now() + Math.max(0, (stepOrder - 1) * 5) * 60_000).toISOString(),
      requires_ack: true,
      ack_token: crypto.randomUUID()
    });

    stepOrder += 1;
  }

  await supabase.from("escalation_events").insert({
    escalation_id: escalation.id,
    event_type: "escalation_created",
    event_payload: {
      reason: input.reason,
      checkinId: input.checkinId ?? null,
      stepsPlanned: (guardians ?? []).length
    },
    created_by: input.triggeredByProfileId ?? null
  });

  await writeAuditLog({
    actorProfileId: input.triggeredByProfileId ?? null,
    action: "escalation.triggered",
    entityType: "escalations",
    entityId: escalation.id,
    context: { monitoredPersonId: input.monitoredPersonId, reason: input.reason }
  });

  return escalation;
}

export async function processEscalationSteps(nowIso?: string) {
  const supabase = createSupabaseAdminClient();
  const now = nowIso ?? new Date().toISOString();

  const { data: pendingSteps, error } = await supabase
    .from("escalation_steps")
    .select("id, escalation_id, step_order, guardian_profile_id, channel, ack_token")
    .eq("status", "pending")
    .lte("execute_after", now)
    .order("step_order", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`escalation_step_query_failed:${error.message}`);
  }

  let processed = 0;
  for (const step of pendingSteps ?? []) {
    const { data: escalation } = await supabase
      .from("escalations")
      .select("id, monitored_person_id, status")
      .eq("id", step.escalation_id)
      .single();

    if (!escalation || ["acknowledged", "resolved", "cancelled"].includes(escalation.status)) {
      await supabase.from("escalation_steps").update({ status: "skipped" }).eq("id", step.id);
      continue;
    }

    const { data: monitored } = await supabase
      .from("monitored_people")
      .select("id, preferred_name")
      .eq("id", escalation.monitored_person_id)
      .single();

    const { data: guardian } = await supabase
      .from("profiles")
      .select("id, phone")
      .eq("id", step.guardian_profile_id)
      .single();

    if (step.channel === "sms" && guardian?.phone) {
      const ackLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/escalations/acknowledge?token=${step.ack_token}`;
      await sendSms({
        to: guardian.phone,
        body: `LifeSignal alert: ${monitored?.preferred_name ?? "Your contact"} needs a check-in acknowledgment. ${ackLink}`,
        monitoredPersonId: monitored?.id,
        profileId: guardian.id,
        metadata: { escalationId: escalation.id, escalationStepId: step.id }
      });
    }

    await supabase.from("escalation_steps").update({ status: "sent", executed_at: now }).eq("id", step.id);
    await supabase
      .from("escalations")
      .update({ status: "in_progress" })
      .eq("id", escalation.id)
      .in("status", ["pending", "in_progress"]);

    await supabase.from("escalation_events").insert({
      escalation_id: escalation.id,
      escalation_step_id: step.id,
      event_type: "escalation_step_sent",
      event_payload: { stepOrder: step.step_order, channel: step.channel }
    });

    await writeAuditLog({
      action: "escalation.step_sent",
      entityType: "escalation_steps",
      entityId: step.id,
      context: { escalationId: escalation.id, stepOrder: step.step_order }
    });

    processed += 1;
  }

  return { processed };
}

export async function acknowledgeEscalationByToken(token: string, actorProfileId?: string) {
  const supabase = createSupabaseAdminClient();

  const { data: step } = await supabase
    .from("escalation_steps")
    .select("id, escalation_id, status")
    .eq("ack_token", token)
    .single();

  if (!step) {
    return { acknowledged: false, reason: "token_not_found" };
  }

  if (step.status === "acknowledged") {
    return { acknowledged: true, alreadyAcknowledged: true };
  }

  const now = new Date().toISOString();

  await supabase.from("escalation_steps").update({ status: "acknowledged" }).eq("id", step.id);
  await supabase
    .from("escalations")
    .update({ status: "acknowledged", acknowledged_at: now, acknowledged_by: actorProfileId ?? null })
    .eq("id", step.escalation_id)
    .in("status", ["pending", "in_progress"]);

  await supabase.from("escalation_events").insert({
    escalation_id: step.escalation_id,
    escalation_step_id: step.id,
    event_type: "escalation_acknowledged",
    event_payload: { tokenAcknowledged: true },
    created_by: actorProfileId ?? null
  });

  await writeAuditLog({
    actorProfileId: actorProfileId ?? null,
    action: "escalation.acknowledged",
    entityType: "escalations",
    entityId: step.escalation_id,
    context: { escalationStepId: step.id }
  });

  return { acknowledged: true, escalationId: step.escalation_id };
}
