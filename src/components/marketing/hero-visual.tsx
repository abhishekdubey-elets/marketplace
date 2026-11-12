"use client";

import * as React from "react";
import { BadgeCheck, Check, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import { DIMENSION_META, rankProviders } from "@/lib/matching";
import { MATCH_DIMENSIONS, PRO_MODULES } from "@/lib/types";
import { ProviderLogo, ScoreRing } from "@/components/ui/misc";
import { BUDGET_LABELS, CATEGORIES, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { PROVIDERS } from "@/lib/data/providers";
import { REQUIREMENTS } from "@/lib/data/buyers";
import { cn } from "@/lib/utils";

/**
 * Stylised "match console" for the homepage, run through the real matching engine
 * on a bundled fictional example (not marketplace data, and nothing links to it).
 */
const EXAMPLE_REQUIREMENT = REQUIREMENTS.find((r) => r.id === "r-141") ?? REQUIREMENTS[0];

export function HeroVisual() {
  const requirement = EXAMPLE_REQUIREMENT;
  const providers = PROVIDERS;
  const categories = CATEGORIES;
  const ranked = React.useMemo(() => (requirement ? rankProviders(requirement, providers, categories).slice(0, 3) : []), [requirement, providers, categories]);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % Math.max(1, ranked.length)), 3200);
    return () => clearInterval(t);
  }, [ranked.length]);

  if (!requirement || ranked.length === 0) return null;
  const top = ranked[active] ?? ranked[0];
  const byId = (id: string) => providers.find((p) => p.id === id)!;

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
      {/* glow */}
      <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(55%_55%_at_65%_35%,rgb(229_32_46/0.14),transparent_70%),radial-gradient(60%_60%_at_35%_65%,rgb(43_75_200/0.16),transparent_70%)]" />

      {/* main console */}
      <div className="relative rounded-2xl border border-line bg-white/95 shadow-overlay backdrop-blur">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
          <span className="ml-3 truncate font-mono text-[11px] text-ink-4">elets / matching / illustrative example</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-500" /> Live
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-900 text-white">
              <ClipboardList className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">Buyer requirement</p>
              <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-ink">{requirement.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[BUDGET_LABELS[requirement.budget], TIMELINE_LABELS[requirement.timeline], ...requirement.compliance.slice(0, 1)].map((t) => (
                  <span key={t} className="rounded-md bg-subtle px-1.5 py-0.5 text-[10px] font-medium text-ink-3 ring-1 ring-inset ring-line">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_190px]">
            <ul className="space-y-2">
              {ranked.map((m, i) => {
                const p = byId(m.providerId);
                return (
                  <li key={m.providerId}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition",
                        i === active ? "border-navy-200 bg-navy-50/70 shadow-xs ring-1 ring-navy-100" : "border-line bg-white hover:border-line-strong",
                      )}
                    >
                      <ProviderLogo provider={p} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-[13px] font-medium text-ink">
                          {p.name}
                          {p.verification === "verified" && <BadgeCheck className="size-3.5 shrink-0 text-emerald-600" />}
                        </span>
                        <span className="block truncate text-[11px] text-ink-3">{m.label}</span>
                      </span>
                      <ScoreRing score={m.score} size={38} stroke={3.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="rounded-xl border border-line bg-subtle/60 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-4">Why this match</p>
              <div className="space-y-1.5">
                {MATCH_DIMENSIONS.map((d) => (
                  <div key={d} className="grid grid-cols-[1fr_44px] items-center gap-2">
                    <span className="truncate text-[10px] text-ink-3">{DIMENSION_META[d].label.split(" ")[0]}</span>
                    <span className="h-1 overflow-hidden rounded-full bg-navy-100">
                      <span className="block h-full rounded-full bg-gradient-to-r from-navy-900 to-flame-500 transition-all duration-700" style={{ width: `${top.dimensions[d]}%` }} />
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 flex items-start gap-1 text-[10px] leading-snug text-accent-700">
                <Check className="mt-px size-3 shrink-0" /> {top.reasons[0]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* floating: Pro journey */}
      <div className="relative mt-3 rounded-2xl border border-white/10 bg-navy-950 p-3.5 text-white shadow-overlay animate-float sm:absolute sm:-bottom-10 sm:-left-8 sm:mt-0 sm:w-[340px]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Sparkles className="size-3.5 text-flame-400" /> Elets Pro engagement
          <span className="ml-auto font-normal text-navy-300">Stage 4 of 8</span>
        </div>
        <div className="mt-2.5 flex gap-1">
          {PRO_MODULES.map((m, i) => (
            <span key={m.key} title={m.name} className={cn("h-1.5 flex-1 rounded-full", i < 3 ? "bg-brand-400" : i === 3 ? "bg-flame-500" : "bg-white/15")} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-navy-300">Due diligence in progress · relationship manager assigned</p>
      </div>

      {/* floating: integrity */}
      <div className="absolute -right-6 -top-8 hidden w-[220px] rounded-2xl border border-line bg-white p-3 shadow-raised animate-float [animation-delay:-3s] sm:block">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-flame-50 text-flame-600">
            <ShieldCheck className="size-4" />
          </span>
          <p className="text-[12px] font-semibold text-ink">Ranking integrity</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-ink-3">Paid listings are excluded from match scores.</p>
      </div>
    </div>
  );
}
