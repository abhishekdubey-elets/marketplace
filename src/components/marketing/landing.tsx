"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Compass,
  FileSearch,
  Gauge,
  Handshake,
  Layers,
  Megaphone,
  Network,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Workflow,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PRO_MODULES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DynIcon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/controls";
import { ProviderCard } from "@/components/shared/domain";
import { HeroVisual } from "./hero-visual";
import { Reveal, SectionHeading } from "./reveal";
import { PRO_MODULE_ICONS } from "./pro-modules";

const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export function Landing() {
  const content = useStore((s) => s.content);
  const on = (k: string) => content.sections[k] !== false;
  return (
    <>
      <Hero />
      {on("ecosystem") && <Ecosystem />}
      {on("howItWorks") && <HowItWorks />}
      {on("categories") && <Categories />}
      {on("providers") && <Providers />}
      {on("postRequirement") && <PostRequirement />}
      {on("pro") && <ProBand />}
      {on("whyElets") && <WhyElets />}
      {on("verticals") && <Verticals />}
      <FinalCta />
    </>
  );
}

// ------------------------------------------------------------------ 1. Hero

function Hero() {
  const content = useStore((s) => s.content);
  const [first, ...rest] = content.heroHeadline.split(". ");
  const second = rest.join(". ");
  return (
    <section className="relative -mt-16 overflow-x-clip pt-16">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] max-w-full -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_0%,rgb(53_101_251/0.12),transparent)]" />
      <div className={cn(CONTAINER, "relative grid items-center gap-14 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32")}>
        <div>
          <Reveal>
            <Link
              href="/pro"
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-xs font-medium text-ink-2 shadow-xs transition hover:border-line-strong"
            >
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">New</span>
              Introducing Elets Pro managed solutions
              <ArrowRight className="size-3.5 text-ink-4 transition group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink text-balance sm:text-[54px] lg:text-[60px]">
              {first}
              {second && "."}{" "}
              {second && <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 bg-clip-text text-transparent">{second}</span>}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-3">{content.heroSubtext}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/solutions">
                  Explore Solutions <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup?role=provider">List Your Company</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-ink-2">
                <Link href="/pro">
                  <Sparkles className="text-accent-500" /> Explore Elets Pro
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-3">
              {["Verified providers", "Explainable 8-dimension matching", "Introductions curated by Elets"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <span className="grid size-4 place-items-center rounded-full bg-accent-100 text-accent-700">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.15} y={24}>
          <HeroVisual />
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 2. Ecosystem

const STRENGTHS = [
  { icon: Megaphone, title: "Media & publications", body: "Long-standing editorial presence across e-governance, healthcare, education and BFSI technology." },
  { icon: CalendarDays, title: "Events & summits", body: "Industry forums that already bring technology leaders and institutional decision-makers into the same room." },
  { icon: Building2, title: "Public sector relationships", body: "Working relationships with government departments, missions and public-sector organisations." },
  { icon: Briefcase, title: "Technology company network", body: "Established connections with technology companies, solution providers and implementation partners." },
  { icon: Users, title: "Decision-maker access", body: "Trusted access to CIOs, programme heads and institutional stakeholders across sectors." },
  { icon: Network, title: "Institutional credibility", body: "A recognised name in India's B2B technology ecosystem — now structured into a platform." },
];

function Ecosystem() {
  const industries = useStore((s) => s.industries).filter((i) => i.active);
  return (
    <section id="ecosystem" className="border-y border-line bg-canvas py-20 sm:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Trusted industry ecosystem"
          title="Not another marketplace from scratch. A platform built on relationships Elets already has."
          description="Elets is productising its existing industry network — turning trusted connections into structured technology opportunities and measurable outcomes."
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {STRENGTHS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.04} className="bg-white p-6">
              <span className="grid size-10 place-items-center rounded-xl border border-line bg-gradient-to-b from-white to-subtle text-brand-600 shadow-xs">
                <s.icon className="size-[18px]" />
              </span>
              <p className="mt-4 text-[15px] font-semibold text-ink">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{s.body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-xs font-medium text-ink-4">Sectors served</span>
          {industries.map((i) => (
            <span key={i.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[13px] font-medium text-ink-2 shadow-xs">
              <DynIcon name={i.icon} className="size-3.5 text-ink-4" />
              {i.name}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 3. How it works

const STEPS = [
  { icon: ClipboardList, who: "Buyer", title: "Share a requirement", body: "Describe the problem, sector, budget range and timeline through a guided brief." },
  { icon: Workflow, who: "Elets", title: "Elets structures it", body: "A relationship manager reviews and structures the brief into a clear technology requirement." },
  { icon: Gauge, who: "Platform", title: "Explainable matching", body: "Providers are scored across eight transparent dimensions — and reviewed by Elets before you see them." },
  { icon: Handshake, who: "Elets", title: "Curated introductions", body: "Shortlist providers, request introductions and schedule meetings — coordinated by Elets." },
  { icon: Trophy, who: "Outcome", title: "Move to an outcome", body: "Track evaluation and negotiation through to a completed engagement and post-award review." },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="How the marketplace works"
          title="From a requirement to the right partner, in five structured steps"
          description="Every requirement follows a clear, trackable journey — so buyers always know where things stand."
        />
        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-line-strong to-transparent lg:block" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <div className="relative h-full">
                  <div className="relative z-10 mx-auto mb-5 hidden size-12 place-items-center rounded-full border border-line bg-white shadow-raised lg:grid">
                    <s.icon className="size-5 text-brand-600" />
                    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-navy-900 text-[10px] font-semibold text-white">{i + 1}</span>
                  </div>
                  <div className="h-full rounded-2xl border border-line bg-white p-5 shadow-card">
                    <div className="flex items-center justify-between lg:justify-center">
                      <span className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600 lg:hidden">
                        <s.icon className="size-4" />
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          s.who === "Elets" ? "bg-accent-50 text-accent-700" : s.who === "Buyer" ? "bg-brand-50 text-brand-700" : "bg-navy-50 text-ink-3",
                        )}
                      >
                        {s.who}
                      </span>
                    </div>
                    <p className="mt-3 text-[15px] font-semibold text-ink lg:text-center">{s.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3 lg:text-center">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 4. Categories

function Categories() {
  const content = useStore((s) => s.content);
  const categories = useStore((s) => s.categories);
  const providers = useStore((s) => s.providers);
  const list = content.featuredCategoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c && c.active);
  const count = (id: string) => providers.filter((p) => p.accountStatus === "active" && p.categories.includes(id)).length;
  return (
    <section id="categories" className="scroll-mt-20 bg-canvas py-20 sm:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Explore technology categories"
          title="Every major enterprise technology, in one structured catalogue"
          action={
            <Button variant="secondary" asChild>
              <Link href="/solutions">
                Browse all solutions <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((c, i) => (
            <Reveal key={c.id} delay={(i % 4) * 0.04}>
              <Link
                href={`/solutions?category=${c.id}`}
                className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <DynIcon name={c.icon} className="size-[18px]" />
                  </span>
                  <ArrowUpRight className="size-4 text-ink-4 opacity-0 transition group-hover:opacity-100" />
                </div>
                <p className="mt-4 text-[15px] font-semibold leading-snug text-ink">{c.name}</p>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-3">{c.description}</p>
                <p className="mt-4 text-xs font-medium text-ink-4">{count(c.id)} providers listed</p>
              </Link>
            </Reveal>
          ))}
          <Reveal>
            <Link
              href="/login?role=buyer&next=/buyer/requirements/new"
              className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-line-strong bg-white/60 p-5 transition hover:border-brand-300 hover:bg-white"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-navy-50 text-navy-600">
                <Compass className="size-[18px]" />
              </span>
              <div>
                <p className="mt-4 text-[15px] font-semibold text-ink">Not sure where it fits?</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">Describe the problem — Elets will structure it into the right category.</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                  Post a requirement <ArrowRight className="size-3.5" />
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 5. Providers

function Providers() {
  const content = useStore((s) => s.content);
  const providers = useStore((s) => s.providers);
  const list = content.featuredProviderIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && p.accountStatus === "active");
  return (
    <section id="providers" className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Discover verified solution providers"
          title="Technology partners reviewed by the Elets team"
          description="Verification is earned through document and reference review — it can't be bought. Featured placement is shown transparently and never affects match rankings."
          action={
            <Button variant="secondary" asChild>
              <Link href="/solutions">
                View all providers <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.05}>
              <ProviderCard provider={p} href={`/providers/${p.slug}`} showActions={false} className="h-full" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 6. Post requirement

function PostRequirement() {
  return (
    <section className="pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-brand-50/70 via-white to-accent-50/50 p-6 sm:p-10 lg:p-14">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Post your technology requirement</p>
              <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-ink text-balance sm:text-[34px]">Tell us the problem. We&apos;ll help you find the right partners.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
                A guided nine-step brief captures what matters — sector, technology, budget range, timeline, deployment and compliance. Most fields are optional; Elets fills the gaps with
                you.
              </p>
              <ul className="mt-6 space-y-2.5">
                {["Reviewed and structured by an Elets relationship manager", "Matched only against eligible, reviewed providers", "Track every stage from submission to completion"].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-ink-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/login?role=buyer&next=/buyer/requirements/new">
                    Post a requirement <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/pro">Get managed support</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-line bg-white p-5 shadow-overlay sm:p-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-3">Step 3 of 9</span>
                  <span className="font-medium text-brand-600">Technology category</span>
                </div>
                <Progress value={33} className="mt-2" />
                <p className="mt-5 text-[15px] font-semibold text-ink">What kind of technology do you need?</p>
                <p className="mt-1 text-xs text-ink-3">Pick the closest fit — you can refine it later with Elets.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { n: "Healthcare Technology", i: "Stethoscope", on: true },
                    { n: "Cloud & Infrastructure", i: "Cloud" },
                    { n: "Cybersecurity", i: "ShieldCheck" },
                    { n: "Data Analytics", i: "ChartLine" },
                  ].map((o) => (
                    <div
                      key={o.n}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2.5 text-[12px] font-medium",
                        o.on ? "border-brand-500 bg-brand-50/60 text-ink ring-4 ring-brand-100" : "border-line text-ink-2",
                      )}
                    >
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", o.on ? "bg-brand-600 text-white" : "bg-navy-50 text-navy-600")}>
                        <DynIcon name={o.i} className="size-3.5" />
                      </span>
                      <span className="truncate">{o.n}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-xs text-ink-4">Saved as draft</span>
                  <Button size="sm" asChild>
                    <Link href="/login?role=buyer&next=/buyer/requirements/new">
                      Continue <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 7. Elets Pro band

function ProBand() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
      <div className="grid-bg-dark pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -right-40 top-0 size-[520px] rounded-full bg-brand-600/25 blur-[140px]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 size-[420px] rounded-full bg-accent-500/15 blur-[140px]" />
      <div className={cn(CONTAINER, "relative")}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-accent-300">
              <Sparkles className="size-3.5" /> Introducing Elets Pro
            </p>
            <h2 className="mt-5 text-[30px] font-semibold leading-[1.12] tracking-tight text-balance sm:text-[40px]">More than introductions. Managed support through the whole selection journey.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-300">
              A conventional marketplace stops at the introduction. Elets Pro assigns a relationship manager and a structured eight-stage process — from defining the requirement to
              reviewing the outcome after award.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="white" asChild>
                <Link href="/pro">
                  Explore Elets Pro <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline-dark" asChild>
                <Link href="/login?role=buyer&next=/buyer/pro">Request assistance</Link>
              </Button>
            </div>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRO_MODULES.map((m, i) => {
              const I = PRO_MODULE_ICONS[m.key];
              return (
                <Reveal key={m.key} delay={i * 0.04}>
                  <div className="group flex h-full items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:border-white/20 hover:bg-white/[0.07]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-white/0 text-accent-300">
                      <I className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-navy-400">Stage {i + 1}</span>
                      <span className="block truncate text-sm font-medium text-white">{m.name}</span>
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 8. Why Elets

const WHY = [
  { icon: BadgeCheck, title: "Verified, not just listed", body: "Providers carry a verified badge only after Elets reviews documents, certifications and references." },
  { icon: Scale, title: "Rankings that can't be bought", body: "Paid listing packages are kept separate from the matching engine. Scores reflect fit — nothing else.", highlight: true },
  { icon: Gauge, title: "Explainable recommendations", body: "Every match shows its eight-dimension breakdown, the reasons it was recommended and the points to verify." },
  { icon: Users, title: "A human in the loop", body: "Elets reviews every match before buyers see it, and coordinates every introduction personally." },
  { icon: Network, title: "An existing, trusted network", body: "Built on relationships Elets has developed across government, healthcare, education and BFSI." },
  { icon: ShieldCheck, title: "Managed when it matters", body: "Elets Pro adds structured support for complex procurement — from RFP drafting to negotiation." },
];

function WhyElets() {
  return (
    <section className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading align="center" eyebrow="Why choose Elets" title="Built for trust, transparency and outcomes" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={(i % 3) * 0.05}>
              <div
                className={cn(
                  "h-full rounded-2xl border p-6 transition",
                  w.highlight ? "border-accent-200 bg-gradient-to-b from-accent-50/80 to-white shadow-raised" : "border-line bg-white shadow-card",
                )}
              >
                <span className={cn("grid size-10 place-items-center rounded-xl", w.highlight ? "bg-accent-500 text-white" : "bg-brand-50 text-brand-600")}>
                  <w.icon className="size-[18px]" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-ink">{w.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{w.body}</p>
                {w.highlight && <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-accent-700">Integrity principle</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 9. Verticals

function Verticals() {
  const industries = useStore((s) => s.industries).filter((i) => i.active);
  const requirements = useStore((s) => s.requirements);
  return (
    <section id="industries" className="scroll-mt-20 border-t border-line bg-canvas py-20 sm:py-24">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Industry verticals"
          title="Designed around the sectors Elets knows best"
          description="Each vertical has its own procurement norms, compliance needs and decision-makers. The marketplace is structured around them."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.id} delay={(i % 3) * 0.05}>
              <Link
                href={`/solutions?industry=${ind.id}`}
                className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-accent-300 shadow-raised">
                  <DynIcon name={ind.icon} className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-ink">{ind.name}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-4 transition group-hover:text-brand-600" />
                  </span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-ink-3">{ind.description}</span>
                  <span className="mt-3 block text-xs text-ink-4">{requirements.filter((r) => r.industryId === ind.id).length} demo requirements on the platform</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ 10. Final CTA

function FinalCta() {
  return (
    <section id="cta" className="scroll-mt-20 py-20 sm:py-28">
      <div className={cn(CONTAINER, "grid gap-4 lg:grid-cols-2")}>
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-3xl bg-navy-950 p-8 text-white sm:p-10">
            <div className="grid-bg-dark pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-600/30 blur-[90px]" />
            <div className="relative">
              <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-accent-300">
                <Target className="size-5" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-navy-300">For organisations</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Find the right technology partner</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-navy-300">Government, healthcare, education and BFSI organisations can share requirements and receive curated, explainable matches.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="white" asChild>
                  <Link href="/login?role=buyer&next=/buyer/requirements/new">
                    Post a requirement <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline-dark" asChild>
                  <Link href="/solutions">Explore solutions</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="relative h-full overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white to-brand-50/60 p-8 sm:p-10">
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-accent-200/40 blur-[90px]" />
            <div className="relative">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-glow">
                <Layers className="size-5" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">For solution providers</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Reach relevant opportunities</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-3">
                List your solutions, get verified by Elets and receive requirements matched to your real capabilities — not to your advertising budget.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/signup?role=provider">
                    List your company <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/login?role=provider&next=/provider/verification">
                    <FileSearch /> How verification works
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
