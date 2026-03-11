export default function WaitlistDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Waitlist dashboard</h1>
      <p className="mt-2 text-slate-600">
        Use <code>/api/waitlist/dashboard?email=...</code> to fetch your live position, referral link, and milestone progress.
      </p>
      <ul className="mt-4 list-disc pl-6 text-slate-700">
        <li>Waitlist position and spots gained</li>
        <li>Referral URL and referral count</li>
        <li>Leaderboard rank</li>
        <li>Beta eligibility state</li>
      </ul>
    </main>
  );
}
