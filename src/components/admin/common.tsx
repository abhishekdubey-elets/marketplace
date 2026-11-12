"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LISTING_LABEL } from "@/lib/labels";
import type { ListingPackage, Provider } from "@/lib/types";
import { TEAM } from "@/lib/data/taxonomy";
import { SAMPLE_DATA } from "@/lib/seed";

/** Shown on figures that come from the fictional sample dataset; hidden for real data. */
export const DEMO_TAG = !SAMPLE_DATA ? null : (
  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
    Demo data
  </span>
);

/** Compact labelled filter select used in table toolbars. */
export function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("w-full sm:w-44", className)}>
      <Select size="sm" ariaLabel={label} value={value} onValueChange={onChange} options={[{ value: "all", label: `All ${label.toLowerCase()}` }, ...options]} />
    </div>
  );
}

export function ListingBadge({ listing }: { listing: ListingPackage }) {
  return (
    <Badge tone={listing === "premium" ? "violet" : listing === "featured" ? "blue" : "neutral"}>
      {LISTING_LABEL[listing].replace(" listing", "")}
    </Badge>
  );
}

export function EligibilityBadge({ provider }: { provider: Pick<Provider, "matchingEligible" | "accountStatus"> }) {
  if (provider.accountStatus === "suspended") return <Badge tone="red" dot>Suspended</Badge>;
  return provider.matchingEligible ? (
    <Badge tone="teal" dot>
      Eligible
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      Not eligible
    </Badge>
  );
}

export const TEAM_OPTIONS = TEAM.map((t) => ({ value: t.id, label: t.name }));

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function monthKey(d: string) {
  return d.slice(0, 7);
}

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${M[Number(m) - 1]} ${y.slice(2)}`;
}

/** Inclusive list of month keys between two keys. */
export function monthRange(from: string, to: string) {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export function MiniStat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-subtle/60 px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-4">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {hint && <p className="text-[11px] text-ink-3">{hint}</p>}
    </div>
  );
}
