"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Handshake, MessageSquare, Send, Target } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { scoreMatch, toMatchable } from "@/lib/matching";
import type { Opportunity } from "@/lib/types";
import { OPP_STAGE_LABEL, OPP_STAGE_TONE } from "@/lib/labels";
import { person } from "@/lib/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/overlay";
import { Avatar, EmptyState, PageHeader, ProviderLogo, ScorePill, StatCard } from "@/components/ui/misc";
import { ScheduleMeetingModal } from "@/components/buyer/schedule-meeting";
import { usePremiumGate } from "@/lib/use-plan";

const STEPS = ["introduction", "discovery", "evaluation", "proposal", "negotiation", "won"] as const;

function StageSteps({ stage }: { stage: Opportunity["stage"] }) {
  const lost = stage === "lost";
  const idx = lost ? -1 : STEPS.indexOf(stage as (typeof STEPS)[number]);
  return (
    <div className="flex items-center gap-1" aria-label={OPP_STAGE_LABEL[stage]}>
      {STEPS.map((s, i) => (
        <span key={s} title={OPP_STAGE_LABEL[s]} className={cn("h-1.5 flex-1 rounded-full", lost ? "bg-red-200" : i <= idx ? (stage === "won" ? "bg-emerald-500" : "bg-accent-500") : "bg-navy-100")} />
      ))}
    </div>
  );
}

export default function BuyerOpportunitiesPage() {
  const user = useUser();
  const L = useLookups();
  const opportunities = useStore((s) => s.opportunities);
  const requirements = useStore((s) => s.requirements);
  const categories = useStore((s) => s.categories);
  const [scope, setScope] = React.useState<"active" | "closed" | "all">("active");
  const [reqFilter, setReqFilter] = React.useState("any");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const mine = opportunities.filter((o) => o.buyerId === user.orgId);
  const isClosed = (o: Opportunity) => o.stage === "won" || o.stage === "lost";
  const list = mine
    .filter((o) => (scope === "all" ? true : scope === "closed" ? isClosed(o) : !isClosed(o)))
    .filter((o) => reqFilter === "any" || o.requirementId === reqFilter)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const reqOptions = requirements.filter((r) => mine.some((o) => o.requirementId === r.id));
  const open = mine.find((o) => o.id === openId) ?? null;

  return (
    <div>
      <PageHeader title="Opportunities" description="Every introduction Elets has made for your requirements, and how each one is progressing towards an outcome." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active opportunities" value={mine.filter((o) => !isClosed(o)).length} icon={<Handshake />} />
        <StatCard label="In evaluation or later" value={mine.filter((o) => ["evaluation", "proposal", "negotiation"].includes(o.stage)).length} icon={<Target />} accent="accent" />
        <StatCard label="Closed" value={mine.filter(isClosed).length} icon={<Check />} accent="navy" hint={`${mine.filter((o) => o.stage === "won").length} selected`} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented value={scope} onChange={setScope} options={[{ value: "active", label: "Active" }, { value: "closed", label: "Closed" }, { value: "all", label: "All" }]} />
        <div className="w-72">
          <Select size="sm" ariaLabel="Filter by requirement" value={reqFilter} onValueChange={setReqFilter} options={[{ value: "any", label: "All requirements" }, ...reqOptions.map((r) => ({ value: r.id, label: `${r.code} — ${r.title}` }))]} />
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Handshake />} title="No opportunities here" description="When Elets introduces you to a provider, the opportunity and its progress are tracked here." action={<Button asChild size="sm"><Link href="/buyer/requirements">View requirements</Link></Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((o) => {
            const p = L.provider(o.providerId);
            const r = L.requirement(o.requirementId);
            const score = r && p ? scoreMatch(r, toMatchable(p), categories).score : null;
            return (
              <button key={o.id} onClick={() => setOpenId(o.id)} className="group rounded-2xl border border-line bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
                <div className="flex items-start gap-3">
                  {p && <ProviderLogo provider={p} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-ink group-hover:text-brand-700">{p?.name}</p>
                    <p className="truncate text-xs text-ink-3">
                      <span className="font-mono">{r?.code}</span> · {r?.title}
                    </p>
                  </div>
                  <Badge tone={OPP_STAGE_TONE[o.stage]} dot>{OPP_STAGE_LABEL[o.stage]}</Badge>
                </div>
                <div className="mt-4">
                  <StageSteps stage={o.stage} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-ink-4">Next step</p>
                    <p className="mt-0.5 font-medium text-ink-2">{o.nextStep}{o.nextStepDue && <span className="font-normal text-ink-3"> · {formatDate(o.nextStepDue, { year: false })}</span>}</p>
                  </div>
                  <div>
                    <p className="text-ink-4">Elets owner</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-medium text-ink-2"><Avatar initials={person(o.ownerId).initials} size="xs" /> {person(o.ownerId).name}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
                  <span className="inline-flex items-center gap-1.5"><MessageSquare className="size-3.5" /> {o.notes.length} updates · {timeAgo(o.updatedAt)}</span>
                  {score !== null && <ScorePill score={score} />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <OpportunitySheet opp={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

function OpportunitySheet({ opp, onClose }: { opp: Opportunity | null; onClose: () => void }) {
  const user = useUser();
  const L = useLookups();
  const addNote = useStore((s) => s.addOpportunityNote);
  const [text, setText] = React.useState("");
  const [meetOpen, setMeetOpen] = React.useState(false);
  const { gate } = usePremiumGate();
  const p = opp ? L.provider(opp.providerId) : undefined;
  const r = opp ? L.requirement(opp.requirementId) : undefined;
  React.useEffect(() => setText(""), [opp?.id]);

  return (
    <>
      <Sheet
        open={!!opp}
        onOpenChange={(v) => !v && onClose()}
        width="lg"
        title={p?.name ?? "Opportunity"}
        description={opp ? `${opp.code} · ${r?.code} — ${r?.title}` : undefined}
        header={opp && <Badge tone={OPP_STAGE_TONE[opp.stage]} dot className="mb-2">{OPP_STAGE_LABEL[opp.stage]}</Badge>}
        footer={
          opp && (
            <>
              <Button variant="secondary" asChild>
                <Link href={`/buyer/requirements/${opp.requirementId}`}>Open requirement</Link>
              </Button>
              {opp.stage !== "won" && opp.stage !== "lost" && (
                <Button onClick={() => opp && gate("meeting", opp.requirementId) && setMeetOpen(true)}>
                  <CalendarDays /> Schedule meeting
                </Button>
              )}
            </>
          )
        }
      >
        {opp && (
          <div className="space-y-6">
            <div className="rounded-xl border border-line p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Progress</p>
              <StageSteps stage={opp.stage} />
              <div className="mt-2 grid grid-cols-6 text-center text-[10px] text-ink-4">
                {STEPS.map((s) => (
                  <span key={s} className={cn(s === opp.stage && "font-semibold text-ink")}>{OPP_STAGE_LABEL[s].split(" ")[0]}</span>
                ))}
              </div>
              {opp.outcome && <p className="mt-4 rounded-lg bg-subtle px-3 py-2 text-[13px] text-ink-2">{opp.outcome}</p>}
            </div>
            <dl className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <dt className="text-xs text-ink-3">Next step</dt>
                <dd className="mt-0.5 font-medium text-ink">{opp.nextStep}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Due</dt>
                <dd className="mt-0.5 font-medium text-ink">{opp.nextStepDue ? formatDate(opp.nextStepDue) : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Elets owner</dt>
                <dd className="mt-0.5 font-medium text-ink">{person(opp.ownerId).name}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-3">Introduced</dt>
                <dd className="mt-0.5 font-medium text-ink">{formatDate(opp.createdAt)}</dd>
              </div>
            </dl>
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Updates</p>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {[...opp.notes].reverse().map((n) => (
                  <li key={n.id} className="relative">
                    <span className="absolute -left-[26px] top-1 size-3 rounded-full border-2 border-white bg-brand-500" />
                    <p className="text-[13px] leading-relaxed text-ink-2">{n.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink-4">
                      {n.authorId === user.id ? "You" : person(n.authorId).name} · {formatDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-line p-3">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Add a comment for the Elets team…" className="border-0 p-0 shadow-none focus:ring-0" />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  disabled={!text.trim()}
                  onClick={() => {
                    addNote(opp.id, user.id, text.trim());
                    setText("");
                    toast.success("Comment added");
                  }}
                >
                  <Send /> Add comment
                </Button>
              </div>
            </div>
            {p && (
              <Link href={`/buyer/providers/${p.slug}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-subtle">
                <ProviderLogo provider={p} size="sm" />
                <span className="flex-1 text-[13px] font-medium text-ink">View {p.name} profile</span>
                <ArrowRight className="size-4 text-ink-4" />
              </Link>
            )}
          </div>
        )}
      </Sheet>
      {opp && <ScheduleMeetingModal open={meetOpen} onOpenChange={setMeetOpen} requirementId={opp.requirementId} providerId={opp.providerId} />}
    </>
  );
}
