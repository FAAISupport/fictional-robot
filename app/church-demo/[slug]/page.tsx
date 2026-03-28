import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/clients";
import { churchDemoTier } from "@/lib/church/demo";

export const dynamic = "force-dynamic";

export default async function ChurchDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("church_demo_configs")
    .select("church_name, city, weekly_attendance, pastors_count, selected_modules, generated_summary")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) notFound();

  const estimate = churchDemoTier(data.weekly_attendance);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">{data.church_name} • Church OS Strategy Demo</h1>
      <p className="mt-2 text-slate-600">{data.city} • attendance {data.weekly_attendance} • pastors/staff {data.pastors_count}</p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Recommended plan</h2>
        <p className="mt-2 text-slate-700">{estimate.tier} • ${estimate.monthlyPrice}/month (estimated)</p>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Selected modules</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.selected_modules.map((module: string) => (
            <li key={module} className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {module.replaceAll("_", " ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Executive summary</h2>
        <p className="mt-2 text-slate-700">{data.generated_summary}</p>
      </section>
    </main>
  );
}
