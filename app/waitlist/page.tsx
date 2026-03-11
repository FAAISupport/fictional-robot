export default function WaitlistPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold text-slate-900">Join the LifeSignal beta waitlist</h1>
      <p className="mt-3 text-slate-600">
        Invite guardians and friends to move up. 1 referral = 5 spots gained. 3 referrals unlock early beta.
      </p>
      <form className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <input className="rounded border p-3" name="name" placeholder="Full name" />
        <input className="rounded border p-3" name="email" placeholder="Email" />
        <input className="rounded border p-3" name="phone" placeholder="Phone" />
        <input className="rounded border p-3" name="relationshipType" placeholder="Self, caregiver, facility..." />
        <div className="grid grid-cols-2 gap-3">
          <input className="rounded border p-3" name="city" placeholder="City" />
          <input className="rounded border p-3" name="state" placeholder="State" />
        </div>
        <input className="rounded border p-3" name="referralCode" placeholder="Referral code (optional)" />
        <p className="text-sm text-slate-500">Submit to <code>/api/waitlist/join</code> as JSON in your client integration.</p>
      </form>
    </main>
  );
}
