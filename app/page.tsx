import Link from "next/link";
import { waitlistPublicStats } from "@/services/waitlist/waitlist.service";

export default async function HomePage() {
  const stats = await waitlistPublicStats();

  return (
    <main className="bg-white">
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-calm-700">LifeSignal</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 md:text-5xl">
            We check in. They respond. If not, we escalate.
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            Built for seniors, families, and care teams. LifeSignal runs SMS and voice wellness check-ins with transparent,
            auditable escalation paths.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/waitlist" className="rounded-lg bg-calm-700 px-5 py-3 text-white">
              Join beta waitlist
            </Link>
            <Link href="/how-it-works" className="rounded-lg border border-slate-300 px-5 py-3 text-slate-800">
              How it works
            </Link>
          </div>
          <div className="mt-6 flex gap-6 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{stats.totalPeople}</span> on waitlist
            </p>
            <p>
              <span className="font-semibold text-slate-900">{stats.joinedThisWeek}</span> joined this week
            </p>
            <p>
              <span className="font-semibold text-slate-900">{stats.referralsThisWeek}</span> referrals this week
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Built for no-app simplicity</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>• SMS reply YES or voice press 1 confirmation</li>
            <li>• Multi-step reminders and escalation routing</li>
            <li>• Guardian network with explicit acknowledgment links</li>
            <li>• Routine stability insights for caregivers and agencies</li>
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Link href="/senior" className="rounded bg-white px-3 py-2 text-center">
              Senior view
            </Link>
            <Link href="/caregiver" className="rounded bg-white px-3 py-2 text-center">
              Caregiver view
            </Link>
            <Link href="/agency" className="rounded bg-white px-3 py-2 text-center">
              Agency ops
            </Link>
            <Link href="/billing" className="rounded bg-white px-3 py-2 text-center">
              Billing plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
