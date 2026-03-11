import Link from "next/link";
import { waitlistDashboard } from "@/services/waitlist/waitlist.service";

function shareLink(type: "sms" | "email" | "whatsapp" | "facebook", url: string) {
  const encoded = encodeURIComponent(url);
  const message = encodeURIComponent(`Join me on the LifeSignal beta waitlist: ${url}`);

  if (type === "sms") return `sms:?&body=${message}`;
  if (type === "email") return `mailto:?subject=LifeSignal beta invite&body=${message}`;
  if (type === "whatsapp") return `https://wa.me/?text=${message}`;
  return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
}

export default async function WaitlistDashboardPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;

  if (!params?.email) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Waitlist dashboard</h1>
        <p className="mt-2 text-slate-600">Open this page with <code>?email=you@example.com</code> after joining.</p>
      </main>
    );
  }

  const data = await waitlistDashboard(params.email);
  if (!data) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-slate-700">No waitlist user found for {params.email}.</p>
        <Link href="/waitlist" className="mt-3 inline-block rounded bg-calm-700 px-4 py-2 text-white">Join waitlist</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome, {data.name}</h1>
      <p className="mt-1 text-slate-600">Share your referral link to move up the list.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Position" value={String(data.waitlistPosition)} />
        <Stat label="Referrals" value={String(data.referral_count)} />
        <Stat label="Spots gained" value={String(data.spots_gained)} />
        <Stat label="Beta status" value={String(data.beta_eligibility)} />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Your referral URL</h2>
        <p className="mt-2 rounded bg-slate-50 p-3 text-sm text-slate-700 break-all">{data.referralUrl}</p>
        <p className="mt-2 text-sm text-slate-600">Next milestone: {data.nextMilestone}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded border px-3 py-2 text-sm" href={shareLink("sms", data.referralUrl)}>Share by SMS</a>
          <a className="rounded border px-3 py-2 text-sm" href={shareLink("email", data.referralUrl)}>Share by Email</a>
          <a className="rounded border px-3 py-2 text-sm" href={shareLink("whatsapp", data.referralUrl)} target="_blank">WhatsApp</a>
          <a className="rounded border px-3 py-2 text-sm" href={shareLink("facebook", data.referralUrl)} target="_blank">Facebook</a>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Invite history</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {data.inviteHistory.length === 0 ? <li>No referrals yet.</li> : null}
          {data.inviteHistory.map((entry) => (
            <li key={entry.referred_waitlist_user_id} className="rounded bg-slate-50 px-3 py-2">
              Referral recorded on {new Date(entry.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
