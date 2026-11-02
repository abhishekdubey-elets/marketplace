"use client";

import * as React from "react";
import Link from "next/link";
import { Check, GitCompareArrows, Minus, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { DIMENSION_META, scoreMatch, scoreTone, toMatchable } from "@/lib/matching";
import { MATCH_DIMENSIONS } from "@/lib/types";
import type { Provider } from "@/lib/types";
import { BUDGET_LABELS, SIZE_LABELS } from "@/lib/data/taxonomy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { EmptyState, PageHeader, ProviderLogo, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { IntegrityNote } from "@/components/shared/domain";

const BAR: Record<string, string> = { strong: "#14ae9f", good: "#2149e8", partial: "#e8a33d", low: "#98a2b3" };

export default function ComparePage() {
  const user = useUser();
  const L = useLookups();
  const compare = useStore((s) => s.compare);
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const categories = useStore((s) => s.categories);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);

  const myReqs = requirements.filter((r) => r.buyerId === user.orgId);
  const [reqId, setReqId] = React.useState(myReqs.find((r) => r.stage !== "completed")?.id ?? myReqs[0]?.id ?? "");
  const req = myReqs.find((r) => r.id === reqId);
  const list = compare.map((id) => providers.find((p) => p.id === id)).filter((p): p is Provider => !!p);
  const results = list.map((p) => (req ? scoreMatch(req, toMatchable(p), categories) : null));
  const addable = providers.filter((p) => p.accountStatus === "active" && !compare.includes(p.id));

  const best = (vals: (number | null | undefined)[]) => {
    const nums = vals.filter((v): v is number => typeof v === "number");
    return nums.length > 1 ? Math.max(...nums) : null;
  };

  if (list.length === 0) {
    return (
      <div>
        <PageHeader title="Compare providers" description="Compare up to four providers side by side across all eight matching dimensions." />
        <Card>
          <EmptyState
            icon={<GitCompareArrows />}
            title="No providers selected"
            description="Add providers to the comparison from discovery, a provider profile or your requirement matches."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/buyer/discover">Explore providers</Link>
                </Button>
                <div className="w-60">
                  <Select value="" placeholder="Or add a provider…" onValueChange={(v) => toggleCompare(v)} options={addable.map((p) => ({ value: p.id, label: p.name }))} />
                </div>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  const overallBest = best(results.map((r) => r?.score));
  const cols = list.length + (list.length < 4 ? 1 : 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compare providers"
        description="Side-by-side view across the eight explainable matching dimensions, credentials and coverage."
        actions={
          <>
            <div className="w-72">
              <Select ariaLabel="Requirement context" value={reqId} onValueChange={setReqId} options={myReqs.map((r) => ({ value: r.id, label: `Scored for ${r.code} — ${r.title}` }))} />
            </div>
            <Button variant="secondary" onClick={() => { clearCompare(); toast.success("Comparison cleared"); }}>
              Clear all
            </Button>
          </>
        }
      />
      <IntegrityNote />
      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 192 + cols * 220 }}>
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 w-48 bg-white px-4 py-4 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                  {list.length} of 4 providers
                </th>
                {list.map((p) => (
                  <th key={p.id} className="min-w-[220px] px-4 py-4 text-left align-top font-normal">
                    <div className="flex items-start gap-3">
                      <ProviderLogo provider={p} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/buyer/providers/${p.slug}`} className="block truncate text-[13px] font-semibold text-ink hover:text-brand-700">{p.name}</Link>
                        <div className="mt-1"><VerificationBadge status={p.verification} compact /></div>
                      </div>
                      <button onClick={() => toggleCompare(p.id)} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-4 hover:bg-navy-50 hover:text-ink" aria-label={`Remove ${p.name}`}>
                        <X className="size-4" />
                      </button>
                    </div>
                  </th>
                ))}
                {list.length < 4 && (
                  <th className="min-w-[200px] px-4 py-4 text-left align-top font-normal">
                    <div className="rounded-xl border border-dashed border-line-strong p-3">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-3"><Plus className="size-3.5" /> Add provider</p>
                      <Select size="sm" value="" placeholder="Choose…" onValueChange={(v) => toggleCompare(v)} options={addable.map((p) => ({ value: p.id, label: p.name }))} />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <CompareRow pad={list.length < 4} label="Overall match" sub={req ? `for ${req.code}` : "Select a requirement"}>
                {list.map((p, i) => {
                  const r = results[i];
                  return (
                    <td key={p.id} className={cn("px-4 py-3", r && r.score === overallBest && "bg-accent-50/50")}>
                      {r ? (
                        <div className="flex items-center gap-3">
                          <ScoreRing score={r.score} size={52} />
                          <div>
                            <p className="text-xs font-medium text-ink">{r.label}</p>
                            {r.score === overallBest && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-700"><Trophy className="size-3" /> Highest</p>}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </td>
                  );
                })}
              </CompareRow>
              {MATCH_DIMENSIONS.map((d) => {
                const b = best(results.map((r) => r?.dimensions[d]));
                return (
                  <CompareRow pad={list.length < 4} key={d} label={DIMENSION_META[d].label} sub={`Weight ${DIMENSION_META[d].weight}%`}>
                    {list.map((p, i) => {
                      const v = results[i]?.dimensions[d];
                      return (
                        <td key={p.id} className={cn("px-4 py-3", v !== undefined && v === b && "bg-accent-50/50")}>
                          {v !== undefined ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                                <div className="h-full rounded-full" style={{ width: `${v}%`, background: BAR[scoreTone(v)] }} />
                              </div>
                              <span className="w-7 text-right text-xs font-semibold tabular-nums text-ink">{v}</span>
                            </div>
                          ) : (
                            <span className="text-ink-4">—</span>
                          )}
                        </td>
                      );
                    })}
                  </CompareRow>
                );
              })}
              <SectionRow cols={cols}>Company</SectionRow>
              <CompareRow pad={list.length < 4} label="Headquarters">{list.map((p) => <Cell key={p.id}>{p.hq}</Cell>)}</CompareRow>
              <CompareRow pad={list.length < 4} label="Founded">{list.map((p) => <Cell key={p.id}>{p.founded}</Cell>)}</CompareRow>
              <CompareRow pad={list.length < 4} label="Company size">{list.map((p) => <Cell key={p.id}>{SIZE_LABELS[p.size]}</Cell>)}</CompareRow>
              <CompareRow pad={list.length < 4} label="Coverage">{list.map((p) => <Cell key={p.id}>{p.regions.map(L.regionName).join(", ")}</Cell>)}</CompareRow>
              <SectionRow cols={cols}>Capabilities & credentials</SectionRow>
              <CompareRow pad={list.length < 4} label="Categories">{list.map((p) => <Cell key={p.id}>{p.categories.map(L.categoryName).join(", ")}</Cell>)}</CompareRow>
              <CompareRow pad={list.length < 4} label="Certifications" sub={req?.compliance.length ? "✓ = required by your requirement" : undefined}>
                {list.map((p) => (
                  <td key={p.id} className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {p.certifications.length === 0 && <span className="text-xs text-ink-4">None listed</span>}
                      {p.certifications.map((c) => {
                        const required = req?.compliance.includes(c);
                        return (
                          <span key={c} className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", required ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-subtle text-ink-2 ring-line")}>
                            {required && <Check className="size-3" />} {c}
                          </span>
                        );
                      })}
                    </div>
                    {req && req.compliance.filter((c) => !p.certifications.includes(c)).length > 0 && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700">
                        <Minus className="size-3" /> Missing: {req.compliance.filter((c) => !p.certifications.includes(c)).join(", ")}
                      </p>
                    )}
                  </td>
                ))}
              </CompareRow>
              <CompareRow pad={list.length < 4} label="Case studies">
                {list.map((p) => (
                  <Cell key={p.id}>
                    <span className="font-semibold text-ink">{p.caseStudies.length}</span>
                    {req && <span className="text-ink-3"> · {p.caseStudies.filter((c) => c.industryId === req.industryId).length} in sector</span>}
                  </Cell>
                ))}
              </CompareRow>
              <CompareRow pad={list.length < 4} label="Typical engagement size">{list.map((p) => <Cell key={p.id}>{p.budgetBands.map((b) => BUDGET_LABELS[b]).join(" · ")}</Cell>)}</CompareRow>
              <CompareRow pad={list.length < 4} label="Solutions">{list.map((p) => <Cell key={p.id}>{p.solutions.map((s) => s.name).join(", ")}</Cell>)}</CompareRow>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-4 py-4" />
                {list.map((p) => (
                  <td key={p.id} className="px-4 py-4">
                    <Button variant="secondary" size="sm" asChild className="w-full">
                      <Link href={`/buyer/providers/${p.slug}`}>View profile</Link>
                    </Button>
                  </td>
                ))}
                {list.length < 4 && <td />}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CompareRow({ label, sub, pad, children }: { label: React.ReactNode; sub?: React.ReactNode; pad: boolean; children: React.ReactNode }) {
  return (
    <tr className="border-b border-line/70 last:border-0">
      <th scope="row" className="sticky left-0 z-10 w-48 min-w-48 bg-white px-4 py-3 text-left align-top text-[13px] font-medium text-ink-2">
        {label}
        {sub && <span className="mt-0.5 block text-[11px] font-normal text-ink-4">{sub}</span>}
      </th>
      {children}
      {pad && <td className="min-w-[200px] px-4 py-3" />}
    </tr>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-[13px] leading-relaxed text-ink-2">{children}</td>;
}

function SectionRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr className="border-b border-line bg-subtle/70">
      <th colSpan={cols + 1} className="sticky left-0 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-4">
        {children}
      </th>
    </tr>
  );
}
