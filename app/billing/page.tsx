export default function BillingPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
      <p className="mt-2 text-slate-600">Use checkout and billing portal APIs to manage Family, Caregiver, and Enterprise plans.</p>
      <ul className="mt-4 list-disc pl-6 text-slate-700">
        <li>POST /api/billing/checkout with plan</li>
        <li>POST /api/billing/portal for subscription management</li>
        <li>Stripe webhook endpoint: POST /api/webhooks/stripe</li>
      </ul>
    </main>
  );
}
