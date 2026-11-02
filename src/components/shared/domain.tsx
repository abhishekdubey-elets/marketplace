"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleAlert, GitCompareArrows, Heart, Info, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import type { MatchResult, Provider, Requirement, RequirementStage } from "@/lib/types";
import { MATCH_DIMENSIONS, REQUIREMENT_STAGES } from "@/lib/types";
import { STAGE_LABEL, STAGE_SHORT, STAGE_TONE } from "@/lib/labels";
import { DIMENSION_META } from "@/lib/matching";
import { useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import { Badge } from "@/components/ui/badge";
import { DimensionBar, ProviderLogo, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/overlay";
import { SIZE_LABELS } from "@/lib/data/taxonomy";

// ------------------------------------------------------------------ requirement stages

export function StageBadge({ stage }: { stage: RequirementStage }) {
  return (
    <Badge tone={STAGE_TONE[stage]} dot>
      {STAGE_LABEL[stage]}
    </Badge>
  );
}

/** Horizontal 8-stage tracker: Submitted → … → Completed. */
export function StageTracker({ requirement, compact }: { requirement: Requirement; compact?: boolean }) {
  const idx = REQUIREMENT_STAGES.indexOf(requirement.stage);
  const at = (s: RequirementStage) => requirement.history.find((h) => h.stage === s)?.at;
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <ol className={cn("flex min-w-[720px] items-start", compact && "min-w-[560px]")}>
        {REQUIREMENT_STAGES.map((s, i) => {
          const done = i < idx || requirement.stage === "completed";
          const current = i === idx && requirement.stage !== "completed";
          return (
            <li key={s} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && <span className={cn("absolute right-1/2 top-[13px] h-0.5 w-full -translate-y-1/2", i <= idx ? "bg-brand-500" : "bg-line")} />}
              <span
                className={cn(
                  "relative z-10 grid size-[26px] place-items-center rounded-full border-2 text-[11px] font-semibold transition",
                  done && "border-brand-600 bg-brand-600 text-white",
                  current && "border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100",
                  !done && !current && "border-line-strong bg-white text-ink-4",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                {current && <span className="absolute inset-0 -z-10 rounded-full bg-brand-400 animate-pulse-ring" />}
              </span>
              <span className={cn("mt-2 px-1 text-[11px] font-medium leading-tight", current ? "text-ink" : done ? "text-ink-2" : "text-ink-4")}>{compact ? STAGE_SHORT[s] : STAGE_LABEL[s]}</span>
              {!compact && <span className="mt-0.5 text-[10px] text-ink-4">{at(s) ? formatDate(at(s)!, { year: false }) : " "}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function StageHistory({ requirement }: { requirement: Requirement }) {
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {[...requirement.history].reverse().map((h, i) => (
        <li key={h.stage + h.at} className="relative">
          <span className={cn("absolute -left-[26px] top-1 size-3 rounded-full border-2 border-white", i === 0 ? "bg-brand-600 ring-4 ring-brand-100" : "bg-navy-200")} />
          <p className="text-[13px] font-medium text-ink">{STAGE_LABEL[h.stage]}</p>
          <p className="text-xs text-ink-3">
            {formatDate(h.at)} · {person(h.by).name}
          </p>
          {h.note && <p className="mt-1 text-xs leading-relaxed text-ink-3">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------ matching

export function IntegrityNote({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border border-accent-100 bg-accent-50/60 p-3 text-xs leading-relaxed text-accent-700", className)}>
      <ShieldCheck className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="font-semibold">Integrity principle:</span> match scores are computed only from capability, experience and compliance data. Paid listing packages are excluded from the
        matching engine and never influence rankings. Scores shown are illustrative demo values.
      </p>
    </div>
  );
}

export function MatchExplanation({ result, compact }: { result: MatchResult; compact?: boolean }) {
  return (
    <div className={cn("grid gap-5", !compact && "md:grid-cols-[1fr_1fr]")}>
      <div className="space-y-2.5">
        {MATCH_DIMENSIONS.map((d) => (
          <Tooltip key={d} content={DIMENSION_META[d].description} side="left">
            <div>
              <DimensionBar label={DIMENSION_META[d].label} value={result.dimensions[d]} weight={compact ? undefined : DIMENSION_META[d].weight} />
            </div>
          </Tooltip>
        ))}
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Why recommended</p>
          <ul className="space-y-1.5">
            {result.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-[13px] text-ink-2">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        {result.gaps.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Points to verify</p>
            <ul className="space-y-1.5">
              {result.gaps.map((g) => (
                <li key={g} className="flex items-start gap-2 text-[13px] text-ink-3">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchScoreBlock({ result, size = 64 }: { result: MatchResult; size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <ScoreRing score={result.score} size={size} />
      <div>
        <p className="text-[13px] font-semibold text-ink">{result.score}% Match</p>
        <p className="text-xs text-ink-3">{result.label}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ provider card

export function ProviderCard({
  provider,
  href,
  match,
  showActions = true,
  className,
}: {
  provider: Provider;
  href: string;
  match?: MatchResult | null;
  showActions?: boolean;
  className?: string;
}) {
  const L = useLookups();
  const favourites = useStore((s) => s.favourites);
  const compare = useStore((s) => s.compare);
  const toggleFav = useStore((s) => s.toggleFavourite);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const fav = favourites.includes(provider.id);
  const inCompare = compare.includes(provider.id);

  return (
    <div className={cn("group relative flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised", className)}>
      <div className="flex items-start gap-3.5">
        <ProviderLogo provider={provider} size="lg" />
        <div className="min-w-0 flex-1">
          <Link href={href} className="block truncate text-[15px] font-semibold tracking-tight text-ink after:absolute after:inset-0 hover:text-brand-700">
            {provider.name}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">{provider.tagline}</p>
        </div>
        {match && <ScoreRing score={match.score} size={48} stroke={4} />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <VerificationBadge status={provider.verification} compact />
        {provider.listing !== "standard" && (
          <Tooltip content="Paid listing package — display only. Does not affect match scores or ranking.">
            <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-ink-3 ring-1 ring-inset ring-navy-100">
              <Sparkles className="size-3" /> {provider.listing === "premium" ? "Premium" : "Featured"} listing
            </span>
          </Tooltip>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {provider.categories.slice(0, 3).map((c) => (
          <span key={c} className="rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-inset ring-line">
            {L.categoryName(c)}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {provider.hq.split(",")[0]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" />
          {SIZE_LABELS[provider.size].replace(" employees", "")}
        </span>
        <span>{provider.caseStudies.length} case studies</span>
      </div>
      {match && match.reasons[0] && (
        <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-accent-50/70 px-2.5 py-1.5 text-xs text-accent-700">
          <Info className="mt-px size-3.5 shrink-0" />
          {match.reasons[0]}
        </p>
      )}
      {showActions && (
        <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-line pt-3.5">
          <button
            onClick={() => {
              toggleFav(provider.id);
              toast.success(fav ? "Removed from saved providers" : "Saved to your shortlist", { description: provider.name });
            }}
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition", fav ? "text-rose-600 hover:bg-rose-50" : "text-ink-3 hover:bg-navy-50 hover:text-ink")}
            aria-pressed={fav}
          >
            <Heart className={cn("size-3.5", fav && "fill-current")} /> {fav ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => {
              const ok = toggleCompare(provider.id);
              if (!ok) toast.error("You can compare up to 4 providers");
              else toast.success(inCompare ? "Removed from comparison" : "Added to comparison", { description: provider.name });
            }}
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition", inCompare ? "text-brand-700 hover:bg-brand-50" : "text-ink-3 hover:bg-navy-50 hover:text-ink")}
            aria-pressed={inCompare}
          >
            <GitCompareArrows className="size-3.5" /> {inCompare ? "Comparing" : "Compare"}
          </button>
          <Link href={href} className="ml-auto text-xs font-medium text-brand-600 hover:underline">
            View profile →
          </Link>
        </div>
      )}
    </div>
  );
}
