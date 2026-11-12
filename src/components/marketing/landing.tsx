"use client";

import * as React from "react";
import Link from "next/link";
import { MotionConfig, motion, useScroll, useSpring, useTransform } from "framer-motion";
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
import { DIMENSION_META } from "@/lib/matching";
import { MATCH_DIMENSIONS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DynIcon } from "@/components/ui/icon";
import { ProviderCard } from "@/components/shared/domain";
import { LogoMark } from "@/components/brand";
import { HeroVisual } from "./hero-visual";
import { Reveal, SectionHeading } from "./reveal";
import { PRO_MODULE_ICONS } from "./pro-modules";
import { Aurora, CountUp, Marquee, Spotlight, WordReveal } from "./motion-kit";

const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const POST_REQ = "/login?role=buyer&next=/buyer/requirements/new";

export function Landing() {
  const content = useStore((s) => s.content);
  const on = (k: string) => content.sections[k] !== false;
  return (
    <MotionConfig reducedMotion="user">
      <Hero />
      <SectorMarquee />
      <Facts />
      {on("ecosystem") && <Ecosystem />}
      {on("howItWorks") && <HowItWorks />}
      {on("categories") && <Categories />}
      {on("providers") && <Providers />}
      {on("postRequirement") && <PostRequirement />}
      {on("pro") && <ProBand />}
      {on("whyElets") && <WhyElets />}
      {on("verticals") && <Verticals />}
      <FinalCta />
    </MotionConfig>
  );
}

// ------------------------------------------------------------------ Hero

function Hero() {
  const content = useStore((s) => s.content);
  const [first, ...rest] = content.heroHeadline.split(". ");
  const second = rest.join(". ");
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  return (
    <section ref={ref} className="relative -mt-16 overflow-x-clip pt-16">
      <Aurora />
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
      {/* the logo's E, as a large watermark */}
      <LogoMark variant="plain" size={720} className="pointer-events-none absolute -right-48 top-10 hidden opacity-[0.035] xl:block" />
      <div className={cn(CONTAINER, "relative grid items-center gap-14 pb-24 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-32")}>
        <div>
          <Reveal>
            <Link
              href="/pro"
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-white/80 py-1 pl-1 pr-3 text-xs font-medium text-ink-2 shadow-xs backdrop-blur transition hover:border-flame-200 hover:shadow-raised"
            >
              <span className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-flame-400" />
                  <span className="relative size-1.5 rounded-full bg-flame-500" />
                </span>
                New
                <span className="absolute inset-y-0 left-0 w-1/2 animate-shine bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </span>
              Elets Pro: managed technology procurement
              <ArrowRight className="size-3.5 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-flame-600" />
            </Link>
          </Reveal>
          <h1 className="mt-6 text-[42px] font-semibold leading-[1.02] tracking-[-0.035em] text-ink text-balance sm:text-[58px] lg:text-[66px]">
            <WordReveal text={`${first}${second ? "." : ""}`} />{" "}
            {second && <WordReveal text={second} delay={0.25} wordClassName="text-brand-gradient" />}
          </h1>
          <Reveal delay={0.35}>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-3">{content.heroSubtext}</p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" variant="flame" asChild className="group">
                <Link href={POST_REQ}>
                  Post a requirement <ArrowRight className="transition group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/solutions">Explore solutions</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-ink-2">
                <Link href="/signup?role=provider">List your company</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.55}>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-medium text-ink-2">
              {[
                { t: "Verified providers", icon: BadgeCheck },
                { t: "Explainable 8-dimension matching", icon: Gauge },
                { t: "Introductions curated by Elets", icon: Handshake },
              ].map(({ t, icon: I }) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <span className="relative grid size-7 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_4px_10px_-4px_rgb(11_31_77/0.6)]">
                    <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                    <I className="relative size-3.5" />
                    <span className="absolute bottom-0 right-0 size-1.5 rounded-tl bg-flame-500" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <motion.div style={{ y: visualY }}>
          <Reveal delay={0.3} y={30}>
            <HeroVisual />
          </Reveal>
        </motion.div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Sector marquee

function SectorMarquee() {
  const industries = useStore((s) => s.industries).filter((i) => i.active);
  const categories = useStore((s) => s.categories).filter((c) => c.active);
  const items = [...industries.map((i) => ({ id: i.id, name: i.name, icon: i.icon, kind: "sector" })), ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, kind: "tech" }))];
  if (!items.length) return null;
  return (
    <section className="border-y border-line bg-white/70 py-6 backdrop-blur">
      <div className={cn(CONTAINER, "flex flex-col items-center gap-4 md:flex-row")}>
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-ink-4">Built for India&apos;s institutions</p>
        <Marquee className="w-full">
          {items.map((it) => (
            <span
              key={`${it.kind}-${it.id}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink-2 shadow-xs"
            >
              <DynIcon name={it.icon} className={cn("size-4", it.kind === "sector" ? "text-flame-600" : "text-brand-600")} />
              {it.name}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Facts (honest numbers only)

function Facts() {
  const facts = [
    { n: 8, suffix: "", label: "Matching dimensions", body: "Technology, sector, capability, delivery, capacity, geography, compliance, budget" },
    { n: 100, suffix: "%", label: "Matches explained", body: "Every score comes with the reasons and the gaps" },
    { n: 0, suffix: "", label: "Paid influence on rankings", body: "Listing packages never reach the matching engine" },
    { n: 8, suffix: "", label: "Elets Pro stages", body: "From discovery to post-award review" },
  ];
  return (
    <section className="py-16 sm:py-20">
      <div className={CONTAINER}>
      <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line shadow-card sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f, i) => (
          <Reveal key={f.label} delay={i * 0.06} className="bg-white">
            <Spotlight className="h-full p-6 sm:p-7">
              <p className="text-[44px] font-semibold leading-none tracking-[-0.04em] text-navy-900">
                <CountUp to={f.n} suffix={f.suffix} />
              </p>
              <p className="mt-3 text-sm font-semibold text-ink">{f.label}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{f.body}</p>
              <span className="absolute left-6 top-0 h-0.5 w-10 rounded-b bg-flame-600 sm:left-7" />
            </Spotlight>
          </Reveal>
        ))}
      </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Ecosystem

const STRENGTHS = [
  { icon: Megaphone, title: "Media & publications", body: "Long-standing editorial presence across e-governance, healthcare, education and BFSI technology." },
  { icon: CalendarDays, title: "Events & summits", body: "Industry forums that already bring technology leaders and institutional decision-makers into the same room." },
  { icon: Building2, title: "Public sector relationships", body: "Working relationships with government departments, missions and public-sector organisations." },
  { icon: Briefcase, title: "Technology company network", body: "Established connections with technology companies, solution providers and implementation partners." },
  { icon: Users, title: "Decision-maker access", body: "Trusted access to CIOs, programme heads and institutional stakeholders across sectors." },
  { icon: Network, title: "Institutional credibility", body: "A recognised name in India's B2B technology ecosystem, now structured into a platform." },
];

function IconTile({ icon: Icon, dark, className }: { icon: React.ElementType; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-11 place-items-center rounded-xl transition duration-300",
        dark
          ? "border border-white/10 bg-white/[0.06] text-flame-300 group-hover/spot:border-flame-400/40 group-hover/spot:text-flame-200"
          : "relative overflow-hidden bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_18px_-8px_rgb(11_31_77/0.7)] group-hover/spot:from-flame-500 group-hover/spot:to-flame-700 group-hover/spot:shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_18px_-8px_rgb(229_32_46/0.7)]",
        className,
      )}
    >
      {!dark && <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />}
      <Icon className="relative size-5 transition-transform duration-300 group-hover/spot:scale-110" />
    </span>
  );
}

function Ecosystem() {
  return (
    <section id="ecosystem" className="pb-20 sm:pb-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Trusted industry ecosystem"
          title={
            <>
              Not another marketplace from scratch. <span className="text-brand-gradient">Built on relationships Elets already has.</span>
            </>
          }
          description="Elets is turning its industry network into a platform: trusted connections become structured technology opportunities and measurable outcomes."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STRENGTHS.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.06}>
              <Spotlight className="h-full rounded-2xl border border-line bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised">
                <IconTile icon={s.icon} />
                <p className="mt-5 text-[15px] font-semibold text-ink">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{s.body}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ How it works (scroll-linked progress)

const STEPS = [
  { icon: ClipboardList, who: "Buyer", title: "Share a requirement", body: "Describe the problem, sector, budget range and timeline through a guided brief." },
  { icon: Gauge, who: "Platform", title: "Explainable matching", body: "Providers are scored across eight transparent dimensions, with reasons and gaps for each." },
  { icon: Workflow, who: "Elets", title: "Elets reviews", body: "On Premium, a relationship manager structures the brief and reviews every match." },
  { icon: Handshake, who: "Elets", title: "Curated introductions", body: "Shortlist providers, then Elets introduces you and schedules the meetings." },
  { icon: Trophy, who: "Outcome", title: "Move to an outcome", body: "Track evaluation and negotiation through to a completed engagement." },
];

function HowItWorks() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return (
    <section id="how" className="relative scroll-mt-20 overflow-hidden bg-canvas py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="From a requirement to the right partner, in five steps"
          description="Every requirement follows a clear, trackable journey, so you always know where things stand."
        />
        <div ref={ref} className="relative mt-16">
          {/* progress rail */}
          <div className="absolute left-[22px] top-0 h-full w-0.5 rounded bg-line lg:left-0 lg:top-[22px] lg:h-0.5 lg:w-full" />
          <motion.div
            style={{ scaleY: progress }}
            className="absolute left-[22px] top-0 h-full w-0.5 origin-top rounded bg-gradient-to-b from-navy-900 via-brand-600 to-flame-600 lg:hidden"
          />
          <motion.div
            style={{ scaleX: progress }}
            className="absolute left-0 top-[22px] hidden h-0.5 w-full origin-left rounded bg-gradient-to-r from-navy-900 via-brand-600 to-flame-600 lg:block"
          />
          <div className="relative grid gap-6 lg:grid-cols-5 lg:gap-5" role="list">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div role="listitem" className="flex gap-4 lg:block">
                  <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full border-4 border-canvas bg-navy-900 text-white shadow-glow">
                    <s.icon className="size-[18px]" />
                    <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-flame-600 text-[10px] font-bold text-white ring-2 ring-canvas">{i + 1}</span>
                  </span>
                  <Spotlight className="flex-1 rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised lg:mt-6">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        s.who === "Elets" ? "bg-flame-50 text-flame-700" : s.who === "Buyer" ? "bg-navy-50 text-navy-700" : s.who === "Outcome" ? "bg-accent-50 text-accent-700" : "bg-brand-50 text-brand-700",
                      )}
                    >
                      {s.who}
                    </span>
                    <p className="mt-3 text-[15px] font-semibold text-ink">{s.title}</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{s.body}</p>
                  </Spotlight>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Categories

function Categories() {
  const content = useStore((s) => s.content);
  const categories = useStore((s) => s.categories);
  const providers = useStore((s) => s.providers);
  const list = content.featuredCategoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c && c.active);
  const count = (id: string) => providers.filter((p) => p.accountStatus === "active" && p.categories.includes(id)).length;
  return (
    <section id="categories" className="scroll-mt-20 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Technology categories"
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
            <Reveal key={c.id} delay={(i % 4) * 0.05}>
              <Link href={`/solutions?category=${c.id}`} className="block h-full">
                <Spotlight className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-navy-200 hover:shadow-raised">
                  <div className="flex items-center justify-between">
                    <span className="relative grid size-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_18px_-8px_rgb(11_31_77/0.7)] transition duration-300 group-hover/spot:from-flame-500 group-hover/spot:to-flame-700">
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                      <DynIcon name={c.icon} className="relative size-5 transition-transform duration-300 group-hover/spot:scale-110" />
                    </span>
                    <ArrowUpRight className="size-4 -translate-x-1 text-ink-4 opacity-0 transition group-hover/spot:translate-x-0 group-hover/spot:opacity-100" />
                  </div>
                  <p className="mt-4 text-[15px] font-semibold leading-snug text-ink">{c.name}</p>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-ink-3">{c.description}</p>
                  <p className="mt-4 text-xs font-medium text-ink-4">{count(c.id) ? `${count(c.id)} provider${count(c.id) === 1 ? "" : "s"} listed` : "Open for listings"}</p>
                </Spotlight>
              </Link>
            </Reveal>
          ))}
          <Reveal>
            <Link
              href={POST_REQ}
              className="group flex h-full flex-col justify-between rounded-2xl border border-dashed border-line-strong bg-white/60 p-5 transition duration-300 hover:-translate-y-1 hover:border-flame-300 hover:bg-white"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-flame-50 text-flame-600">
                <Compass className="size-5" />
              </span>
              <div>
                <p className="mt-4 text-[15px] font-semibold text-ink">Not sure where it fits?</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">Describe the problem and we&apos;ll match it to the right category.</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-flame-600">
                  Post a requirement <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Providers

function Providers() {
  const content = useStore((s) => s.content);
  const providers = useStore((s) => s.providers);
  const featured = content.featuredProviderIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p && p.accountStatus === "active");
  // nothing curated yet: show the newest verified, listed providers
  const list = featured.length
    ? featured
    : providers
        .filter((p) => p.accountStatus === "active" && p.verification === "verified" && p.categories.length > 0)
        .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
        .slice(0, 6);
  return (
    <section id="providers" className="bg-canvas py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Verified solution providers"
          title="Technology partners reviewed by the Elets team"
          description="Verification is earned through document and reference review, and can't be bought. Featured placement is disclosed and never affects match rankings."
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
            <Reveal key={p.id} delay={(i % 3) * 0.06}>
              <div className="h-full transition duration-300 hover:-translate-y-1">
                <ProviderCard provider={p} href={`/providers/${p.slug}`} showActions={false} className="h-full" />
              </div>
            </Reveal>
          ))}
          {list.length === 0 && (
            <Reveal className="sm:col-span-2 lg:col-span-3">
              <Spotlight className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-7 shadow-card sm:flex-row sm:items-center">
                <IconTile icon={BadgeCheck} />
                <div className="flex-1">
                  <p className="text-[17px] font-semibold text-ink">Provider listings are now open</p>
                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-3">
                    Technology companies can list their solutions and apply for Elets verification. Verified providers appear here and in matching for buyer requirements.
                  </p>
                </div>
                <Button variant="flame" asChild>
                  <Link href="/signup?role=provider">
                    List your company <ArrowRight />
                  </Link>
                </Button>
              </Spotlight>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Post requirement (animated brief)

const BRIEF_OPTIONS = [
  { n: "Healthcare Technology", i: "Stethoscope" },
  { n: "Cloud & Infrastructure", i: "Cloud" },
  { n: "Cybersecurity", i: "ShieldCheck" },
  { n: "Data Analytics", i: "ChartLine" },
];

function PostRequirement() {
  const [sel, setSel] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setSel((s) => (s + 1) % BRIEF_OPTIONS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-white p-6 shadow-card sm:p-10 lg:p-14">
          <Aurora className="opacity-70" />
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-flame-600">
                <span className="h-px w-5 bg-flame-500/70" /> Post a requirement
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink text-balance sm:text-[40px]">
                Tell us the problem. <span className="text-brand-gradient">We&apos;ll find the right partners.</span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
                A guided brief captures what matters: sector, technology, budget range, timeline, deployment and compliance. Most fields are optional.
              </p>
              <ul className="mt-6 space-y-2.5">
                {["Matched automatically the moment you submit", "Explainable scores across eight dimensions", "Premium: reviewed and introduced by the Elets team"].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-ink-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-navy-900 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="flame" asChild>
                  <Link href={POST_REQ}>
                    Post a requirement <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/pricing">See plans</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative rounded-2xl border border-line bg-white/95 p-5 shadow-overlay backdrop-blur sm:p-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-3">Step 3 of 9</span>
                  <span className="font-medium text-navy-900">Technology category</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-50">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-navy-900 to-flame-600" initial={{ width: "0%" }} whileInView={{ width: "33%" }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
                </div>
                <p className="mt-5 text-[15px] font-semibold text-ink">What kind of technology do you need?</p>
                <p className="mt-1 text-xs text-ink-3">Pick the closest fit. You can refine it later.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {BRIEF_OPTIONS.map((o, i) => {
                    const on = i === sel;
                    return (
                      <div key={o.n} className={cn("relative flex items-center gap-2 rounded-xl border p-2.5 text-[12px] font-medium transition duration-300", on ? "border-navy-900 text-ink" : "border-line text-ink-2")}>
                        {on && <motion.span layoutId="brief-sel" className="absolute inset-0 -z-0 rounded-xl bg-navy-50 ring-4 ring-navy-100" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                        <span className={cn("relative grid size-7 shrink-0 place-items-center rounded-lg transition", on ? "bg-flame-600 text-white" : "bg-navy-50 text-navy-700")}>
                          <DynIcon name={o.i} className="size-3.5" />
                        </span>
                        <span className="relative truncate">{o.n}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-4">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent-500" /> Saved as draft
                  </span>
                  <Button size="sm" asChild>
                    <Link href={POST_REQ}>
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

// ------------------------------------------------------------------ Elets Pro band (animated stage stepper)

function ProBand() {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % PRO_MODULES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-28">
      <Aurora dark />
      <div className="dot-bg-dark pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_70%_at_50%_50%,black,transparent)]" />
      <div className={cn(CONTAINER, "relative")}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-flame-300 backdrop-blur">
              <Sparkles className="size-3.5" /> Elets Pro · Premium
            </p>
            <h2 className="mt-5 text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] text-balance sm:text-[44px]">
              More than introductions. <span className="text-brand-gradient-dark">Managed support through the whole journey.</span>
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-navy-300">
              A conventional marketplace stops at the introduction. Elets Pro assigns a relationship manager and a structured eight-stage process, from defining the requirement to
              reviewing the outcome after award.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="flame" asChild>
                <Link href="/pro">
                  Explore Elets Pro <ArrowRight />
                </Link>
              </Button>
              <Button size="lg" variant="outline-dark" asChild>
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur sm:p-4">
              <div className="mb-3 flex items-center justify-between px-2 pt-1 text-xs">
                <span className="font-semibold text-white">Engagement progress</span>
                <span className="tabular-nums text-navy-300">
                  Stage {stage + 1} of {PRO_MODULES.length}
                </span>
              </div>
              <div className="mb-3 flex gap-1 px-2">
                {PRO_MODULES.map((m, i) => (
                  <span key={m.key} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.span className="block h-full rounded-full bg-gradient-to-r from-brand-400 to-flame-500" animate={{ width: i <= stage ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                  </span>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {PRO_MODULES.map((m, i) => {
                  const I = PRO_MODULE_ICONS[m.key];
                  const state = i < stage ? "done" : i === stage ? "active" : "upcoming";
                  return (
                    <div
                      key={m.key}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition duration-500",
                        state === "active" ? "border-flame-400/50 bg-flame-500/10" : state === "done" ? "border-white/10 bg-white/[0.05]" : "border-white/[0.06] bg-transparent",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg border transition duration-500",
                          state === "active" ? "border-flame-400/50 bg-flame-600 text-white shadow-flame" : state === "done" ? "border-white/10 bg-white/10 text-white" : "border-white/10 text-navy-400",
                        )}
                      >
                        {state === "done" ? <Check className="size-4" /> : <I className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-[10px] font-semibold uppercase tracking-wider", state === "active" ? "text-flame-300" : "text-navy-400")}>Stage {i + 1}</span>
                        <span className={cn("block truncate text-[13px] font-medium", state === "upcoming" ? "text-navy-300" : "text-white")}>{m.name}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Why Elets (bento)

function WhyElets() {
  return (
    <section className="py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading align="center" eyebrow="Why Elets" title="Built for trust, transparency and outcomes" />
        <div className="mt-12 grid gap-4 lg:grid-cols-6">
          {/* integrity: the big one */}
          <Reveal className="lg:col-span-4 lg:row-span-2">
            <Spotlight dark className="flex h-full flex-col overflow-hidden rounded-3xl bg-navy-950 p-7 text-white sm:p-9">
              <div className="dot-bg-dark pointer-events-none absolute inset-0 -z-10 opacity-60" />
              <IconTile icon={Scale} dark />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-flame-300">Integrity principle</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">Rankings that can&apos;t be bought</p>
              <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-navy-300">
                Paid listing packages are kept out of the matching engine. Scores reflect fit across eight dimensions, and nothing else.
              </p>
              <ScoreBreakdown />
            </Spotlight>
          </Reveal>
          {[
            { icon: BadgeCheck, title: "Verified, not just listed", body: "A verified badge only after Elets reviews documents, certifications and references." },
            { icon: Users, title: "A human in the loop", body: "On Premium, Elets reviews every match and coordinates every introduction." },
          ].map((w, i) => (
            <Reveal key={w.title} delay={0.06 * (i + 1)} className="lg:col-span-2">
              <Spotlight className="h-full rounded-3xl border border-line bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised">
                <IconTile icon={w.icon} />
                <p className="mt-5 text-[15px] font-semibold text-ink">{w.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{w.body}</p>
              </Spotlight>
            </Reveal>
          ))}
          {[
            { icon: Gauge, title: "Explainable recommendations", body: "Every match shows its breakdown, the reasons it was recommended and the points to verify." },
            { icon: Network, title: "An existing, trusted network", body: "Relationships Elets has built across government, healthcare, education and BFSI." },
            { icon: ShieldCheck, title: "Managed when it matters", body: "Elets Pro adds structured support for complex procurement, from RFP to negotiation." },
          ].map((w, i) => (
            <Reveal key={w.title} delay={0.06 * i} className="lg:col-span-2">
              <Spotlight className="h-full rounded-3xl border border-line bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised">
                <IconTile icon={w.icon} />
                <p className="mt-5 text-[15px] font-semibold text-ink">{w.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{w.body}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Illustrative 8-dimension breakdown that fills in when scrolled into view. */
function ScoreBreakdown() {
  const values = [96, 88, 92, 74, 85, 100, 90, 70];
  return (
    <div className="mt-8 grid flex-1 content-end gap-x-8 gap-y-3 sm:grid-cols-2">
      {MATCH_DIMENSIONS.map((d, i) => (
        <div key={d}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-navy-300">{DIMENSION_META[d].label}</span>
            <span className="tabular-nums text-navy-400">w{DIMENSION_META[d].weight}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brand-400 to-flame-500"
              initial={{ width: 0 }}
              whileInView={{ width: `${values[i]}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-navy-400 sm:col-span-2">Illustrative example. Listing package: not an input.</p>
    </div>
  );
}

// ------------------------------------------------------------------ Verticals

function Verticals() {
  const industries = useStore((s) => s.industries).filter((i) => i.active);
  return (
    <section id="industries" className="scroll-mt-20 border-t border-line bg-canvas py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          eyebrow="Industry verticals"
          title="Designed around the sectors Elets knows best"
          description="Each vertical has its own procurement norms, compliance needs and decision-makers. The marketplace is structured around them."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.id} delay={(i % 3) * 0.06}>
              <Link href={`/solutions?industry=${ind.id}`} className="block h-full">
                <Spotlight className="flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-glow transition duration-300 group-hover/spot:from-flame-500 group-hover/spot:to-flame-700 group-hover/spot:shadow-flame">
                    <DynIcon name={ind.icon} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold text-ink">{ind.name}</span>
                      <ArrowUpRight className="size-4 shrink-0 text-ink-4 transition group-hover/spot:-translate-y-0.5 group-hover/spot:translate-x-0.5 group-hover/spot:text-flame-600" />
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-3">{ind.description}</span>
                  </span>
                </Spotlight>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Final CTA

function FinalCta() {
  return (
    <section id="cta" className="scroll-mt-20 py-20 sm:py-28">
      <div className={cn(CONTAINER, "grid gap-4 lg:grid-cols-2")}>
        <Reveal>
          {/* rotating gradient border */}
          <div className="relative h-full overflow-hidden rounded-[28px] p-px">
            <motion.div
              aria-hidden
              className="absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,#e5202e_60deg,transparent_120deg,transparent_180deg,#4063e2_240deg,transparent_300deg)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative h-full overflow-hidden rounded-[27px] bg-navy-950 p-8 text-white sm:p-10">
              <Aurora dark className="opacity-60" />
              <div className="relative">
                <IconTile icon={Target} dark />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-flame-300">For organisations</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[30px]">Find the right technology partner</h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-navy-300">Government, healthcare, education and BFSI organisations get explainable matches the moment they post a requirement.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" variant="flame" asChild>
                    <Link href={POST_REQ}>
                      Post a requirement <ArrowRight />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline-dark" asChild>
                    <Link href="/solutions">Explore solutions</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <Spotlight className="h-full rounded-[28px] border border-line bg-white p-8 shadow-card sm:p-10">
            <div className="pointer-events-none absolute -bottom-24 -right-16 -z-10 size-72 rounded-full bg-flame-200/40 blur-[90px]" />
            <span className="grid size-11 place-items-center rounded-xl bg-navy-900 text-white shadow-glow">
              <Layers className="size-5" />
            </span>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-flame-600">For solution providers</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[30px]">Reach relevant opportunities</h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-3">
              List your solutions, get verified by Elets and receive requirements matched to your real capabilities, not your advertising budget.
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
          </Spotlight>
        </Reveal>
      </div>
    </section>
  );
}
