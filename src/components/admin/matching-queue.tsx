"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCheck, ChevronDown, Workflow, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE } from "@/lib/labels";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { cn, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, ProviderLogo, ScoreRing, StatCard, VerificationBadge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrityNote, MatchExplanation, StageBadge } from "@/components/shared/domain";

export function MatchingQueue() {
  const user = useUser();
  const L = useLookups();
  const matches = useStore((s) => s.matches);
  const requirements = useStore((s) => s.requirements);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const reviewMatch = useStore((s) => s.reviewMatch);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const pending = matches.filter((m) => m.status === "suggested");
  const groups = Array.from(new Set(pending.map((m) => m.requirementId)))
    .map((rid) => requirements.find((r) => r.id === rid))
    .filter((r): r is NonNullable<typeof r> => !!r);
  const reviewed = matches
    .filter((m) => m.status !== "suggested" && m.reviewedBy)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);

  const approvedCount = matches.filter((m) => !["suggested", "rejected"].includes(m.status)).length;
  const rejectedCount = matches.filter((m) => m.status === "rejected").length;
  const rate = Math.round((approvedCount / Math.max(1, approvedCount + rejectedCount)) * 100);

  return (
    <div>
      <PageHeader title="Matching review" description="Every engine suggestion is reviewed by the Elets team before buyers see it. Approve strong fits, remove unsuitable ones." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Awaiting review" value={pending.length} icon={<Workflow />} accent="amber" />
        <StatCard label="Requirements in queue" value={groups.length} icon={<Workflow />} />
        <StatCard label="Approved matches" value={approvedCount} icon={<Check />} accent="accent" />
        <StatCard label="Approval rate" value={`${rate}%`} icon={<CheckCheck />} accent="violet" hint="Approved vs removed" />
      </div>
      <IntegrityNote className="mb-5" />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {groups.length === 0 && (
            <Card>
              <EmptyState icon={<CheckCheck />} title="Review queue is clear" description="New suggestions appear here when the matching engine runs on a requirement." action={<Button variant="secondary" asChild><Link href="/admin/requirements">Go to requirements</Link></Button>} />
            </Card>
          )}
          {groups.map((r) => {
            const ms = pending
              .filter((m) => m.requirementId === r.id)
              .map((m) => ({ m, p: providers.find((p) => p.id === m.providerId)! }))
              .filter((x) => x.p)
              .map((x) => ({ ...x, res: scoreMatch(r, toMatchable(x.p), categories) }))
              .sort((a, b) => b.res.score - a.res.score);
            return (
              <Card key={r.id}>
                <CardHeader
                  title={
                    <Link href={`/admin/requirements/${r.id}`} className="hover:text-brand-700">
                      {r.title}
                    </Link>
                  }
                  description={`${r.code} · ${L.buyer(r.buyerId)?.name} · ${L.categoryName(r.categoryId)}`}
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        ms.forEach((x) => reviewMatch(x.m.id, "approved", user.id));
                        toast.success(`Approved ${ms.length} matches`, { description: r.code });
                      }}
                    >
                      <CheckCheck /> Approve all ({ms.length})
                    </Button>
                  }
                >
                  <div className="mt-2">
                    <StageBadge stage={r.stage} />
                  </div>
                </CardHeader>
                <div className="divide-y divide-line border-t border-line">
                  {ms.map(({ m, p, res }) => (
                    <div key={m.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <ScoreRing score={res.score} size={44} stroke={4} />
                        <ProviderLogo provider={p} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-ink-3">{res.label}</span>
                            <VerificationBadge status={p.verification} compact />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="xs"
                            onClick={() => {
                              reviewMatch(m.id, "approved", user.id);
                              toast.success("Match approved", { description: p.name });
                            }}
                          >
                            <Check /> Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => {
                              reviewMatch(m.id, "rejected", user.id);
                              toast.success("Match removed", { description: p.name });
                            }}
                          >
                            <X /> Remove
                          </Button>
                          <Button size="icon-xs" variant="ghost" aria-label="Toggle explanation" aria-expanded={expanded === m.id} onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                            <ChevronDown className={cn("transition", expanded === m.id && "rotate-180")} />
                          </Button>
                        </div>
                      </div>
                      {expanded === m.id && (
                        <div className="mt-3 rounded-xl border border-line bg-subtle/50 p-4 animate-fade-in">
                          <MatchExplanation result={res} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader title="Recently reviewed" description="Latest review decisions" />
          <CardContent className="space-y-3">
            {reviewed.length === 0 && <p className="text-[13px] text-ink-3">No reviews yet.</p>}
            {reviewed.map((m) => {
              const p = providers.find((x) => x.id === m.providerId);
              const r = requirements.find((x) => x.id === m.requirementId);
              if (!p || !r) return null;
              return (
                <Link key={m.id} href={`/admin/requirements/${r.id}`} className="group flex items-start gap-3 rounded-lg p-1.5 -m-1.5 hover:bg-subtle">
                  <ProviderLogo provider={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      {r.code} · {person(m.reviewedBy).name} · {timeAgo(m.updatedAt)}
                    </p>
                    <Badge tone={MATCH_STATUS_TONE[m.status]} className="mt-1">
                      {MATCH_STATUS_LABEL[m.status]}
                    </Badge>
                  </div>
                  <ArrowRight className="mt-1 size-4 text-ink-4 opacity-0 transition group-hover:opacity-100" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
