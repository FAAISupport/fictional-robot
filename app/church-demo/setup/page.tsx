"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CHURCH_MODULES, churchDemoTier } from "@/lib/church/demo";

export default function ChurchDemoSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [attendees, setAttendees] = useState(180);
  const [pastors, setPastors] = useState(4);
  const [modules, setModules] = useState<string[]>([...CHURCH_MODULES.slice(0, 3)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useMemo(() => churchDemoTier(attendees), [attendees]);

  function toggleModule(module: string) {
    setModules((prev) => (prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/church-demo/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ churchName, city, attendees, pastors, modules })
    });

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok || !data?.data?.slug) {
      setError(data?.error?.message ?? "Unable to generate demo");
      return;
    }

    router.push(`/church-demo/${data.data.slug}`);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Church OS Demo Builder</h1>
      <p className="mt-2 text-slate-600">Use this guided interview to generate a tailored ministry operations demo.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm font-medium text-calm-700">Step {step} of 3</p>

        {step === 1 && (
          <section className="space-y-4">
            <Input label="Church name" value={churchName} onChange={setChurchName} />
            <Input label="City" value={city} onChange={setCity} />
            <button type="button" className="rounded bg-calm-700 px-4 py-2 text-white" onClick={() => setStep(2)}>
              Continue
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <Range label="Average weekly attendance" value={attendees} setValue={setAttendees} min={25} max={2000} />
            <Range label="Pastoral + care staff" value={pastors} setValue={setPastors} min={1} max={40} />
            <div className="flex gap-3">
              <button type="button" className="rounded border border-slate-300 px-4 py-2" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="rounded bg-calm-700 px-4 py-2 text-white" onClick={() => setStep(3)}>
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <p className="text-sm text-slate-600">Select modules to highlight in the demo:</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {CHURCH_MODULES.map((module) => (
                <label key={module} className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm">
                  <input type="checkbox" checked={modules.includes(module)} onChange={() => toggleModule(module)} />
                  {module.replaceAll("_", " ")}
                </label>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-900">Estimated tier: {estimate.tier}</p>
              <p className="text-slate-700">Estimated monthly price: ${estimate.monthlyPrice}</p>
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <div className="mt-4 flex gap-3">
              <button type="button" className="rounded border border-slate-300 px-4 py-2" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="submit" disabled={saving} className="rounded bg-calm-700 px-4 py-2 text-white disabled:opacity-60">
                {saving ? "Building..." : "Generate custom demo"}
              </button>
            </div>
          </section>
        )}
      </form>
    </main>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" required />
    </label>
  );
}

function Range({ label, value, setValue, min, max }: { label: string; value: number; setValue: (value: number) => void; min: number; max: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-700">{label}: {value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => setValue(Number(event.target.value))} className="w-full" />
    </label>
  );
}
