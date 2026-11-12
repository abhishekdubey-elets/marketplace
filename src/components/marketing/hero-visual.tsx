"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Check, ClipboardList, ShieldCheck, Sparkles } from "lucide-react";
import { DIMENSION_META, rankProviders } from "@/lib/matching";
import { MATCH_DIMENSIONS, PRO_MODULES } from "@/lib/types";
import { BUDGET_LABELS, CATEGORIES, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { PROVIDERS } from "@/lib/data/providers";
import { REQUIREMENTS } from "@/lib/data/buyers";
import { cn } from "@/lib/utils";

/**
 * Stylised "match console" for the homepage, run through the real matching engine
 * on a bundled fictional example (not marketplace data, and nothing links to it).
 */
const EXAMPLE_REQUIREMENT = REQUIREMENTS.find((r) => r.id === "r-141") ?? REQUIREMENTS[0];

/** Monogram tiles in the brand palette, instead of each sample provider's own colours. */
const MONO = [
  "from-navy-700 via-navy-900 to-navy-950",
  "from-flame-500 via-flame-600 to-flame-800",
  "from-brand-500 via-brand-600 to-navy-900",
];

function Monogram({ text, i, active }: { text: string; i: number; active: boolean }) {
  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br text-[12px] font-bold tracking-wide text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(11_31_77/0.6)] transition-transform duration-300",
        MONO[i % MONO.length],
        active && "scale-105",
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
      <span className="relative">{text}</span>
    </span>
  );
}

/** Score ring with a royal → navy → red gradient stroke that draws itself in. */
function GradientRing({ score, size = 44, stroke = 4, id }: { score: number; size?: number; stroke?: number; id: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2b4bc8" />
            <stop offset="0.55" stopColor="#0b1f4d" />
            <stop offset="1" stopColor="#e5202e" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f7" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums tracking-tight text-navy-900">
        {score}
        <span className="text-[0.75em] font-semibold text-ink-4">%</span>
      </span>
    </div>
  );
}

/** Solid verified seal. */
function Verified() {
  return <BadgeCheck className="size-4 shrink-0 fill-brand-600 text-white" aria-label="Verified" />;
}

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
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white/95 shadow-overlay backdrop-blur">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
          <span className="ml-3 truncate font-mono text-[11px] text-ink-4">elets / matching / illustrative example</span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold text-white">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-flame-400" />
              <span className="relative size-1.5 rounded-full bg-flame-500" />
            </span>
            Live
          </span>
        </div>

        {/* scanning beam on every new match */}
        <motion.div
          key={active}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-10 h-24 bg-gradient-to-b from-transparent via-brand-500/[0.07] to-transparent"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 260, opacity: [0, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_14px_-6px_rgb(11_31_77/0.7)]">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent" />
              <ClipboardList className="relative size-[18px]" />
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-flame-500 ring-2 ring-white" />
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
                const on = i === active;
                return (
                  <li key={m.providerId}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      className={cn("relative flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition duration-300", on ? "border-transparent" : "border-line bg-white hover:border-line-strong")}
                    >
                      {on && (
                        <motion.span
                          layoutId="hero-active"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-navy-50 via-white to-flame-50/60 shadow-raised ring-1 ring-navy-200"
                          transition={{ type: "spring", stiffness: 260, damping: 28 }}
                        />
                      )}
                      <Monogram text={p.logo.initials} i={i} active={on} />
                      <span className="relative min-w-0 flex-1">
                        <span className="flex items-center gap-1 truncate text-[13px] font-semibold text-ink">
                          {p.name}
                          {p.verification === "verified" && <Verified />}
                        </span>
                        <span className="block truncate text-[11px] text-ink-3">{m.label}</span>
                      </span>
                      <span className="relative">
                        <GradientRing score={m.score} id={`hero-ring-${i}`} />
                      </span>
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
              <AnimatePresence mode="wait">
                <motion.p
                  key={top.providerId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-snug text-navy-700"
                >
                  <span className="mt-px grid size-3.5 shrink-0 place-items-center rounded-full bg-flame-600 text-white">
                    <Check className="size-2.5" strokeWidth={3.5} />
                  </span>
                  {top.reasons[0]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* floating: Pro journey */}
      <div className="relative mt-3 rounded-2xl border border-white/10 bg-navy-950 p-3.5 text-white shadow-overlay animate-float sm:absolute sm:-bottom-10 sm:-left-8 sm:mt-0 sm:w-[340px]">
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-flame-500 to-flame-700 shadow-flame">
            <Sparkles className="size-3.5 text-white" />
          </span>
          Elets Pro engagement
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
      <div className="absolute -right-6 -top-8 hidden w-[230px] rounded-2xl border border-line bg-white/95 p-3 shadow-raised backdrop-blur animate-float [animation-delay:-3s] sm:block">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-navy-800 to-navy-950 text-white shadow-glow">
            <ShieldCheck className="size-4" />
          </span>
          <p className="text-[12px] font-semibold text-ink">Ranking integrity</p>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-ink-3">Paid listings are excluded from match scores.</p>
      </div>
    </div>
  );
}
