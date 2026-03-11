import { WaitlistJoinForm } from "@/components/waitlist/WaitlistJoinForm";
import { waitlistPublicLeaderboard, waitlistPublicStats } from "@/services/waitlist/waitlist.service";

export default async function WaitlistPage({
  searchParams
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const referralCode = params?.ref;
  const [stats, leaderboard] = await Promise.all([
    waitlistPublicStats(),
    waitlistPublicLeaderboard("all_time")
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h1 className="text-4xl font-semibold text-slate-900">Join the LifeSignal beta waitlist</h1>
          <p className="mt-3 text-slate-600">
            Help build a stronger safety network for people living alone. Invite family and neighbors to move up faster.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-semibold text-slate-900">{stats.totalPeople}</p>
              <p className="text-slate-600">Total joined</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-semibold text-slate-900">{stats.joinedThisWeek}</p>
              <p className="text-slate-600">This week</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-2xl font-semibold text-slate-900">{stats.referralsThisWeek}</p>
              <p className="text-slate-600">Referrals</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>Referral milestones</p>
            <ul className="mt-2 space-y-1">
              <li>• 1 referral = move up 5 spots</li>
              <li>• 3 referrals = early beta</li>
              <li>• 5 referrals = free month</li>
              <li>• 10 referrals = guaranteed beta access</li>
              <li>• 25 referrals = founder reward</li>
            </ul>
          </div>

          <WaitlistJoinForm referralCode={referralCode} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Top referrers</h2>
          <p className="mt-1 text-sm text-slate-600">Public leaderboard shows first name + last initial for privacy.</p>
          <ol className="mt-4 space-y-2">
            {leaderboard.slice(0, 10).map((row) => (
              <li key={`${row.rank}-${row.displayName}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-sm text-slate-800">
                  #{row.rank} {row.displayName}
                </p>
                <p className="text-sm text-slate-600">{row.referralCount} referrals</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
