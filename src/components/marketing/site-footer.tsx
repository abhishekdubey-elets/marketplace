import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand";
import { SAMPLE_DATA } from "@/lib/seed";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore solutions", href: "/solutions" },
      { label: "Technology categories", href: "/#categories" },
      { label: "Industry verticals", href: "/#industries" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "For organisations",
    links: [
      { label: "Post a requirement", href: "/signup?role=buyer&next=/buyer/requirements/new" },
      { label: "Elets Pro — managed solutions", href: "/pro" },
      { label: "Buyer sign in", href: "/login?role=buyer" },
    ],
  },
  {
    title: "For providers",
    links: [
      { label: "List your company", href: "/signup?role=provider" },
      { label: "Get verified", href: "/login?role=provider&next=/provider/verification" },
      { label: "Provider sign in", href: "/login?role=provider" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-navy-300">
      <div className="dot-bg-dark pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="pointer-events-none absolute -left-40 top-0 size-[480px] rounded-full bg-flame-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[480px] rounded-full bg-brand-500/20 blur-[140px]" />
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-flame-500/60 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo dark size="lg" />
            <p className="mt-3 text-[11px] font-medium tracking-wide text-navy-400">
              Connect <span className="text-flame-500">•</span> Collaborate <span className="text-flame-500">•</span> Grow
            </p>
            <p className="mt-5 text-sm leading-relaxed">
              From relationships to opportunities. From opportunities to outcomes. A structured platform connecting public institutions and enterprises with verified technology
              providers.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-navy-400" />
                <a href="mailto:info@elets.in" className="transition hover:text-white">
                  info@elets.in
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-navy-400" />
                <a href="tel:+919910998068" className="transition hover:text-white">
                  +91 99109 98068
                </a>
              </li>
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
        <p aria-hidden className="pointer-events-none mt-16 select-none text-center text-[22vw] font-extrabold leading-[0.8] tracking-[-0.06em] text-transparent [background-image:linear-gradient(to_bottom,rgb(255_255_255/0.09),rgb(255_255_255/0))] [background-clip:text] lg:text-[240px]">
          elets
        </p>
        <div className="mt-2 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Elets Solution Marketplace. All rights reserved.</p>
          <Link href="/brand" className="transition hover:text-white">Brand assets</Link>
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
