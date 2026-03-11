import type { ReactNode } from "react";

export function StatusCard({ title, value, description }: { title: string; value: string; description: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</h2>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <div className="mt-2 text-sm text-slate-600">{description}</div>
    </section>
  );
}
