"use client";

import Link from "next/link";
import { ArrowRight, Check, Mail, Phone, Scale } from "lucide-react";
import { useStore } from "@/lib/store";
import { pricingOf, priceLabel, safeHref } from "@/lib/pricing";
import type { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { Aurora, Spotlight, WordReveal } from "./motion-kit";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export function PricingPage() {
  const content = useStore((s) => s.content);
  const pricing = pricingOf(content);
  const group = (g: PricingPlan["group"]) => pricing.plans.filter((p) => p.group === g);
  const forOrgs = [...group("buyers"), ...group("pro")];
  const forProviders = group("providers");

  return (
    <div>
      <section className="relative -mt-16 overflow-hidden border-b border-line pt-16">
        <Aurora />
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_0%,black,transparent)]" />
        <div className={cn(CONTAINER, "relative py-16 text-center sm:py-24")}>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-flame-600">
            <span className="h-px w-5 bg-flame-500/70" /> Pricing <span className="h-px w-5 bg-flame-500/70" />
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[56px]">
            <WordReveal text={pricing.headline} wordClassName="text-brand-gradient" />
          </h1>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-3 sm:text-[17px]">{pricing.subtext}</p>
          </Reveal>
        </div>
      </section>

      {forOrgs.length > 0 && (
        <section className={cn(CONTAINER, "py-14 sm:py-16")}>
          <h2 className="text-xl font-semibold tracking-tight text-ink">For organisations</h2>
          <p className="mt-1 text-sm text-ink-3">Find, evaluate and engage the right technology partner.</p>
          <div className={cn("mt-6 grid gap-5", forOrgs.length > 1 && "md:grid-cols-2")}>
            {forOrgs.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.05}>
                <PlanCard plan={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {forProviders.length > 0 && (
        <section className="border-y border-line bg-canvas">
          <div className={cn(CONTAINER, "py-14 sm:py-16")}>
            <h2 className="text-xl font-semibold tracking-tight text-ink">For technology providers</h2>
            <p className="mt-1 text-sm text-ink-3">Get verified, get matched on merit, and choose your visibility.</p>
            <div className={cn("mt-6 grid gap-5", forProviders.length === 2 && "md:grid-cols-2", forProviders.length >= 3 && "md:grid-cols-2 lg:grid-cols-3")}>
              {forProviders.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.05}>
                  <PlanCard plan={p} />
                </Reveal>
              ))}
            </div>
            {pricing.note && (
              <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-navy-100 bg-white px-4 py-3 text-[13px] leading-relaxed text-navy-700 shadow-xs">
                <Scale className="mt-0.5 size-4 shrink-0" /> {pricing.note}
              </p>
            )}
          </div>
        </section>
      )}

      <section className={cn(CONTAINER, "py-14 sm:py-16")}>
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-navy-950 p-6 text-white sm:p-10 md:flex-row md:items-center md:justify-between">
          <Aurora dark className="opacity-70" />
          <div className="relative">
            <h2 className="text-xl font-semibold tracking-tight">Questions about pricing?</h2>
            <p className="mt-1.5 text-sm text-navy-300">Talk to the Elets team about listings, Elets Pro or anything else.</p>
          </div>
          <div className="relative flex flex-col gap-2 text-sm sm:flex-row sm:gap-3">
            <Button variant="white" asChild>
              <a href="mailto:info@elets.in">
                <Mail /> info@elets.in
              </a>
            </Button>
            <Button variant="outline-dark" asChild>
              <a href="tel:+919910998068">
                <Phone /> +91 99109 98068
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanCard({ plan }: { plan: PricingPlan }) {
  const href = safeHref(plan.ctaHref);
  const external = !href.startsWith("/");
  return (
    <Spotlight
      className={cn(
        "flex h-full flex-col rounded-3xl border bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-raised",
        plan.highlight ? "border-navy-900/80 shadow-raised ring-4 ring-navy-50" : "border-line",
      )}
    >
      {plan.highlight && <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy-900 via-brand-600 to-flame-600" />}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
        {plan.highlight && <span className="rounded-full bg-flame-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-flame-700">Recommended</span>}
      </div>
      <p className="mt-1.5 min-h-10 text-[13px] leading-relaxed text-ink-3">{plan.description}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-[34px] font-semibold tracking-[-0.03em] text-navy-900">{priceLabel(plan)}</span>
        {plan.price.trim() && plan.period.trim() && <span className="text-sm text-ink-3">{plan.period}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.filter(Boolean).map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-2">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-navy-900 text-white">
              <Check className="size-2.5" strokeWidth={3} />
            </span>{" "}
            {f}
          </li>
        ))}
      </ul>
      {plan.ctaLabel.trim() && (
        <Button className="mt-7 w-full" variant={plan.highlight ? "flame" : "secondary"} asChild>
          {external ? (
            <a href={href}>
              {plan.ctaLabel} <ArrowRight />
            </a>
          ) : (
            <Link href={href}>
              {plan.ctaLabel} <ArrowRight />
            </Link>
          )}
        </Button>
      )}
    </Spotlight>
  );
}
