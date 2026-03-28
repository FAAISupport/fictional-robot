export default function ChurchOsDemoDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Church OS Dashboard Demo</h1>
      <p className="mt-2 text-slate-600">Member care monitoring, prayer intake, volunteer dispatch, and pastoral follow-up workflows.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat title="Members monitored" value="132" />
        <Stat title="Prayer requests open" value="18" />
        <Stat title="Volunteer assignments" value="24" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Ministry workflow queue</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Missed Sunday follow-up: 12 members</li>
            <li>Pastoral call prompts due today: 7</li>
            <li>Devotional check-ins unanswered: 15</li>
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Care summary report</h2>
          <p className="mt-3 text-sm text-slate-700">Weekly church care summary includes wellness response rates, prayer request resolution timing, and volunteer response SLA.</p>
        </article>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
