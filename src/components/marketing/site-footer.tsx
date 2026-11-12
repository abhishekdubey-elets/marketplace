import Link from "next/link";
import { MapPin } from "lucide-react";
import { LogoMark } from "@/components/brand";
import { SAMPLE_DATA } from "@/lib/seed";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore solutions", href: "/solutions" },
      { label: "Technology categories", href: "/#categories" },
      { label: "Industry verticals", href: "/#industries" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    title: "For organisations",
    links: [
      { label: "Post a requirement", href: "/login?role=buyer&next=/buyer/requirements/new" },
      { label: "Elets Pro — managed solutions", href: "/pro" },
      { label: "Buyer sign in", href: "/login?role=buyer" },
    ],
  },
  {
    title: "For providers",
    links: [
      { label: "List your company", href: "/login?role=provider" },
      { label: "Get verified", href: "/login?role=provider&next=/provider/verification" },
      { label: "Provider sign in", href: "/login?role=provider" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-300">
      <div className="grid-bg-dark pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Elets Solution Marketplace home">
              <LogoMark />
              <span className="leading-none">
                <span className="block text-[15px] font-semibold tracking-tight text-white">Elets</span>
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-navy-400">Solution Marketplace</span>
              </span>
            </Link>
            <p className="mt-5 text-sm leading-relaxed">
              From relationships to opportunities. From opportunities to outcomes. A structured platform connecting public institutions and enterprises with verified technology
              providers.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-navy-400" />
                <span>India</span>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((c) => (
              <div key={c.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm transition hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Elets Solution Marketplace. All rights reserved.</p>
          {SAMPLE_DATA && (
            <p className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Demo environment — all organisations, people and data shown are fictional.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
