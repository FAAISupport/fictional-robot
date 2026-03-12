import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/waitlist", label: "Beta waitlist" },
      { href: "/billing", label: "Pricing" },
      { href: "/reports", label: "Reports" }
    ]
  },
  {
    title: "Dashboards",
    links: [
      { href: "/senior", label: "Senior" },
      { href: "/caregiver", label: "Caregiver" },
      { href: "/agency", label: "Agency" }
    ]
  },
  {
    title: "Verticals",
    links: [
      { href: "/verticals/seniors", label: "Seniors" },
      { href: "/verticals/home-health", label: "Home health" },
      { href: "/verticals/recovery", label: "Recovery" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-calm-700">LifeSignal</p>
          <p className="mt-2 text-sm text-slate-600">
            Safety check-ins, transparent escalation, and routine consistency insights.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{column.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-700 hover:text-slate-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} LifeSignal. Built with auditable, rules-based safety workflows.
      </div>
    </footer>
  );
}
