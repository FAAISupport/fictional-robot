import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { fail, ok } from "@/utils/api";

const schema = z.object({ monitoredPersonId: z.string().uuid() });

export async function GET(request: Request) {
  const auth = await requireAuth(["caregiver", "guardian", "agency_staff", "agency_admin", "platform_admin"]);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const parsed = schema.safeParse({ monitoredPersonId: url.searchParams.get("monitoredPersonId") });
  if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid monitored person id", 422, parsed.error.flatten());

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("risk_snapshots")
    .select("*")
    .eq("monitored_person_id", parsed.data.monitoredPersonId)
    .order("snapshot_date", { ascending: false })
    .limit(30);

  return ok({ snapshots: data ?? [] });
}
