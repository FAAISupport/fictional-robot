export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-semibold text-slate-900">How LifeSignal works</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">1. We check in</h2>
          <p className="mt-2 text-slate-600">LifeSignal sends scheduled SMS and voice check-ins based on local time and care plan settings.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">2. They respond</h2>
          <p className="mt-2 text-slate-600">Reply YES by text or press 1 on voice calls. Every attempt and response is recorded and auditable.</p>
        </section>
        <section className="rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">3. We escalate if needed</h2>
          <p className="mt-2 text-slate-600">If check-ins are missed, configured contacts are notified in sequence until acknowledgement occurs.</p>
        </section>
      </div>
    </main>
  );
}
