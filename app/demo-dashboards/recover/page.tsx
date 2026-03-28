export default function RecoverDemoDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Recover Program Dashboard Demo</h1>
      <p className="mt-2 text-slate-600">Daily routine adherence with escalation-backed accountability for ongoing recovery programs.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Routine compliance</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Morning routine confirmations: 90%</li>
            <li>Evening reflection prompts: 83%</li>
            <li>Escalations requiring coach intervention: 5</li>
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Behavior trend markers</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Response-time trend: +6 minutes week-over-week</li>
            <li>Retry dependence: down 14% over 30 days</li>
            <li>Support touchpoints completed: 41 this week</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
