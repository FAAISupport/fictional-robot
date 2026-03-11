import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { writeAuditLog } from "@/services/audit/audit.service";

export async function confirmMedicationLog(input: {
  medicationLogId: string;
  actorProfileId?: string;
  source: "sms" | "voice" | "dashboard" | "caregiver";
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("medication_logs")
    .update({ status: "confirmed", confirmed_at: now, confirmation_source: input.source })
    .eq("id", input.medicationLogId)
    .select("id, monitored_person_id")
    .single();

  if (error || !data) {
    throw new Error(`medication_confirm_failed:${error?.message}`);
  }

  await writeAuditLog({
    actorProfileId: input.actorProfileId ?? null,
    action: "medication.confirmed",
    entityType: "medication_logs",
    entityId: data.id,
    context: { source: input.source }
  });

  return data;
}

export async function confirmRecoveryCheckin(input: {
  recoveryCheckinId: string;
  actorProfileId?: string;
  responseChannel: "sms" | "voice" | "app";
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("recovery_checkins")
    .update({ status: "responded", responded_at: now, response_channel: input.responseChannel })
    .eq("id", input.recoveryCheckinId)
    .select("id, monitored_person_id")
    .single();

  if (error || !data) {
    throw new Error(`recovery_confirm_failed:${error?.message}`);
  }

  await writeAuditLog({
    actorProfileId: input.actorProfileId ?? null,
    action: "recovery.confirmed",
    entityType: "recovery_checkins",
    entityId: data.id,
    context: { responseChannel: input.responseChannel }
  });

  return data;
}

export async function triggerEmergencyEvent(input: {
  monitoredPersonId: string;
  actorProfileId?: string;
  triggerSource: "sms" | "voice" | "dashboard" | "caregiver" | "automatic";
  details?: string;
}) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("emergency_events")
    .insert({
      monitored_person_id: input.monitoredPersonId,
      triggered_by: input.actorProfileId ?? null,
      trigger_source: input.triggerSource,
      status: "triggered",
      details: input.details ?? null
    })
    .select("id, monitored_person_id, status, created_at")
    .single();

  if (error || !data) {
    throw new Error(`emergency_trigger_failed:${error?.message}`);
  }

  await writeAuditLog({
    actorProfileId: input.actorProfileId ?? null,
    action: "emergency.triggered",
    entityType: "emergency_events",
    entityId: data.id,
    context: { triggerSource: input.triggerSource }
  });

  return data;
}
