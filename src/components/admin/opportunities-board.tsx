"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Columns3, GripVertical, List, MoreHorizontal, Save, StickyNote, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import { OPPORTUNITY_STAGES, type Opportunity, type OpportunityStage } from "@/lib/types";
import { OPP_STAGE_LABEL, OPP_STAGE_TONE } from "@/lib/labels";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { cn, daysUntil, formatDate, timeAgo } from "@/lib/utils";
import { Avatar, OrgAvatar, PageHeader, ProviderLogo, ScorePill, SectionLabel, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Field, Input, Textarea } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger, Sheet } from "@/components/ui/overlay";
import { FilterSelect, useTeamOptions } from "./common";

const DOT: Record<OpportunityStage, string> = {
  introduction: "bg-ink-4",
  discovery: "bg-brand-500",
  evaluation: "bg-violet-500",
  proposal: "bg-accent-500",
  negotiation: "bg-amber-500",
  won: "bg-emerald-500",
  lost: "bg-red-400",
};

export function OpportunitiesBoard() {
  const teamOptions = useTeamOptions();
  const user = useUser();
  const L = useLookups();
  const opportunities = useStore((s) => s.opportunities);
  const setStage = useStore((s) => s.setOpportunityStage);
  const [view, setView] = React.useState<"board" | "table">("board");
  const [owner, setOwner] = React.useState("all");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<OpportunityStage | null>(null);

  const rows = opportunities.filter((o) => owner === "all" || o.ownerId === owner);
  const move = (o: Opportunity, stage: OpportunityStage) => {
    if (o.stage === stage) return;
    setStage(o.id, stage, user.id);
    toast.success(`${o.code} moved to ${OPP_STAGE_LABEL[stage]}`);
  };

  const active = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const won = opportunities.filter((o) => o.stage === "won").length;
  const lost = opportunities.filter((o) => o.stage === "lost").length;
  const dueSoon = active.filter((o) => o.nextStepDue && daysUntil(o.nextStepDue) <= 7).length;

  const columns: Column<Opportunity>[] = [
    { key: "code", header: "Opportunity", sortValue: (o) => o.code, cell: (o) => <div><p className="font-mono text-[11px] text-ink-4">{o.code}</p><p className="max-w-[260px] truncate font-medium text-ink">{L.requirement(o.requirementId)?.title}</p></div> },
    { key: "buyer", header: "Buyer", sortValue: (o) => L.buyer(o.buyerId)?.name ?? "", cell: (o) => <span className="text-xs">{L.buyer(o.buyerId)?.name}</span> },
    { key: "provider", header: "Provider", sortValue: (o) => L.provider(o.providerId)?.name ?? "", cell: (o) => <span className="text-xs">{L.provider(o.providerId)?.name}</span> },
    { key: "stage", header: "Stage", sortValue: (o) => OPPORTUNITY_STAGES.indexOf(o.stage), cell: (o) => <Badge tone={OPP_STAGE_TONE[o.stage]} dot>{OPP_STAGE_LABEL[o.stage]}</Badge> },
    { key: "owner", header: "Owner", hideOnMobile: true, sortValue: (o) => person(o.ownerId).name, cell: (o) => <span className="flex items-center gap-2 text-xs"><Avatar initials={person(o.ownerId).initials} size="xs" />{person(o.ownerId).name}</span> },
    { key: "next", header: "Next step", hideOnMobile: true, sortValue: (o) => o.nextStepDue ?? "9", cell: (o) => <div className="text-xs"><p className="text-ink-2">{o.nextStep}</p>{o.nextStepDue && <p className="text-ink-4">Due {formatDate(o.nextStepDue, { year: false })}</p>}</div> },
  ];

  return (
    <div>
      <PageHeader
        title="Opportunities"
        description="Track introductions through discovery, evaluation and negotiation to outcome. Drag cards between stages or use the move menu."
        actions={<Segmented value={view} onChange={setView} options={[{ value: "board", label: <><Columns3 /> Board</> }, { value: "table", label: <><List /> Table</> }]} />}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active opportunities" value={active.length} icon={<Target />} />
        <StatCard label="Next steps due this week" value={dueSoon} icon={<CalendarClock />} accent="amber" />
        <StatCard label="Won" value={won} icon={<Trophy />} accent="accent" />
        <StatCard label="Closed — not selected" value={lost} icon={<Target />} accent="navy" />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterSelect label="Owners" value={owner} onChange={setOwner} options={teamOptions} />
        <span className="text-xs text-ink-3">{rows.length} opportunities</span>
      </div>

      {view === "board" ? (
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-3">
          <div className="flex min-w-max gap-3">
            {OPPORTUNITY_STAGES.map((stage) => {
              const items = rows.filter((o) => o.stage === stage);
              return (
                <div
                  key={stage}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(stage);
                  }}
                  onDragLeave={() => setOver((s) => (s === stage ? null : s))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const o = opportunities.find((x) => x.id === (dragId ?? e.dataTransfer.getData("text/plain")));
                    if (o) move(o, stage);
                    setDragId(null);
                    setOver(null);
                  }}
                  className={cn("flex w-[272px] shrink-0 flex-col rounded-2xl border border-line bg-subtle/70 transition", over === stage && "border-brand-300 bg-brand-50/60 ring-4 ring-brand-100")}
                >
                  <div className="flex items-center gap-2 px-3.5 py-3">
                    <span className={cn("size-2 rounded-full", DOT[stage])} />
                    <span className="text-[13px] font-semibold text-ink">{OPP_STAGE_LABEL[stage]}</span>
                    <span className="ml-auto rounded-full bg-white px-2 py-px text-[11px] font-semibold tabular-nums text-ink-3 ring-1 ring-line">{items.length}</span>
                  </div>
                  <div className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-2">
                    {items.length === 0 && <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-4">Drop opportunities here</div>}
                    {items.map((o) => (
                      <OppCard
                        key={o.id}
                        o={o}
                        dragging={dragId === o.id}
                        onDragStart={(e) => {
                          setDragId(o.id);
                          e.dataTransfer.setData("text/plain", o.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOver(null);
                        }}
                        onOpen={() => setOpenId(o.id)}
                        onMove={(s) => move(o, s)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DataTable rows={rows} columns={columns} searchText={(o) => `${o.code} ${L.requirement(o.requirementId)?.title} ${L.buyer(o.buyerId)?.name} ${L.provider(o.providerId)?.name}`} onRowClick={(o) => setOpenId(o.id)} initialSort={{ key: "stage", dir: "asc" }} />
      )}

      <OpportunitySheet id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function OppCard({
  o,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove,
}: {
  o: Opportunity;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (s: OpportunityStage) => void;
}) {
  const L = useLookups();
  const p = L.provider(o.providerId);
  const b = L.buyer(o.buyerId);
  const r = L.requirement(o.requirementId);
  const due = o.nextStepDue ? daysUntil(o.nextStepDue) : null;
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      tabIndex={0}
      role="button"
      aria-label={`${o.code}, open details`}
      className={cn("group cursor-grab rounded-xl border border-line bg-white p-3 shadow-xs transition hover:border-line-strong hover:shadow-raised active:cursor-grabbing", dragging && "rotate-1 opacity-50")}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-ink-4 opacity-0 transition group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] text-ink-4">{o.code}</p>
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{r?.title}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown>
            <DropdownTrigger asChild>
              <button className="grid size-6 place-items-center rounded-md text-ink-4 hover:bg-navy-50 hover:text-ink" aria-label="Move opportunity">
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownLabel>Move to stage</DropdownLabel>
              {OPPORTUNITY_STAGES.filter((s) => s !== o.stage).map((s) => (
                <DropdownItem key={s} onSelect={() => onMove(s)}>
                  <span className={cn("size-2 rounded-full", DOT[s])} /> {OPP_STAGE_LABEL[s]}
                </DropdownItem>
              ))}
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {b && (
          <p className="flex items-center gap-1.5 truncate text-xs text-ink-3">
            <OrgAvatar initials={b.initials} size="sm" className="size-5 rounded-md text-[8px]" />
            <span className="truncate">{b.name}</span>
          </p>
        )}
        {p && (
          <p className="flex items-center gap-1.5 truncate text-xs text-ink-3">
            <ProviderLogo provider={p} size="sm" className="size-5 rounded-md text-[8px]" />
            <span className="truncate">{p.name}</span>
          </p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className={cn("truncate text-[11px]", due !== null && due < 0 ? "text-red-600" : due !== null && due <= 3 ? "text-amber-700" : "text-ink-3")}>
          {o.stage === "won" || o.stage === "lost" ? (o.outcome ?? "Closed") : o.nextStepDue ? `${o.nextStep} · ${formatDate(o.nextStepDue, { year: false })}` : o.nextStep}
        </span>
        <Avatar initials={person(o.ownerId).initials} size="xs" />
      </div>
    </div>
  );
}

function OpportunitySheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const teamOptions = useTeamOptions();
  const user = useUser();
  const L = useLookups();
  const o = useStore((s) => s.opportunities.find((x) => x.id === id));
  const categories = useStore((s) => s.categories);
  const update = useStore((s) => s.updateOpportunity);
  const setStage = useStore((s) => s.setOpportunityStage);
  const addNote = useStore((s) => s.addOpportunityNote);
  const [next, setNext] = React.useState("");
  const [due, setDue] = React.useState("");
  const [note, setNote] = React.useState("");
  const [outcome, setOutcome] = React.useState("");

  React.useEffect(() => {
    if (o) {
      setNext(o.nextStep);
      setDue(o.nextStepDue ?? "");
      setOutcome(o.outcome ?? "");
    }
  }, [o]);

  const p = o ? L.provider(o.providerId) : undefined;
  const b = o ? L.buyer(o.buyerId) : undefined;
  const r = o ? L.requirement(o.requirementId) : undefined;
  const score = r && p ? scoreMatch(r, toMatchable(p), categories) : null;

  return (
    <Sheet
      open={!!o}
      onOpenChange={(v) => !v && onClose()}
      width="lg"
      title={r?.title ?? ""}
      description={o ? `${o.code} · created ${formatDate(o.createdAt)}` : ""}
      header={o && <Badge tone={OPP_STAGE_TONE[o.stage]} dot className="mb-2">{OPP_STAGE_LABEL[o.stage]}</Badge>}
    >
      {o && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {b && (
              <div className="rounded-xl border border-line p-3">
                <SectionLabel className="mb-2">Buyer</SectionLabel>
                <div className="flex items-center gap-2.5">
                  <OrgAvatar initials={b.initials} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">{b.name}</p>
                    <p className="truncate text-xs text-ink-3">{b.contactName}</p>
                  </div>
                </div>
              </div>
            )}
            {p && (
              <div className="rounded-xl border border-line p-3">
                <SectionLabel className="mb-2">Provider</SectionLabel>
                <div className="flex items-center gap-2.5">
                  <ProviderLogo provider={p} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/providers/${p.id}`} className="block truncate text-[13px] font-medium text-ink hover:text-brand-700">
                      {p.name}
                    </Link>
                    {score && <ScorePill score={score.score} />}
                  </div>
                </div>
              </div>
            )}
          </div>
          {r && (
            <Link href={`/admin/requirements/${r.id}`} className="block rounded-xl border border-line bg-subtle/60 p-3 text-[13px] hover:border-line-strong">
              <span className="font-mono text-[11px] text-ink-4">{r.code}</span>
              <span className="mt-0.5 block font-medium text-ink">Open requirement workspace →</span>
            </Link>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage">
              <Select
                value={o.stage}
                onValueChange={(v) => {
                  setStage(o.id, v as OpportunityStage, user.id);
                  toast.success("Stage updated", { description: OPP_STAGE_LABEL[v as OpportunityStage] });
                }}
                options={OPPORTUNITY_STAGES.map((s) => ({ value: s, label: OPP_STAGE_LABEL[s] }))}
              />
            </Field>
            <Field label="Owner">
              <Select
                value={o.ownerId}
                onValueChange={(v) => {
                  update(o.id, { ownerId: v }, user.id, `Owner set to ${person(v).name}`);
                  toast.success("Owner assigned", { description: person(v).name });
                }}
                options={teamOptions}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-line p-4">
            <SectionLabel className="mb-3">Next step</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Input value={next} onChange={(e) => setNext(e.target.value)} aria-label="Next step" />
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                disabled={next === o.nextStep && due === (o.nextStepDue ?? "")}
                onClick={() => {
                  update(o.id, { nextStep: next.trim() || o.nextStep, nextStepDue: due || null }, user.id, `Next step: ${next}`);
                  toast.success("Next step saved");
                }}
              >
                <Save /> Save next step
              </Button>
            </div>
          </div>

          {(o.stage === "won" || o.stage === "lost") && (
            <div className="rounded-xl border border-line p-4">
              <SectionLabel className="mb-3">Outcome</SectionLabel>
              <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3} placeholder="Record the outcome and any feedback from the buyer…" />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  disabled={outcome === (o.outcome ?? "")}
                  onClick={() => {
                    update(o.id, { outcome: outcome.trim() }, user.id, "Outcome recorded");
                    toast.success("Outcome recorded");
                  }}
                >
                  <Save /> Save outcome
                </Button>
              </div>
            </div>
          )}

          <div>
            <SectionLabel className="mb-3">Internal notes</SectionLabel>
            <div className="flex gap-2">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" onKeyDown={(e) => e.key === "Enter" && note.trim() && (addNote(o.id, user.id, note.trim()), setNote(""), toast.success("Note added"))} />
              <Button
                variant="secondary"
                disabled={!note.trim()}
                onClick={() => {
                  addNote(o.id, user.id, note.trim());
                  setNote("");
                  toast.success("Note added");
                }}
              >
                <StickyNote /> Add
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {[...o.notes].reverse().map((n) => (
                <li key={n.id} className="flex gap-2.5">
                  <Avatar initials={person(n.authorId).initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-3">
                      <span className="font-medium text-ink-2">{person(n.authorId).name}</span> · {timeAgo(n.at)}
                    </p>
                    <p className="text-[13px] text-ink-2">{n.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Sheet>
  );
}
