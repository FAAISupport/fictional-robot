import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { CHURCH_MODULES, toChurchDemoSlug } from "@/lib/church/demo";
import { fail, ok } from "@/utils/api";

const schema = z.object({
  churchName: z.string().min(2),
  city: z.string().min(2),
  attendees: z.number().int().min(10).max(50000),
  pastors: z.number().int().min(1).max(500),
  modules: z.array(z.enum(CHURCH_MODULES)).min(1)
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Invalid church demo payload", 422, parsed.error.flatten());
  }

  const supabase = createSupabaseAdminClient();
  const slugBase = toChurchDemoSlug(parsed.data.churchName);
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;

  const generatedSummary = `${parsed.data.churchName} in ${parsed.data.city} can deploy ${parsed.data.modules.length} Church OS workflows to improve care coverage for ${parsed.data.attendees} weekly attendees with ${parsed.data.pastors} staff members.`;

  const { error } = await supabase.from("church_demo_configs").insert({
    slug,
    church_name: parsed.data.churchName,
    city: parsed.data.city,
    weekly_attendance: parsed.data.attendees,
    pastors_count: parsed.data.pastors,
    selected_modules: parsed.data.modules,
    generated_summary: generatedSummary
  });

  if (error) {
    return fail("DATABASE_ERROR", "Unable to save church demo configuration", 500, error.message);
  }

  return ok({ slug });
}
