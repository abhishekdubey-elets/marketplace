"use client";

import Link from "next/link";
import { ArrowRight, Check, Mail, Phone, Scale } from "lucide-react";
import { useStore } from "@/lib/store";
import { pricingOf, priceLabel, safeHref } from "@/lib/pricing";
import type { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export function PricingPage() {
  const content = useStore((s) => s.content);
  const pricing = pricingOf(content);
  const group = (g: PricingPlan["group"]) => pricing.plans.filter((p) => p.group === g);
  const forOrgs = [...group("buyers"), ...group("pro")];
  const forProviders = group("providers");

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-canvas">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className={cn(CONTAINER, "relative py-16 text-center sm:py-20")}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Pricing</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{pricing.headline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-3 sm:text-base">{pricing.subtext}</p>
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
              <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-[13px] leading-relaxed text-accent-700">
                <Scale className="mt-0.5 size-4 shrink-0" /> {pricing.note}
              </p>
            )}
          </div>
        </section>
      )}

      <section className={cn(CONTAINER, "py-14 sm:py-16")}>
        <div className="flex flex-col gap-6 rounded-2xl bg-navy-950 p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Questions about pricing?</h2>
            <p className="mt-1.5 text-sm text-navy-300">Talk to the Elets team about listings, Elets Pro or anything else.</p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-3">
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
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-white p-6 shadow-card",
        plan.highlight ? "border-brand-300 ring-4 ring-brand-50" : "border-line",
      )}
    >
      <h3 className="text-base font-semibold text-ink">{plan.name}</h3>
      <p className="mt-1.5 min-h-10 text-[13px] leading-relaxed text-ink-3">{plan.description}</p>
      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight text-ink">{priceLabel(plan)}</span>
        {plan.price.trim() && plan.period.trim() && <span className="text-sm text-ink-3">{plan.period}</span>}
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.filter(Boolean).map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-accent-600" /> {f}
          </li>
        ))}
      </ul>
      {plan.ctaLabel.trim() && (
        <Button className="mt-6 w-full" variant={plan.highlight ? "primary" : "secondary"} asChild>
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
    </div>
  );
}
