"use client";

import { useMemo, useState } from "react";

interface JoinState {
  loading: boolean;
  error: string | null;
}

export function WaitlistJoinForm({ referralCode }: { referralCode?: string }) {
  const [state, setState] = useState<JoinState>({ loading: false, error: null });
  const defaultRelationship = useMemo(() => "caregiver", []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, error: null });

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      relationshipType: String(form.get("relationshipType") ?? defaultRelationship),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      referralCode: String(form.get("referralCode") ?? "") || undefined
    };

    const response = await fetch("/api/waitlist/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();
    if (!response.ok || !body?.ok) {
      setState({ loading: false, error: body?.error?.message ?? "Could not join waitlist." });
      return;
    }

    const email = encodeURIComponent(payload.email);
    window.location.href = `/waitlist/dashboard?email=${email}`;
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <input className="rounded-lg border p-3" name="name" placeholder="Full name" required />
      <input className="rounded-lg border p-3" name="email" placeholder="Email" type="email" required />
      <input className="rounded-lg border p-3" name="phone" placeholder="Phone" />
      <select className="rounded-lg border p-3" name="relationshipType" defaultValue={defaultRelationship}>
        <option value="self">Self</option>
        <option value="caregiver">Caregiver</option>
        <option value="facility">Facility</option>
        <option value="family">Family</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input className="rounded-lg border p-3" name="city" placeholder="City" />
        <input className="rounded-lg border p-3" name="state" placeholder="State" />
      </div>
      <input
        className="rounded-lg border p-3"
        name="referralCode"
        placeholder="Referral code (optional)"
        defaultValue={referralCode ?? ""}
      />

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={state.loading}
        className="rounded-lg bg-calm-700 px-4 py-3 text-white disabled:opacity-60"
      >
        {state.loading ? "Joining…" : "Join the beta waitlist"}
      </button>
    </form>
  );
}
