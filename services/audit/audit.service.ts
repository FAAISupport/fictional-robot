import { createSupabaseAdminClient } from "@/lib/supabase/clients";

export async function writeAuditLog(input: {
  actorProfileId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  context?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_profile_id: input.actorProfileId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    context: input.context ?? {}
  });

  if (error) {
    throw new Error(`audit_log_failed:${error.message}`);
  }
}
