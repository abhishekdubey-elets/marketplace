"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, CalendarPlus, Columns3, Handshake, List, MessageSquare, Send, StickyNote, Target } from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import type { Meeting, Opportunity } from "@/lib/types";
import { OPPORTUNITY_STAGES } from "@/lib/types";
import { OPP_STAGE_LABEL, OPP_STAGE_TONE } from "@/lib/labels";
import { addLeadNote } from "@/lib/actions/provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/controls";
import { Modal, Sheet } from "@/components/ui/overlay";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar, EmptyState, OrgAvatar, PageHeader, ScoreRing, StatCard } from "@/components/ui/misc";
import { useMatchScore } from "@/lib/hooks";
import { useCurrentProvider } from "./common";

const STAGE_DOT: Record<string, string> = {
  introduction: "bg-ink-4",
  discovery: "bg-brand-500",
  evaluation: "bg-violet-500",
  proposal: "bg-accent-500",
  negotiation: "bg-amber-500",
  won: "bg-emerald-500",
  lost: "bg-red-400",
};

export function ProviderLeads() {
  const provider = useCurrentProvider();
  const L = useLookups();
  const all = useStore((s) => s.opportunities);
  const [view, setView] = React.useState<"pipeline" | "table">("pipeline");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const leads = React.useMemo(() => all.filter((o) => o.providerId === provider?.id), [all, provider?.id]);

  if (!provider) return <EmptyState icon={<Handshake />} title="Company profile not found" />;

  const active = leads.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const won = leads.filter((o) => o.stage === "won").length;
  const closed = leads.filter((o) => o.stage === "won" || o.stage === "lost").length;
  const open = leads.find((o) => o.id === openId) ?? null;

  const columns: Column<Opportunity>[] = [
    {
      key: "buyer",
      header: "Buyer",
      cell: (o) => {
        const b = L.buyer(o.buyerId);
        return (
          <div className="flex items-center gap-3">
            <OrgAvatar initials={b?.initials ?? "–"} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{b?.name}</p>
              <p className="truncate text-xs text-ink-3">{L.requirement(o.requirementId)?.title}</p>
            </div>
          </div>
        );
      },
      sortValue: (o) => L.buyer(o.buyerId)?.name ?? "",
    },
    { key: "code", header: "Reference", cell: (o) => <span className="font-mono text-xs text-ink-3">{o.code}</span>, hideOnMobile: true },
    {
      key: "stage",
      header: "Stage",
      cell: (o) => (
        <Badge tone={OPP_STAGE_TONE[o.stage]} dot>
          {OPP_STAGE_LABEL[o.stage]}
        </Badge>
      ),
      sortValue: (o) => OPPORTUNITY_STAGES.indexOf(o.stage),
    },
    { key: "next", header: "Next step", cell: (o) => <span className="text-xs text-ink-2">{o.nextStep}</span>, hideOnMobile: true },
    { key: "due", header: "Due", cell: (o) => <span className="whitespace-nowrap text-xs text-ink-3">{o.nextStepDue ? formatDate(o.nextStepDue, { year: false }) : "—"}</span>, sortValue: (o) => o.nextStepDue ?? "9", hideOnMobile: true },
    {
      key: "owner",
      header: "Elets owner",
      cell: (o) => (
        <span className="inline-flex items-center gap-2 text-xs text-ink-2">
          <Avatar initials={person(o.ownerId).initials} size="xs" />
          {person(o.ownerId).name}
        </span>
      ),
      hideOnMobile: true,
    },
    { key: "updated", header: "Updated", cell: (o) => <span className="whitespace-nowrap text-xs text-ink-3">{timeAgo(o.updatedAt)}</span>, sortValue: (o) => o.updatedAt, hideOnMobile: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads & introductions"
        description="Buyers Elets has introduced you to. Stages are updated by your Elets relationship manager; add notes and request meetings here."
        actions={<Segmented value={view} onChange={setView} options={[{ value: "pipeline", label: <><Columns3 /> Pipeline</> }, { value: "table", label: <><List /> Table</> }]} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total introductions" value={leads.length} icon={<Handshake />} />
        <StatCard label="Active leads" value={active.length} icon={<Target />} accent="accent" />
        <StatCard label="Won" value={won} icon={<Target />} accent="violet" hint={closed ? `${Math.round((won / closed) * 100)}% of closed leads` : "No closed leads yet"} />
        <StatCard label="Next step due this week" value={active.filter((o) => o.nextStepDue && daysUntil(o.nextStepDue) <= 7).length} icon={<CalendarDays />} accent="amber" />
      </div>

      {leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Handshake />}
            title="No introductions yet"
            description="Express interest in matched opportunities. When Elets introduces you to a buyer, the lead appears here."
            action={
              <Button asChild>
                <Link href="/provider/opportunities">View opportunities</Link>
              </Button>
            }
          />
        </Card>
      ) : view === "pipeline" ? (
        <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="grid min-w-[1180px] grid-cols-7 gap-3">
            {OPPORTUNITY_STAGES.map((stage) => {
              const items = leads.filter((o) => o.stage === stage);
              return (
                <div key={stage} className="flex min-h-64 flex-col rounded-2xl border border-line bg-subtle/60 p-2">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
                    <p className="truncate text-xs font-semibold text-ink-2">{OPP_STAGE_LABEL[stage]}</p>
                    <span className="ml-auto rounded-full bg-white px-1.5 text-[11px] font-semibold text-ink-3 ring-1 ring-line">{items.length}</span>
                  </div>
                  <div className="mt-1 space-y-2">
                    {items.map((o) => (
                      <LeadCard key={o.id} o={o} onOpen={() => setOpenId(o.id)} />
                    ))}
                    {items.length === 0 && <p className="px-2 py-6 text-center text-[11px] text-ink-4">No leads</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <DataTable rows={leads} columns={columns} searchText={(o) => `${L.buyer(o.buyerId)?.name} ${L.requirement(o.requirementId)?.title} ${o.code}`} searchPlaceholder="Search leads" onRowClick={(o) => setOpenId(o.id)} initialSort={{ key: "stage", dir: "asc" }} />
      )}

      {open && <LeadSheet o={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function LeadCard({ o, onOpen }: { o: Opportunity; onOpen: () => void }) {
  const L = useLookups();
  const b = L.buyer(o.buyerId);
  const r = L.requirement(o.requirementId);
  const score = useMatchScore(o.requirementId, o.providerId);
  return (
    <button onClick={onOpen} className="w-full rounded-xl border border-line bg-white p-3 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised">
      <div className="flex items-start gap-2">
        <OrgAvatar initials={b?.initials ?? "–"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-ink">{b?.name}</p>
        </div>
        {score && <ScoreRing score={score.score} size={30} stroke={3} showLabel={false} />}
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-ink-3">{r?.title}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2 text-[11px] text-ink-4">
        <span className="font-mono">{o.code}</span>
        {o.nextStepDue && <span>Due {formatDate(o.nextStepDue, { year: false })}</span>}
      </div>
    </button>
  );
}

function LeadSheet({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const user = useUser();
  const L = useLookups();
  const meetings = useStore((s) => s.meetings);
  const schedule = useStore((s) => s.scheduleMeeting);
  const createThread = useStore((s) => s.createThread);
  const live = useStore((s) => s.opportunities.find((x) => x.id === o.id)) ?? o;
  const [note, setNote] = React.useState("");
  const [meetOpen, setMeetOpen] = React.useState(false);
  const b = L.buyer(o.buyerId);
  const r = L.requirement(o.requirementId);
  const score = useMatchScore(o.requirementId, o.providerId);
  const myMeetings = meetings.filter((m) => m.providerId === o.providerId && m.requirementId === o.requirementId).sort((a, z) => a.at.localeCompare(z.at));
  const stageIdx = OPPORTUNITY_STAGES.indexOf(live.stage);

  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      width="lg"
      header={
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-xs text-ink-3">{live.code}</span>
          <Badge tone={OPP_STAGE_TONE[live.stage]} dot>
            {OPP_STAGE_LABEL[live.stage]}
          </Badge>
        </div>
      }
      title={b?.name ?? "Lead"}
      description={r?.title}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              createThread({ subject: `Lead update — ${live.code}`, participants: [user.id, live.ownerId], context: { kind: "opportunity", id: live.id } }, user.id, `Update on ${r?.code}: ${live.nextStep}.`);
              toast.success("Message started with your Elets owner", { description: person(live.ownerId).name });
            }}
          >
            <MessageSquare /> Message Elets
          </Button>
          <Button onClick={() => setMeetOpen(true)}>
            <CalendarPlus /> Request meeting
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Pipeline</p>
          <div className="flex gap-1">
            {OPPORTUNITY_STAGES.filter((s) => s !== "lost").map((s, i) => (
              <div key={s} className="flex-1">
                <div className={cn("h-1.5 rounded-full", live.stage === "lost" ? "bg-red-200" : i <= stageIdx ? "bg-brand-600" : "bg-navy-100")} />
                <p className={cn("mt-1 truncate text-[10px]", i === stageIdx ? "font-semibold text-ink" : "text-ink-4")}>{OPP_STAGE_LABEL[s]}</p>
              </div>
            ))}
          </div>
          {live.outcome && <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-xs text-ink-2">{live.outcome}</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-4">Next step</p>
            <p className="mt-1 text-[13px] font-medium text-ink">{live.nextStep}</p>
            <p className="text-xs text-ink-3">{live.nextStepDue ? `Due ${formatDate(live.nextStepDue)}` : "No due date"}</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-4">Elets owner</p>
            <div className="mt-1 flex items-center gap-2">
              <Avatar initials={person(live.ownerId).initials} size="sm" />
              <div>
                <p className="text-[13px] font-medium text-ink">{person(live.ownerId).name}</p>
                <p className="text-xs text-ink-3">{person(live.ownerId).title}</p>
              </div>
            </div>
          </div>
        </div>

        {b && (
          <div className="rounded-xl border border-line p-4">
            <div className="flex items-center gap-3">
              <OrgAvatar initials={b.initials} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{b.name}</p>
                <p className="text-xs text-ink-3">
                  {[b.type, b.city, b.state].filter(Boolean).join(" · ")}
                </p>
              </div>
              {score && <ScoreRing score={score.score} size={44} stroke={4} />}
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Buyer contact: <span className="font-medium text-ink-2">{b.contactName}</span> · {b.contactEmail}
            </p>
            {r && (
              <Link href={`/provider/opportunities/${r.id}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                View requirement {r.code} →
              </Link>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Meetings</p>
          {myMeetings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center text-xs text-ink-3">No meetings yet — request one to move this lead forward.</p>
          ) : (
            <ul className="space-y-2">
              {myMeetings.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <CalendarDays className="size-4 shrink-0 text-ink-4" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{m.title}</p>
                    <p className="text-xs text-ink-3">{formatDateTime(m.at)} · {m.mode}</p>
                  </div>
                  <Badge tone={m.status === "scheduled" ? "blue" : m.status === "requested" ? "amber" : "neutral"} className="capitalize">
                    {m.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Notes</p>
          <ul className="space-y-3">
            {live.notes.map((n) => (
              <li key={n.id} className="flex gap-2.5">
                <Avatar initials={person(n.authorId).initials} size="xs" />
                <div className="min-w-0 flex-1 rounded-xl bg-subtle px-3 py-2">
                  <p className="text-[11px] text-ink-4">
                    <span className="font-medium text-ink-3">{n.authorId === user.id ? "You" : person(n.authorId).name}</span> · {timeAgo(n.at)}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for your team and Elets…"
              icon={<StickyNote />}
              onKeyDown={(e) => {
                if (e.key === "Enter" && note.trim()) {
                  addLeadNote(live.id, user.id, note.trim());
                  setNote("");
                  toast.success("Note added");
                }
              }}
            />
            <Button
              size="icon"
              disabled={!note.trim()}
              aria-label="Add note"
              onClick={() => {
                addLeadNote(live.id, user.id, note.trim());
                setNote("");
                toast.success("Note added");
              }}
            >
              <Send />
            </Button>
          </div>
        </div>
      </div>

      <MeetingRequest
        open={meetOpen}
        onOpenChange={setMeetOpen}
        defaultTitle={`${b?.name ?? "Buyer"} — follow-up discussion`}
        onSubmit={(m) => {
          schedule({ ...m, buyerId: live.buyerId, providerId: live.providerId, requirementId: live.requirementId, engagementId: null, attendees: [user.id, live.ownerId], status: "requested" });
          toast.success("Meeting requested", { description: "Elets will confirm the slot with the buyer." });
        }}
      />
    </Sheet>
  );
}

function MeetingRequest({
  open,
  onOpenChange,
  defaultTitle,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTitle: string;
  onSubmit: (m: Pick<Meeting, "title" | "at" | "durationMins" | "mode" | "location" | "agenda">) => void;
}) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [date, setDate] = React.useState("2026-11-10");
  const [time, setTime] = React.useState("11:00");
  const [mode, setMode] = React.useState<Meeting["mode"]>("video");
  const [duration, setDuration] = React.useState("45");
  const [agenda, setAgenda] = React.useState("");
  const [err, setErr] = React.useState("");
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request a meeting"
      description="Elets coordinates the slot with the buyer and confirms by notification."
      icon={<CalendarPlus />}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!title.trim() || !date) return setErr("Add a title and date");
              onSubmit({ title: title.trim(), at: new Date(`${date}T${time}:00+05:30`).toISOString(), durationMins: Number(duration), mode, location: mode === "video" ? "Video call" : mode === "phone" ? "Phone" : "To be confirmed", agenda });
              onOpenChange(false);
            }}
          >
            Send request
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" error={err} className="sm:col-span-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Preferred date">
          <Input type="date" value={date} min="2026-11-03" onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Time (IST)">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Format">
          <Select value={mode} onValueChange={(v) => setMode(v as Meeting["mode"])} options={[{ value: "video", label: "Video call" }, { value: "in-person", label: "In person" }, { value: "phone", label: "Phone" }]} />
        </Field>
        <Field label="Duration">
          <Select value={duration} onValueChange={setDuration} options={["30", "45", "60", "90"].map((d) => ({ value: d, label: `${d} minutes` }))} />
        </Field>
        <Field label="Agenda" optional className="sm:col-span-2">
          <Textarea rows={3} value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Topics you'd like to cover" />
        </Field>
      </div>
    </Modal>
  );
}
