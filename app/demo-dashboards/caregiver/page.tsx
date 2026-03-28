const metrics = [
  ["Roster monitored", "58"],
  ["Alerts queue", "7"],
  ["Interventions due", "4"],
  ["Median response", "12 min"]
];

export default function CaregiverDemoDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Caregiver Operations Dashboard Demo</h1>
      <p className="mt-2 text-slate-600">Roster-level safety operations with intervention and response-time visibility.</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([name, value]) => (
          <article key={name} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{name}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Alerts queue</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>High Risk • Olivia F. • no response after 2 retries</li>
            <li>Elevated • Nathan B. • HELP inbound received via SMS</li>
            <li>Caution • Sara K. • late response trend increasing</li>
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Interventions queue</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Post-op Day 3 call-back due for Aaron T.</li>
            <li>Medication adherence coaching for Heidi M.</li>
            <li>Pastoral follow-up assignment for church member case #14.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
