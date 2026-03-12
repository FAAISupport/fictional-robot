import Link from "next/link";

const navItems = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/verticals/seniors", label: "Verticals" },
  { href: "/waitlist", label: "Beta waitlist" },
  { href: "/reports", label: "Reports" },
  { href: "/billing", label: "Pricing" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-semibold text-calm-700">
          LifeSignal
        </Link>
        <nav className="hidden gap-5 text-sm text-slate-700 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex gap-2">
          <Link href="/waitlist" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800">
            Join beta
          </Link>
          <Link href="/caregiver" className="rounded-lg bg-calm-700 px-3 py-2 text-sm text-white">
            Open app
          </Link>
        </div>
      </div>
    </header>
  );
}
