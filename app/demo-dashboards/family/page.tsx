import Link from "next/link";

const cards = [
  { title: "Peace-of-mind score", value: "92 / 100", note: "Stable routine across monitored family members" },
  { title: "Active guardians", value: "11", note: "Receiving escalation notifications" },
  { title: "Open escalations", value: "2", note: "1 acknowledged, 1 waiting for callback" },
  { title: "7-day check-in completion", value: "96%", note: "High consistency for morning check-ins" }
];

export default function FamilyDemoDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Family / Senior Safety Dashboard Demo</h1>
      <p className="mt-2 text-slate-600">Track daily confirmations, open alerts, and family-visible escalation outcomes.</p>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-600">{card.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Recent timeline</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>08:45 AM • YES response from Eleanor G. (SMS)</li>
          <li>09:10 AM • Retry #1 sent to Marcus D. due to no response</li>
          <li>09:25 AM • Escalation opened for Marcus D., guardian notified</li>
          <li>09:31 AM • Guardian acknowledged and marked member safe</li>
        </ul>
      </section>

      <div className="mt-8">
        <Link href="/caregiver" className="rounded-lg bg-calm-700 px-4 py-2 text-white">
          Open production caregiver app
        </Link>
      </div>
    </main>
  );
}
