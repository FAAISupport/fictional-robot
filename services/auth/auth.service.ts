import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { writeAuditLog } from "@/services/audit/audit.service";
import type { AppRole } from "@/types/domain";

export async function bootstrapProfile(input: {
  profileId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: AppRole;
  timezone?: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: input.profileId,
        email: input.email,
        full_name: input.fullName,
        phone: input.phone ?? null,
        role: input.role,
        timezone: input.timezone ?? "UTC"
      },
      { onConflict: "id" }
    )
    .select("id,email,role")
    .single();

  if (error || !data) {
    throw new Error(`profile_bootstrap_failed:${error?.message}`);
  }

  await writeAuditLog({
    actorProfileId: input.profileId,
    action: "profile.bootstrap",
    entityType: "profiles",
    entityId: input.profileId,
    context: { role: input.role }
  });

  return data;
}
