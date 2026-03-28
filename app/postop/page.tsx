import Link from "next/link";

const outcomes = [
  "Daily post-discharge check-ins via SMS and voice",
  "Medication DONE confirmations with missed-dose alerts",
  "Pain, swelling, fever, nausea prompts by recovery day window",
  "Tiered escalation to caregivers/family/staff for symptom concern or no-response",
  "Readmission risk indicators with explainable drivers"
];

export default function PostOpMarketingPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-calm-700">LifeSignal PostOp</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">Post-discharge recovery monitoring that reduces blind spots.</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          Support patients across 7-day, 14-day, and 30-day windows with structured prompts, adherence tracking, and rapid escalation for concerning symptoms.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/demo-dashboards/postop" className="rounded-lg bg-calm-700 px-4 py-2 text-white">Open PostOp demo dashboard</Link>
          <Link href="/billing" className="rounded-lg border border-slate-300 px-4 py-2">View pricing</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <h2 className="text-2xl font-semibold text-slate-900">Hospital and care-team outcomes</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <li key={outcome} className="rounded-lg border border-slate-200 p-4 text-slate-700">{outcome}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
