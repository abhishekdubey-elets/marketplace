"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  CircleDot,
  Flag,
  Lightbulb,
  ListTodo,
  MapPin,
  MessagesSquare,
  Pencil,
  Plus,
  Save,
  Telescope,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate, formatTime, timeAgo, weekday } from "@/lib/utils";
import { useStore, uid } from "@/lib/store";
import type { MarketScanItem, ProEngagement } from "@/lib/types";
import { person } from "@/lib/people";
import { useLookups } from "@/lib/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProviderLogo } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { Chip, Progress } from "@/components/ui/controls";
import { AssigneeAvatar, MODULE_DESCRIPTION, MODULE_ICON, MODULE_NAME, RMCard, currentModule, evaluationTotals } from "./shared";

export type PanelProps = { engagement: ProEngagement; mode: "buyer" | "admin"; actorId: string; goTo?: (tab: string) => void };

// ------------------------------------------------------------------ Overview

export function OverviewPanel({ engagement: e, mode, actorId, goTo }: PanelProps) {
  const meetings = useStore((s) => s.meetings);
  const L = useLookups();
  const cur = currentModule(e);
  const CurIcon = MODULE_ICON[cur];
  const modTasks = e.tasks.filter((t) => t.module === cur);
  const modDone = modTasks.filter((t) => t.status === "done").length;
  const pending = e.tasks.filter((t) => t.status !== "done").sort((a, b) => a.due.localeCompare(b.due));
  const upcoming = meetings.filter((m) => m.engagementId === e.id && m.status !== "completed" && m.status !== "cancelled").sort((a, b) => a.at.localeCompare(b.at));
  const milestones = [...e.milestones].sort((a, b) => a.due.localeCompare(b.due));
  const nextMilestones = milestones.filter((m) => m.status !== "done").slice(0, 4);
  const recent = [...e.messages].slice(-3).reverse();
  const totals = evaluationTotals(e);
  const rec = e.recommendation ? L.provider(e.recommendation.providerId) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        {/* current stage */}
        <Card className="overflow-hidden">
          <div className="relative border-b border-line bg-gradient-to-br from-navy-50/80 via-white to-white p-5">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-navy-900 text-white shadow-raised">
                <CurIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{e.status === "completed" ? "Engagement completed" : "Current stage"}</p>
                <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">{MODULE_NAME[cur]}</h3>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-3">{MODULE_DESCRIPTION[cur]}</p>
              </div>
            </div>
            {modTasks.length > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <Progress value={(modDone / modTasks.length) * 100} tone="accent" className="flex-1" />
                <span className="shrink-0 text-xs text-ink-3">
                  <span className="font-semibold text-ink">{modDone}</span> of {modTasks.length} stage activities complete
                </span>
              </div>
            )}
          </div>
          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "Vendors in play", value: e.shortlist.filter((v) => v.status !== "dropped").length, tab: "vendors" },
              { label: "Documents", value: e.documents.length, tab: "documents" },
              { label: "Proposals scored", value: Object.keys(totals).length, tab: "evaluation" },
            ].map((s) => (
              <button key={s.label} onClick={() => goTo?.(s.tab)} className="group px-5 py-3.5 text-left transition hover:bg-subtle">
                <p className="text-xs text-ink-3">{s.label}</p>
                <p className="mt-0.5 flex items-center justify-between text-xl font-semibold tabular-nums text-ink">
                  {s.value}
                  <ArrowRight className="size-4 text-ink-4 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </p>
              </button>
            ))}
          </div>
        </Card>

        {rec && e.recommendation && (
          <button onClick={() => goTo?.("recommendation")} className="group flex w-full items-center gap-4 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 to-white p-4 text-left shadow-card transition hover:shadow-raised">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-500 text-white">
              <Award className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">Elets recommendation recorded</p>
              <p className="truncate text-sm font-semibold text-ink">{rec.name}</p>
              <p className="line-clamp-1 text-xs text-ink-3">{e.recommendation.summary}</p>
            </div>
            <ArrowRight className="size-4 text-accent-600 transition group-hover:translate-x-0.5" />
          </button>
        )}

        {/* pending activities */}
        <Card>
          <CardHeader
            icon={<ListTodo />}
            title="Pending activities"
            description={`${pending.length} open across all stages`}
            action={
              <Button variant="ghost" size="sm" onClick={() => goTo?.("tasks")}>
                All tasks <ArrowRight />
              </Button>
            }
          />
          <CardContent className="pb-2">
            {pending.length === 0 ? (
              <EmptyState compact icon={<ListTodo />} title="No open activities" description={mode === "admin" ? "Add tasks to track the work in each stage." : "Your relationship manager will add activities as the engagement progresses."} />
            ) : (
              <ul className="-mx-2">
                {pending.slice(0, 5).map((t) => {
                  const d = daysUntil(t.due);
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-subtle">
                      <CircleDot className={cn("size-4 shrink-0", t.status === "in_progress" ? "text-brand-600" : "text-ink-4")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{t.title}</p>
                        <p className="text-xs text-ink-3">
                          {MODULE_NAME[t.module]} · {t.status === "in_progress" ? "In progress" : "To do"}
                          {t.assigneeId === actorId && <span className="ml-1.5 font-medium text-brand-600">· Assigned to you</span>}
                        </p>
                      </div>
                      <span className={cn("shrink-0 text-xs tabular-nums", d < 0 ? "font-medium text-red-600" : d <= 3 ? "font-medium text-amber-700" : "text-ink-3")}>
                        {d < 0 ? `${-d}d overdue` : d === 0 ? "Due today" : `Due ${formatDate(t.due, { year: false })}`}
                      </span>
                      <AssigneeAvatar id={t.assigneeId} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* recent communications */}
        <Card>
          <CardHeader
            icon={<MessagesSquare />}
            title="Recent communications"
            action={
              <Button variant="ghost" size="sm" onClick={() => goTo?.("messages")}>
                Open thread <ArrowRight />
              </Button>
            }
          />
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState compact icon={<MessagesSquare />} title="No messages yet" description="Engagement updates and questions will be logged here." />
            ) : (
              <ul className="space-y-3">
                {recent.map((m) => {
                  const p = person(m.authorId);
                  return (
                    <li key={m.id} className="flex gap-3">
                      <AssigneeAvatar id={m.authorId} size="sm" />
                      <div className="min-w-0 flex-1 rounded-xl border border-line bg-subtle/60 px-3 py-2">
                        <p className="text-xs text-ink-3">
                          <span className="font-medium text-ink-2">{m.authorId === actorId ? "You" : p.name}</span> · {timeAgo(m.at)}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{m.text}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardContent className="pt-5">
            <RMCard rmId={e.rmId} />
            <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-xs leading-relaxed text-ink-3">
              {mode === "buyer"
                ? "Your single point of contact for this engagement — coordinating vendors, documents, meetings and evaluation."
                : "Assigned relationship manager. Accountable for milestones and buyer communication."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader icon={<CalendarDays />} title="Upcoming meetings" />
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-3">No meetings scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <div className="w-11 shrink-0 rounded-lg border border-line bg-white text-center shadow-xs">
                      <p className="rounded-t-lg bg-navy-900 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">{weekday(m.at)}</p>
                      <p className="py-0.5 text-sm font-semibold text-ink">{formatDate(m.at, { year: false }).split(" ")[0]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{m.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                        {m.mode === "video" ? <Video className="size-3" /> : <MapPin className="size-3" />}
                        {formatTime(m.at)} · {m.location}
                      </p>
                      {m.status === "requested" && (
                        <Badge tone="amber" className="mt-1">
                          Awaiting confirmation
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            icon={<Flag />}
            title="Key milestones"
            action={
              <Button variant="ghost" size="xs" onClick={() => goTo?.("milestones")}>
                View all
              </Button>
            }
          />
          <CardContent>
            {nextMilestones.length === 0 ? (
              <p className="py-4 text-center text-xs text-ink-3">{milestones.length ? "All milestones complete." : "No milestones defined yet."}</p>
            ) : (
              <ul className="space-y-2.5">
                {nextMilestones.map((m) => {
                  const d = daysUntil(m.due);
                  return (
                    <li key={m.id} className="flex items-start gap-2.5">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.status === "at_risk" ? "bg-red-500" : "bg-brand-500")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{m.title}</p>
                        <p className="text-xs text-ink-3">
                          {formatDate(m.due)} · {d < 0 ? `${-d} days overdue` : `in ${d} days`}
                        </p>
                      </div>
                      {m.status === "at_risk" && <Badge tone="red">At risk</Badge>}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Requirement brief

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

export function BriefPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const L = useLookups();
  const req = e.requirementId ? L.requirement(e.requirementId) : null;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ background: "", objectives: "", scope: "", constraints: "" });

  const start = () => {
    setDraft({ background: e.brief.background, objectives: e.brief.objectives.join("\n"), scope: e.brief.scope.join("\n"), constraints: e.brief.constraints.join("\n") });
    setEditing(true);
  };
  const save = () => {
    update(e.id, (x) => ({ ...x, brief: { background: draft.background.trim(), objectives: lines(draft.objectives), scope: lines(draft.scope), constraints: lines(draft.constraints) } }), actorId, "Updated requirement brief");
    setEditing(false);
    toast.success("Requirement brief updated");
  };

  const empty = !e.brief.background && !e.brief.objectives.length && !e.brief.scope.length;

  return (
    <Card>
      <CardHeader
        title="Structured requirement brief"
        description="Prepared by Elets during Requirement Discovery and agreed with the buyer."
        action={
          mode === "admin" &&
          (editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                <X /> Cancel
              </Button>
              <Button size="sm" onClick={save}>
                <Save /> Save brief
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={start}>
              <Pencil /> Edit brief
            </Button>
          ))
        }
      />
      <CardContent>
        {req && (
          <Link href={mode === "admin" ? `/admin/requirements/${req.id}` : `/buyer/requirements/${req.id}`} className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-subtle/60 px-3.5 py-2.5 transition hover:border-line-strong">
            <span className="font-mono text-xs text-ink-3">{req.code}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{req.title}</span>
            <span className="text-xs font-medium text-brand-600">Linked requirement →</span>
          </Link>
        )}
        {editing ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Background" className="md:col-span-2">
              <Textarea rows={4} value={draft.background} onChange={(ev) => setDraft({ ...draft, background: ev.target.value })} />
            </Field>
            <Field label="Objectives" hint="One per line">
              <Textarea rows={5} value={draft.objectives} onChange={(ev) => setDraft({ ...draft, objectives: ev.target.value })} />
            </Field>
            <Field label="Scope" hint="One per line">
              <Textarea rows={5} value={draft.scope} onChange={(ev) => setDraft({ ...draft, scope: ev.target.value })} />
            </Field>
            <Field label="Constraints" hint="One per line" className="md:col-span-2">
              <Textarea rows={3} value={draft.constraints} onChange={(ev) => setDraft({ ...draft, constraints: ev.target.value })} />
            </Field>
          </div>
        ) : empty ? (
          <EmptyState
            icon={<Lightbulb />}
            title="Brief in preparation"
            description={mode === "admin" ? "Capture the background, objectives, scope and constraints from the discovery workshop." : "Your relationship manager will share the structured brief after the discovery workshop."}
            action={mode === "admin" && <Button onClick={start}><Pencil /> Write the brief</Button>}
          />
        ) : (
          <div className="space-y-6">
            <section>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Background</p>
              <p className="max-w-3xl text-sm leading-relaxed text-ink-2">{e.brief.background || "—"}</p>
            </section>
            <div className="grid gap-5 md:grid-cols-3">
              {(
                [
                  ["Objectives", e.brief.objectives, "bg-navy-900"],
                  ["Scope", e.brief.scope, "bg-flame-500"],
                  ["Constraints", e.brief.constraints, "bg-amber-500"],
                ] as const
              ).map(([title, items, dot]) => (
                <section key={title} className="rounded-xl border border-line p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-4">{title}</p>
                  {items.length === 0 ? (
                    <p className="text-xs text-ink-4">None recorded</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((x) => (
                        <li key={x} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dot)} />
                          {x}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ Market scan

export function MarketScanPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const providers = useStore((s) => s.providers);
  const L = useLookups();
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<{ segment: string; finding: string; providerIds: string[] }>({ segment: "", finding: "", providerIds: [] });
  const [err, setErr] = React.useState<Record<string, string>>({});
  const listed = providers.filter((p) => p.accountStatus === "active");

  const add = () => {
    const x: Record<string, string> = {};
    if (!draft.segment.trim()) x.segment = "Name the market segment";
    if (draft.finding.trim().length < 10) x.finding = "Describe the finding (at least 10 characters)";
    setErr(x);
    if (Object.keys(x).length) return;
    const item: MarketScanItem = { id: uid("ms"), segment: draft.segment.trim(), finding: draft.finding.trim(), providerIds: draft.providerIds };
    update(e.id, (eng) => ({ ...eng, marketScan: [...eng.marketScan, item] }), actorId, "Added market scan finding");
    toast.success("Finding added to market scan");
    setOpen(false);
    setDraft({ segment: "", finding: "", providerIds: [] });
  };

  const remove = (id: string) => {
    update(e.id, (eng) => ({ ...eng, marketScan: eng.marketScan.filter((m) => m.id !== id) }), actorId, "Removed market scan finding");
    toast.success("Finding removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Vendor market scan</h3>
          <p className="text-[13px] text-ink-3">Elets&apos; independent research into technologies, vendors and implementation partners relevant to this requirement.</p>
        </div>
        {mode === "admin" && e.marketScan.length > 0 && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add finding
          </Button>
        )}
      </div>

      {e.marketScan.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Telescope />}
            title="Market scan not started"
            description={
              mode === "admin"
                ? "Document market segments, what you learned, and which marketplace providers are relevant. Findings feed directly into the vendor shortlist."
                : "Once discovery is complete, Elets will research the market and share findings here."
            }
            action={
              mode === "admin" && (
                <Button onClick={() => setOpen(true)}>
                  <Plus /> Add first finding
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {e.marketScan.map((m, i) => (
            <Card key={m.id} className="group flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-navy-900 text-[11px] font-semibold text-white">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-sm font-semibold text-ink">{m.segment}</p>
                </div>
                {mode === "admin" && (
                  <Button variant="ghost" size="icon-xs" className="opacity-0 transition group-hover:opacity-100 focus:opacity-100" onClick={() => remove(m.id)} aria-label="Remove finding">
                    <Trash2 />
                  </Button>
                )}
              </div>
              <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink-2">{m.finding}</p>
              {m.providerIds.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                  {m.providerIds.map((pid) => {
                    const p = L.provider(pid);
                    if (!p) return null;
                    return (
                      <span key={pid} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-subtle/60 py-1 pl-1 pr-2 text-xs font-medium text-ink-2">
                        <ProviderLogo provider={p} size="sm" className="!size-5 !rounded-md !text-[8px]" />
                        {p.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        size="lg"
        icon={<Telescope />}
        title="Add market scan finding"
        description="Capture a segment of the market and link relevant marketplace providers."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Add finding</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Market segment" error={err.segment}>
            <Input value={draft.segment} invalid={!!err.segment} placeholder="e.g. Integrated command centre platforms" onChange={(ev) => setDraft({ ...draft, segment: ev.target.value })} />
          </Field>
          <Field label="Finding" error={err.finding}>
            <Textarea rows={4} value={draft.finding} invalid={!!err.finding} placeholder="What the research shows about this segment…" onChange={(ev) => setDraft({ ...draft, finding: ev.target.value })} />
          </Field>
          <Field label="Relevant providers" optional hint={`${draft.providerIds.length} selected`}>
            <div className="scrollbar-thin flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line p-3">
              {listed.map((p) => (
                <Chip
                  key={p.id}
                  selected={draft.providerIds.includes(p.id)}
                  onClick={() =>
                    setDraft({ ...draft, providerIds: draft.providerIds.includes(p.id) ? draft.providerIds.filter((x) => x !== p.id) : [...draft.providerIds, p.id] })
                  }
                >
                  {p.name}
                </Chip>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
