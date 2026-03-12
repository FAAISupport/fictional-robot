import Link from "next/link";
import { notFound } from "next/navigation";
import { VERTICALS, type VerticalSlug } from "@/lib/marketing/verticals";
import { verticalDashboardData } from "@/services/dashboard/vertical-dashboard.service";

export default async function VerticalDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await verticalDashboardData(slug as VerticalSlug);

  if (!data) return notFound();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold text-slate-900">{data.definition.title}</h1>
        <p className="mt-2 text-slate-600">{data.definition.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {data.definition.outcomes.map((outcome) => (
            <span key={outcome} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {outcome}
            </span>
          ))}
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Monitored people" value={String(data.metrics.monitoredCount)} />
        <Metric label="7-day response rate" value={`${data.metrics.responseRate7d}%`} />
        <Metric label="Missed check-ins" value={String(data.metrics.missed7d)} />
        <Metric label="Escalations" value={String(data.metrics.escalations7d)} />
        <Metric label="Emergency events" value={String(data.metrics.emergencyEvents7d)} />
        <Metric label="Waitlist total" value={String(data.metrics.waitlistTotal)} />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-900">Operational actions</h2>
        <p className="mt-2 text-slate-600">Open the matching dashboard and active APIs for this vertical.</p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={data.definition.dashboardHref} className="rounded bg-calm-700 px-4 py-2 text-white">
            Open {data.definition.dashboardHref.replace("/", "")} dashboard
          </Link>
          <Link href="/waitlist" className="rounded border border-slate-300 px-4 py-2 text-slate-800">
            Join beta waitlist
          </Link>
          <Link href="/reports" className="rounded border border-slate-300 px-4 py-2 text-slate-800">
            View reports
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">All vertical dashboards</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {VERTICALS.map((v) => (
            <Link key={v.slug} href={`/verticals/${v.slug}`} className="rounded-lg border border-slate-200 p-3 hover:border-calm-500">
              <p className="font-medium text-slate-900">{v.title}</p>
              <p className="mt-1 text-sm text-slate-600">{v.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </article>
  );
}
