const protocolRows = [
  { dayRange: "Day 1-3", prompts: "Pain, swelling, fever, nausea, medication DONE", cadence: "2x/day" },
  { dayRange: "Day 4-7", prompts: "Pain trend + incision concerns + medication DONE", cadence: "Daily" },
  { dayRange: "Day 8-14", prompts: "Mobility progress, symptom regression checks", cadence: "Daily" },
  { dayRange: "Day 15-30", prompts: "Adherence, pain stability, follow-up preparedness", cadence: "3x/week" }
];

export default function PostOpDemoDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">PostOp Recovery Dashboard Demo</h1>
      <p className="mt-2 text-slate-600">7/14/30-day recovery windows with symptom-triggered interventions and readmission risk indicators.</p>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Recovery protocol by surgery day range</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="pb-2 pr-6">Window</th>
                <th className="pb-2 pr-6">Structured prompts</th>
                <th className="pb-2">Check cadence</th>
              </tr>
            </thead>
            <tbody>
              {protocolRows.map((row) => (
                <tr key={row.dayRange} className="border-b border-slate-100">
                  <td className="py-3 pr-6 font-medium text-slate-900">{row.dayRange}</td>
                  <td className="py-3 pr-6 text-slate-700">{row.prompts}</td>
                  <td className="py-3 text-slate-700">{row.cadence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric title="Cohort adherence" value="88%" />
        <Metric title="Symptom concern events" value="9" />
        <Metric title="Readmission risk flagged" value="3" />
      </section>
    </main>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
