"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  Milestone,
  Minus,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { PRO_MODULES, type ProModuleKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProviderLogo } from "@/components/ui/misc";
import { Reveal, SectionHeading } from "./reveal";
import { Aurora, WordReveal } from "./motion-kit";
import { PRO_MODULE_COPY, PRO_MODULE_ICONS } from "./pro-modules";
import { PRO_ENGAGEMENTS } from "@/lib/data/pro";
import { PROVIDERS } from "@/lib/data/providers";

const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const REQUEST_HREF = "/login?role=buyer&next=/buyer/pro";

export function ProPage() {
  return (
    <>
      <ProHero />
      <Comparison />
      <Modules />
      <HowItRuns />
      <Models />
      <Faq />
      <ProCta />
    </>
  );
}

// ------------------------------------------------------------------ hero

function ProHero() {
  const content = useStore((s) => s.content);
  return (
    <section className="relative -mt-16 overflow-hidden bg-navy-950 pt-16 text-white">
      <div className="grid-bg-dark pointer-events-none absolute inset-0" />
      <Aurora dark />
      <div className={cn(CONTAINER, "relative grid items-center gap-14 pb-24 pt-16 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:pb-28")}>
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-flame-300">
              <Sparkles className="size-3.5" /> Elets Pro · Managed Solutions
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-balance sm:text-[56px]"><WordReveal text={content.proHeadline} /></h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy-300">{content.proSubtext}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="flame" asChild>
                <Link href={REQUEST_HREF}>
                  Request Elets Pro assistance <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline-dark" asChild>
                <a href="#modules">See the eight stages</a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
              {[
                { t: "Dedicated", d: "relationship manager" },
                { t: "8-stage", d: "structured process" },
                { t: "One", d: "shared workspace" },
              ].map((x) => (
                <div key={x.t}>
                  <dt className="text-lg font-semibold text-white">{x.t}</dt>
                  <dd className="text-xs text-navy-400">{x.d}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
        <Reveal delay={0.15} y={24}>
          <WorkspacePreview />
        </Reveal>
      </div>
    </section>
  );
}

function WorkspacePreview() {
  // bundled fictional example for illustration, not marketplace data
  const engagement = PRO_ENGAGEMENTS.find((e) => e.id === "e-004") ?? PRO_ENGAGEMENTS[0];
  const providers = PROVIDERS;
  if (!engagement) return null;
  const totals = Object.entries(engagement.scores)
    .map(([pid, sc]) => {
      const total = engagement.criteria.reduce((sum, c) => sum + ((sc[c.id] ?? 0) / 10) * c.weight, 0);
      return { p: providers.find((x) => x.id === pid), total: Math.round(total) };
    })
    .filter((x) => x.p)
    .sort((a, b) => b.total - a.total);
  const states = PRO_MODULES.map((m) => engagement.modules[m.key]);

  return (
    <div className="relative">
      <div className="rounded-2xl border border-white/10 bg-white text-ink shadow-[0_40px_80px_-20px_rgb(0_0_0/0.5)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-navy-800 to-flame-600 text-white">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{engagement.title}</p>
            <p className="font-mono text-[10px] text-ink-4">Illustrative example</p>
          </div>
          <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:inline">Active</span>
        </div>
        <div className="flex gap-4 overflow-hidden border-b border-line px-4 text-[11px] font-medium text-ink-3">
          {["Overview", "Vendor shortlist", "Evaluation", "Documents", "Milestones"].map((t, i) => (
            <span key={t} className={cn("shrink-0 border-b-2 py-2", i === 2 ? "border-flame-600 text-ink" : "border-transparent")}>
              {t}
            </span>
          ))}
        </div>
        <div className="space-y-4 p-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-4">
              <span>Engagement stages</span>
              <span className="normal-case tracking-normal text-ink-3">{states.filter((s) => s === "done").length} of 8 complete</span>
            </div>
            <div className="flex gap-1">
              {states.map((s, i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", s === "done" ? "bg-navy-900" : s === "active" ? "bg-flame-500" : "bg-navy-100")} />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-line">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-[11px] font-semibold">Weighted evaluation matrix</p>
              <p className="text-[10px] text-ink-4">{engagement.criteria.length} criteria</p>
            </div>
            <ul className="divide-y divide-line">
              {totals.map(({ p, total }, i) => (
                <li key={p!.id} className="flex items-center gap-2.5 px-3 py-2">
                  <ProviderLogo provider={p!} size="sm" className="size-7 rounded-md" />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{p!.name}</span>
                  <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-navy-100 sm:block">
                    <span className={cn("block h-full rounded-full", i === 0 ? "bg-flame-500" : "bg-brand-500")} style={{ width: `${total}%` }} />
                  </span>
                  <span className="w-8 text-right text-[12px] font-semibold tabular-nums">{total}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {engagement.milestones.slice(-2).map((m) => (
              <div key={m.id} className="rounded-lg border border-line bg-subtle/60 p-2.5">
                <p className="flex items-center gap-1 text-[10px] font-medium text-ink-4">
                  <Milestone className="size-3" /> Milestone
                </p>
                <p className="mt-0.5 truncate text-[12px] font-medium">{m.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-4 hidden items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 pr-4 text-ink shadow-overlay animate-float sm:flex">
        <span className="grid size-8 place-items-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">RM</span>
        <div>
          <p className="text-[12px] font-semibold">Relationship manager</p>
          <p className="text-[10px] text-ink-3">Assigned to every engagement</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ comparison

const ROWS: { label: string; market: boolean }[] = [
  { label: "Discover verified technology providers", market: true },
  { label: "Explainable eight-dimension matching", market: true },
  { label: "Curated introductions coordinated by Elets", market: true },
  { label: "Requirement discovery workshops", market: false },
  { label: "Market research and vendor scan", market: false },
  { label: "Vendor due diligence and reference checks", market: false },
  { label: "RFP and tender drafting support", market: false },
  { label: "Technical and commercial evaluation support", market: false },
  { label: "Negotiation assistance and closure", market: false },
  { label: "Post-award review and feedback", market: false },
  { label: "Dedicated relationship manager and shared workspace", market: false },
];

function Comparison() {
  return (
    <section className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="Marketplace vs Elets Pro"
          title="The marketplace makes the introduction. Elets Pro manages the journey."
          description="Both share the same verified provider network and integrity rules. Elets Pro adds hands-on support for complex, high-stakes selections."
        />
        <Reveal className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="grid grid-cols-[1fr_96px_96px] items-end border-b border-line bg-subtle/70 px-4 py-3 text-xs font-semibold sm:grid-cols-[1fr_140px_140px] sm:px-6">
            <span className="text-ink-3">Capability</span>
            <span className="text-center text-ink-2">Marketplace</span>
            <span className="text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2 py-0.5 text-white">
                <Sparkles className="size-3 text-flame-300" /> Pro
              </span>
            </span>
          </div>
          <ul>
            {ROWS.map((r) => (
              <li key={r.label} className="grid grid-cols-[1fr_96px_96px] items-center border-b border-line/70 px-4 py-3 text-[13px] last:border-0 sm:grid-cols-[1fr_140px_140px] sm:px-6 sm:text-sm">
                <span className="text-ink-2">{r.label}</span>
                <span className="grid place-items-center">
                  {r.market ? (
                    <span className="grid size-5 place-items-center rounded-full bg-brand-50 text-brand-600" aria-label="Included">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <Minus className="size-4 text-ink-4" aria-label="Not included" />
                  )}
                </span>
                <span className="grid place-items-center">
                  <span className="grid size-5 place-items-center rounded-full bg-flame-600 text-white" aria-label="Included">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ modules

function Modules() {
  const [active, setActive] = React.useState<ProModuleKey>("discovery");
  const idx = PRO_MODULES.findIndex((m) => m.key === active);
  const mod = PRO_MODULES[idx];
  const copy = PRO_MODULE_COPY[active];
  const I = PRO_MODULE_ICONS[active];
  return (
    <section id="modules" className="scroll-mt-20 border-y border-line bg-canvas py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Eight service modules"
          title="A structured path from first brief to final award"
          description="Engagements can use every module or only the ones you need. Each produces clear deliverables that live in your Pro workspace."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="scrollbar-thin -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:block lg:space-y-1.5 lg:overflow-visible lg:px-0" role="tablist" aria-label="Elets Pro modules">
            {PRO_MODULES.map((m, i) => {
              const MI = PRO_MODULE_ICONS[m.key];
              const on = m.key === active;
              return (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(m.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:w-full",
                    on ? "border-navy-200 bg-white shadow-raised" : "border-transparent hover:border-line hover:bg-white/70",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition", on ? "bg-navy-900 text-white" : "bg-white text-ink-3 ring-1 ring-line")}>
                    <MI className="size-4" />
                  </span>
                  <span className="whitespace-nowrap text-[13px] font-medium text-ink lg:whitespace-normal">
                    <span className="mr-1.5 text-ink-4">{String(i + 1).padStart(2, "0")}</span>
                    {m.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div key={active} className="animate-fade-in rounded-2xl border border-line bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy-800 to-flame-600 text-white shadow-glow">
                <I className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-flame-600">Stage {idx + 1} of 8</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{mod.name}</h3>
                <p className="mt-1.5 text-[15px] text-ink-3">{copy.summary}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">What Elets does</p>
                <ul className="mt-3 space-y-2.5">
                  {copy.elets.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-ink-2">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-accent-100 bg-accent-50/50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">What you receive</p>
                <ul className="mt-3 space-y-2.5">
                  {copy.deliverables.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm text-ink-2">
                      <FileText className="mt-0.5 size-4 shrink-0 text-accent-600" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex gap-1">
                {PRO_MODULES.map((m, i) => (
                  <span key={m.key} className={cn("h-1.5 w-6 rounded-full transition", i <= idx ? "bg-flame-500" : "bg-navy-100")} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={idx === 0} onClick={() => setActive(PRO_MODULES[idx - 1].key)}>
                  Previous
                </Button>
                <Button size="sm" disabled={idx === PRO_MODULES.length - 1} onClick={() => setActive(PRO_MODULES[idx + 1].key)}>
                  Next stage <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ how an engagement runs

const RUNS = [
  { icon: UserCheck, title: "A relationship manager, from day one", body: "A named Elets RM with sector experience leads the engagement, coordinates vendors and keeps stakeholders aligned." },
  { icon: LayoutDashboard, title: "One shared workspace", body: "Brief, market scan, shortlist, diligence documents, RFP, evaluation matrix, meeting notes and decisions — all in one place." },
  { icon: ListChecks, title: "Milestones and tasks you can see", body: "Every stage has milestones, owners and due dates, so progress is visible to your leadership at any time." },
  { icon: CalendarDays, title: "Structured meetings", body: "Workshops, demos and negotiation rounds are scheduled, minuted and linked to actions." },
  { icon: FolderOpen, title: "Documented decisions", body: "Scores, rationale and recommendations are recorded — useful for audit, governance and future procurements." },
  { icon: MessagesSquare, title: "Clear communication", body: "A single communication history between your team, the RM and — when appropriate — shortlisted vendors." },
];

function HowItRuns() {
  return (
    <section className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading align="center" eyebrow="How an engagement runs" title="Professional project management, built for technology procurement" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RUNS.map((r, i) => (
            <Reveal key={r.title} delay={(i % 3) * 0.05}>
              <div className="h-full rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid size-10 place-items-center rounded-xl bg-navy-900 text-flame-300">
                  <r.icon className="size-[18px]" />
                </span>
                <p className="mt-4 text-[15px] font-semibold text-ink">{r.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{r.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ engagement models

const MODELS: { name: string; tagline: string; modules: ProModuleKey[]; fit: string; featured?: boolean }[] = [
  {
    name: "Advisory sprint",
    tagline: "Clarity before you go to market.",
    modules: ["discovery", "intelligence", "shortlisting"],
    fit: "Early-stage needs, or teams that want a structured brief and a credible shortlist.",
  },
  {
    name: "Managed selection",
    tagline: "From brief to a defensible recommendation.",
    modules: ["discovery", "intelligence", "shortlisting", "diligence", "rfp", "evaluation"],
    fit: "Most technology selections where evaluation rigour matters.",
    featured: true,
  },
  {
    name: "End-to-end procurement support",
    tagline: "Every stage, through to post-award review.",
    modules: ["discovery", "intelligence", "shortlisting", "diligence", "rfp", "evaluation", "negotiation", "post_award"],
    fit: "Large, multi-stakeholder or tender-driven programmes.",
  },
];

function Models() {
  return (
    <section className="border-t border-line bg-canvas py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="Engagement models"
          title="Scoped to the support you actually need"
          description="Every engagement is scoped with your relationship manager. Commercials are agreed per engagement."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {MODELS.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.06}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-6 sm:p-7",
                  m.featured ? "border-navy-900 bg-navy-950 text-white shadow-overlay" : "border-line bg-white shadow-card",
                )}
              >
                {m.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-flame-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-flame-300">Most common</span>
                )}
                <p className={cn("text-lg font-semibold tracking-tight", m.featured ? "text-white" : "text-ink")}>{m.name}</p>
                <p className={cn("mt-1 text-sm", m.featured ? "text-navy-300" : "text-ink-3")}>{m.tagline}</p>
                <p className={cn("mt-6 text-[11px] font-semibold uppercase tracking-wider", m.featured ? "text-navy-400" : "text-ink-4")}>Includes {m.modules.length} of 8 modules</p>
                <ul className="mt-3 flex-1 space-y-2">
                  {PRO_MODULES.map((pm) => {
                    const inc = m.modules.includes(pm.key);
                    return (
                      <li key={pm.key} className={cn("flex items-center gap-2.5 text-[13px]", inc ? (m.featured ? "text-white" : "text-ink-2") : m.featured ? "text-navy-500" : "text-ink-4")}>
                        {inc ? (
                          <span className={cn("grid size-4 place-items-center rounded-full", m.featured ? "bg-flame-500 text-white" : "bg-navy-900 text-white")}>
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        ) : (
                          <Minus className="size-4" />
                        )}
                        {pm.name}
                      </li>
                    );
                  })}
                </ul>
                <p className={cn("mt-6 border-t pt-4 text-[13px] leading-relaxed", m.featured ? "border-white/10 text-navy-300" : "border-line text-ink-3")}>
                  <span className={cn("font-semibold", m.featured ? "text-white" : "text-ink")}>Best for: </span>
                  {m.fit}
                </p>
                <Button className="mt-6 w-full" variant={m.featured ? "white" : "secondary"} asChild>
                  <Link href={REQUEST_HREF}>Discuss this model</Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ FAQ

const FAQS = [
  {
    q: "How is Elets Pro different from using the marketplace?",
    a: "The marketplace helps you discover verified providers and request introductions. Elets Pro adds a relationship manager and a structured process covering requirement definition, market research, due diligence, RFP support, evaluation, negotiation and post-award review.",
  },
  {
    q: "Does using Elets Pro change which providers are recommended?",
    a: "No. Pro engagements use the same eligibility rules and explainable matching framework. Paid listing packages never influence match scores, whether or not you use Elets Pro.",
  },
  {
    q: "Can we use only some of the modules?",
    a: "Yes. Engagements are scoped with your relationship manager — from a short advisory sprint to end-to-end procurement support.",
  },
  {
    q: "Does Elets Pro work with government tender processes?",
    a: "Elets Pro supports the preparation of structured RFPs, technical requirements and evaluation criteria. Your organisation remains the decision-maker and runs its procurement under its own rules.",
  },
  {
    q: "Where do documents and decisions live?",
    a: "Every engagement has its own workspace containing the requirement brief, market scan, shortlist, diligence documents, RFP drafts, evaluation matrix, meeting notes, milestones and the final recommendation.",
  },
  {
    q: "How do we get started?",
    a: "Request assistance from your buyer workspace — either for a requirement you have already submitted or for a new need. An Elets relationship manager will contact you to scope the engagement.",
  },
];

function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <section className="py-20 sm:py-28">
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[1fr_1.6fr]")}>
        <SectionHeading eyebrow="FAQ" title="Questions about Elets Pro" description="Can't find what you're looking for? Your relationship manager can walk you through an engagement." />
        <Reveal>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            {FAQS.map((f, i) => {
              const on = open === i;
              return (
                <div key={f.q}>
                  <button
                    onClick={() => setOpen(on ? null : i)}
                    aria-expanded={on}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-ink transition hover:bg-subtle sm:px-6"
                  >
                    {f.q}
                    <ChevronDown className={cn("size-4 shrink-0 text-ink-4 transition-transform duration-200", on && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-[grid-template-rows] duration-300", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-ink-3 sm:px-6">{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ CTA

function ProCta() {
  return (
    <section className="pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-14 text-center text-white sm:px-12 sm:py-16">
            <div className="grid-bg-dark pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] max-w-full -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_0%,rgb(53_101_251/0.45),transparent)]" />
            <div className="relative mx-auto max-w-2xl">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-navy-800 to-flame-600 shadow-glow">
                <Sparkles className="size-5" />
              </span>
              <h2 className="mt-6 text-[28px] font-semibold tracking-tight text-balance sm:text-[36px]">Planning a complex technology selection?</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-navy-300">Tell us what you&apos;re trying to achieve. An Elets relationship manager will help scope the right level of support.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="white" asChild>
                  <Link href={REQUEST_HREF}>
                    Request Elets Pro assistance <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline-dark" asChild>
                  <Link href="/solutions">Browse the marketplace</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
