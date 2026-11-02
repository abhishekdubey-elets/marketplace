"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { scoreMatch, toMatchable } from "@/lib/matching";
import type { BuyerOrg, Match, MatchResult, Provider, Requirement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/lib/labels";

/** Statuses an Elets-reviewed match can have; suggested/rejected stay internal to Elets. */
export const VISIBLE_MATCH: Match["status"][] = ["approved", "shortlisted", "intro_requested", "introduced"];

export const MONTHS_12 = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

export function useCurrentProvider(): Provider | undefined {
  const user = useUser();
  return useStore((s) => s.providers.find((p) => p.id === user.orgId));
}

export interface ProviderOpp {
  match: Match;
  requirement: Requirement;
  buyer: BuyerOrg | undefined;
  result: MatchResult;
}

/** Elets-approved matches for the current provider, scored live by the matching engine. */
export function useProviderOpportunities(providerId: string | undefined): ProviderOpp[] {
  const matches = useStore((s) => s.matches);
  const requirements = useStore((s) => s.requirements);
  const buyers = useStore((s) => s.buyers);
  const provider = useStore((s) => s.providers.find((p) => p.id === providerId));
  const categories = useStore((s) => s.categories);
  return React.useMemo(() => {
    if (!provider) return [];
    const mp = toMatchable(provider);
    return matches
      .filter((m) => m.providerId === provider.id && VISIBLE_MATCH.includes(m.status))
      .map((m) => {
        const requirement = requirements.find((r) => r.id === m.requirementId);
        if (!requirement) return null;
        return { match: m, requirement, buyer: buyers.find((b) => b.id === requirement.buyerId), result: scoreMatch(requirement, mp, categories) };
      })
      .filter(Boolean) as ProviderOpp[];
  }, [matches, requirements, buyers, provider, categories]);
}

const TYPE_SHORT: Record<string, string> = {
  "Government Department": "Government department",
  "Public Sector Undertaking": "Public sector undertaking",
  "Hospital / Health System": "Hospital group",
  "University / Institute": "University",
  "School Network": "School network",
  "Bank / NBFC": "Bank / NBFC",
  Insurance: "Insurer",
  "Urban Local Body": "Municipal body",
};

/** Buyers stay anonymous to providers until Elets makes the introduction. */
export function buyerLabel(o: Pick<ProviderOpp, "match" | "buyer" | "requirement">, names: { industry: (id: string) => string; region: (id: string) => string }) {
  if (o.match.status === "introduced" && o.buyer) return o.buyer.name;
  const t = o.buyer ? TYPE_SHORT[o.buyer.type] ?? o.buyer.type : "Organisation";
  const region = o.requirement.regions[0] ? names.region(o.requirement.regions[0]) : "India";
  return `${t} · ${names.industry(o.requirement.industryId)} · ${region}`;
}

export function interestBadge(i: Match["providerInterest"]) {
  const map: Record<Match["providerInterest"], { tone: Tone; label: string }> = {
    none: { tone: "amber", label: "Awaiting your response" },
    interested: { tone: "green", label: "Interested" },
    declined: { tone: "neutral", label: "Not a fit" },
  };
  const m = map[i];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** Provider-facing wording for match status. */
export const PROVIDER_MATCH_LABEL: Record<Match["status"], { label: string; tone: Tone }> = {
  suggested: { label: "Under Elets review", tone: "amber" },
  approved: { label: "Shared with buyer", tone: "blue" },
  rejected: { label: "Not progressed", tone: "red" },
  shortlisted: { label: "Shortlisted by buyer", tone: "violet" },
  intro_requested: { label: "Introduction requested", tone: "teal" },
  introduced: { label: "Introduced", tone: "green" },
};

export function useCapabilityVocabulary() {
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  return React.useMemo(
    () => Array.from(new Set([...providers.flatMap((p) => p.capabilities), ...requirements.flatMap((r) => r.capabilities)])).sort(),
    [providers, requirements],
  );
}

/** Tag input with suggestions — Enter or comma adds a tag. */
export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  invalid,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  invalid?: boolean;
}) {
  const [q, setQ] = React.useState("");
  const [focus, setFocus] = React.useState(false);
  const add = (t: string) => {
    const v = t.trim();
    if (!v || value.some((x) => x.toLowerCase() === v.toLowerCase())) return setQ("");
    onChange([...value, v]);
    setQ("");
  };
  const open = focus && q.length > 0;
  const sugg = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  const idle = suggestions.filter((s) => !value.includes(s)).slice(0, 8);
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2 py-1.5 shadow-xs transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100",
          invalid && "border-red-400",
        )}
      >
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-4 place-items-center rounded hover:bg-brand-100" aria-label={`Remove ${t}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(q);
            } else if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-ink-4"
        />
        {open && (sugg.length > 0 || q.trim()) && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-line bg-white p-1 shadow-overlay">
            {sugg.map((s) => (
              <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)} className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-2 hover:bg-navy-50">
                {s}
              </button>
            ))}
            {q.trim() && !sugg.some((s) => s.toLowerCase() === q.trim().toLowerCase()) && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(q)} className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-brand-700 hover:bg-brand-50">
                <Plus className="size-3.5" /> Add “{q.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
      {idle.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-ink-4">Suggestions:</span>
          {idle.map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-1 rounded-md border border-dashed border-line-strong px-1.5 py-0.5 text-[11px] text-ink-3 transition hover:border-brand-400 hover:text-brand-700">
              <Plus className="size-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const LOGO_PRESETS: { from: string; to: string }[] = [
  { from: "#3565fb", to: "#14ae9f" },
  { from: "#0c1631", to: "#3565fb" },
  { from: "#0d8c82", to: "#2fcbbb" },
  { from: "#1d307b", to: "#5b86ff" },
  { from: "#7c3aed", to: "#3565fb" },
  { from: "#0b1224", to: "#0d8c82" },
  { from: "#f59e0b", to: "#3565fb" },
  { from: "#132042", to: "#0d8c82" },
];
