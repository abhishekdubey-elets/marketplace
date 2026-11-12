"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Layers, Scale, Building2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { Aurora, CountUp, Spotlight, WordReveal } from "./motion-kit";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Hero for the public solutions directory, with live directory counts. */
export function SolutionsHero() {
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const listed = providers.filter((p) => p.accountStatus === "active" && p.categories.length > 0);
  const stats = [
    { icon: Building2, n: listed.length, label: "Listed providers" },
    { icon: BadgeCheck, n: listed.filter((p) => p.verification === "verified").length, label: "Elets verified" },
    { icon: Layers, n: categories.filter((c) => c.active).length, label: "Technology categories" },
  ];
  return (
    <section className="relative -mt-16 overflow-hidden border-b border-line pt-16">
      <Aurora />
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]" />
      <div className={cn(CONTAINER, "relative grid gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:pb-16")}>
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-flame-600">
              <span className="h-px w-5 bg-flame-500/70" /> Solution discovery
            </p>
          </Reveal>
          <h1 className="mt-4 text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] text-ink text-balance sm:text-[52px]">
            <WordReveal text="Explore technology" /> <WordReveal text="partners you can trust." delay={0.2} wordClassName="text-brand-gradient" />
          </h1>
          <Reveal delay={0.3}>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-3">
              Search by company, product, capability, industry or technology. Profiles marked Elets Verified have been reviewed by the Elets team, and paid listings never change the
              order.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-ink-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 shadow-xs backdrop-blur">
                <BadgeCheck className="size-3.5 fill-brand-600 text-white" /> Verification reviewed by Elets
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 shadow-xs backdrop-blur">
                <Scale className="size-3.5 text-flame-600" /> Ranking never paid
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-1.5 shadow-xs backdrop-blur">
                {industries.filter((i) => i.active).length} sectors served
              </span>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.25} y={20}>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <Spotlight key={s.label} className="rounded-2xl border border-line bg-white/85 p-4 shadow-card backdrop-blur">
                <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_14px_-6px_rgb(11_31_77/0.7)]">
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                  <s.icon className="relative size-4" />
                </span>
                <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.04em] text-navy-900">
                  <CountUp to={s.n} />
                </p>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-3">{s.label}</p>
              </Spotlight>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Closing band: post a requirement, or list a company. */
export function SolutionsCta() {
  return (
    <section className={cn(CONTAINER, "pb-20")}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-navy-950 p-8 text-white sm:p-10">
          <Aurora dark className="opacity-70" />
          <div className="dot-bg-dark pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(70%_80%_at_80%_50%,black,transparent)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-flame-300">Can&apos;t find the right fit?</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">Post a requirement and get matched automatically.</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-navy-300">Describe the problem and see explainable matches straight away. Technology companies can list their solutions for free.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" variant="flame" asChild>
                <Link href="/login?role=buyer&next=/buyer/requirements/new">
                  Post a requirement <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline-dark" asChild>
                <Link href="/signup?role=provider">List your company</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
