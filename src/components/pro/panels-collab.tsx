"use client";

import * as React from "react";
import {
  Award,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Circle,
  Flag,
  ListTodo,
  MapPin,
  MessagesSquare,
  NotebookPen,
  Phone,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate, formatDateTime, formatTime, weekday } from "@/lib/utils";
import { useStore, uid } from "@/lib/store";
import { PRO_MODULES, type Meeting, type MeetingNote, type ProMilestone, type ProModuleKey, type ProTask } from "@/lib/types";
import { person } from "@/lib/people";
import { useLookups } from "@/lib/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProviderLogo, ScoreRing } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/controls";
import { AssigneeAvatar, MODULE_NAME, MODULE_SHORT, evaluationTotals } from "./shared";
import type { PanelProps } from "./panels-overview";
import { useTeam } from "@/lib/team";
import { useShallow } from "zustand/react/shallow";

const MODULE_OPTIONS = PRO_MODULES.map((m) => ({ value: m.key, label: m.name }));
const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const todayISO = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------ Meetings & notes

export function MeetingsPanel({ engagement: e, mode, actorId }: PanelProps) {
  const meetings = useStore((s) => s.meetings);
  const schedule = useStore((s) => s.scheduleMeeting);
  const update = useStore((s) => s.updateEngagement);
  const L = useLookups();
  const list = meetings.filter((m) => m.engagementId === e.id).sort((a, b) => a.at.localeCompare(b.at));
  const upcoming = list.filter((m) => m.status === "scheduled" || m.status === "requested");
  const past = list.filter((m) => m.status === "completed");

  const [mOpen, setMOpen] = React.useState(false);
  const [m, setM] = React.useState({ title: "", date: "", time: "11:00", mode: "video" as Meeting["mode"], providerId: "none", agenda: "" });
  const [nOpen, setNOpen] = React.useState(false);
  const [n, setN] = React.useState({ title: "", date: todayISO(), attendees: "", summary: "", actions: "" });
  const [err, setErr] = React.useState<Record<string, string>>({});

  const vendors = e.shortlist.filter((v) => v.status !== "dropped");

  const submitMeeting = () => {
    const x: Record<string, string> = {};
    if (!m.title.trim()) x.title = "Add a meeting title";
    if (!m.date) x.date = "Choose a date";
    setErr(x);
    if (Object.keys(x).length) return;
    schedule({
      title: m.title.trim(),
      at: new Date(`${m.date}T${m.time}:00+05:30`).toISOString(),
      durationMins: 60,
      mode: m.mode,
      location: m.mode === "video" ? "Video call" : m.mode === "phone" ? "Phone" : "To be confirmed",
      buyerId: e.buyerId,
      providerId: m.providerId === "none" ? null : m.providerId,
      requirementId: e.requirementId,
      engagementId: e.id,
      attendees: Array.from(new Set([actorId, e.rmId])),
      status: mode === "admin" ? "scheduled" : "requested",
      agenda: m.agenda.trim() || undefined,
    });
    toast.success(mode === "admin" ? "Meeting scheduled" : "Meeting requested", { description: mode === "admin" ? m.title : "Your relationship manager will confirm the slot." });
    setMOpen(false);
    setM({ title: "", date: "", time: "11:00", mode: "video", providerId: "none", agenda: "" });
  };

  const submitNote = () => {
    const x: Record<string, string> = {};
    if (!n.title.trim()) x.ntitle = "Add a title";
    if (n.summary.trim().length < 10) x.summary = "Summarise the discussion";
    setErr(x);
    if (Object.keys(x).length) return;
    const note: MeetingNote = { id: uid("mn"), title: n.title.trim(), date: n.date, attendees: n.attendees.split(",").map((a) => a.trim()).filter(Boolean), summary: n.summary.trim(), actions: lines(n.actions) };
    update(e.id, (eng) => ({ ...eng, meetingNotes: [note, ...eng.meetingNotes] }), actorId, "Added meeting notes");
    toast.success("Meeting notes saved");
    setNOpen(false);
    setN({ title: "", date: todayISO(), attendees: "", summary: "", actions: "" });
  };

  const notes = [...e.meetingNotes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="h-fit">
        <CardHeader
          icon={<CalendarDays />}
          title="Meetings"
          description={`${upcoming.length} upcoming`}
          action={
            <Button size="sm" variant="secondary" onClick={() => setMOpen(true)}>
              <CalendarPlus /> {mode === "admin" ? "Schedule" : "Request"}
            </Button>
          }
        />
        <CardContent>
          {upcoming.length === 0 && past.length === 0 ? (
            <EmptyState compact icon={<CalendarDays />} title="No meetings yet" description="Workshops, vendor demos and reviews will appear here." />
          ) : (
            <ul className="space-y-3">
              {[...upcoming, ...past].map((mt) => {
                const p = mt.providerId ? L.provider(mt.providerId) : null;
                return (
                  <li key={mt.id} className={cn("flex gap-3 rounded-xl border border-line p-3", mt.status === "completed" && "opacity-70")}>
                    <div className="w-11 shrink-0 overflow-hidden rounded-lg border border-line bg-white text-center">
                      <p className="bg-navy-900 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">{weekday(mt.at)}</p>
                      <p className="py-0.5 text-sm font-semibold text-ink">{formatDate(mt.at, { year: false }).split(" ")[0]}</p>
                      <p className="pb-0.5 text-[9px] font-medium uppercase text-ink-4">{formatDate(mt.at, { year: false }).split(" ")[1]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-ink">{mt.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                        {mt.mode === "video" ? <Video className="size-3" /> : mt.mode === "phone" ? <Phone className="size-3" /> : <MapPin className="size-3" />}
                        {formatTime(mt.at)} · {mt.durationMins} min
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {mt.status === "requested" && <Badge tone="amber">Awaiting confirmation</Badge>}
                        {mt.status === "completed" && <Badge tone="green">Completed</Badge>}
                        {p && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
                            <ProviderLogo provider={p} size="sm" className="!size-4 !rounded !text-[7px]" /> {p.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          icon={<NotebookPen />}
          title="Meeting notes"
          description="Minutes, decisions and agreed actions from engagement meetings."
          action={
            mode === "admin" && (
              <Button size="sm" onClick={() => setNOpen(true)}>
                <Plus /> Add notes
              </Button>
            )
          }
        />
        <CardContent>
          {notes.length === 0 ? (
            <EmptyState
              compact
              icon={<NotebookPen />}
              title="No meeting notes yet"
              description={mode === "admin" ? "Record the discovery workshop and every review so decisions are traceable." : "Elets records minutes and action items after each engagement meeting."}
              action={mode === "admin" && <Button size="sm" variant="secondary" onClick={() => setNOpen(true)}><Plus /> Add first notes</Button>}
            />
          ) : (
            <ol className="relative space-y-5 border-l border-line pl-6">
              {notes.map((nt) => (
                <li key={nt.id} className="relative">
                  <span className="absolute -left-[31px] top-0.5 grid size-[18px] place-items-center rounded-full border-2 border-white bg-navy-900 text-white">
                    <NotebookPen className="size-2.5" />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{nt.title}</p>
                    <span className="text-xs text-ink-3">{formatDate(nt.date)}</span>
                  </div>
                  {nt.attendees.length > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                      <Users className="size-3" /> {nt.attendees.join(", ")}
                    </p>
                  )}
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{nt.summary}</p>
                  {nt.actions.length > 0 && (
                    <div className="mt-3 rounded-xl border border-line bg-subtle/60 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Actions</p>
                      <ul className="space-y-1">
                        {nt.actions.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[13px] text-ink-2">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-accent-600" /> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Modal
        open={mOpen}
        onOpenChange={setMOpen}
        icon={<CalendarPlus />}
        title={mode === "admin" ? "Schedule meeting" : "Request a meeting"}
        description={mode === "admin" ? "The buyer and relationship manager are added automatically." : "Your relationship manager will confirm the time with all participants."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitMeeting}>{mode === "admin" ? "Schedule" : "Send request"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" error={err.title}>
            <Input value={m.title} invalid={!!err.title} placeholder="e.g. Vendor demo — clinical workflows" onChange={(ev) => setM({ ...m, title: ev.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" error={err.date}>
              <Input type="date" value={m.date} invalid={!!err.date} min={todayISO()} onChange={(ev) => setM({ ...m, date: ev.target.value })} />
            </Field>
            <Field label="Time (IST)">
              <Input type="time" value={m.time} onChange={(ev) => setM({ ...m, time: ev.target.value })} />
            </Field>
          </div>
          <Field label="Format">
            <Segmented value={m.mode} onChange={(v) => setM({ ...m, mode: v })} options={[{ value: "video", label: <><Video /> Video</> }, { value: "in-person", label: <><MapPin /> In person</> }, { value: "phone", label: <><Phone /> Phone</> }]} />
          </Field>
          <Field label="Vendor" optional>
            <Select value={m.providerId} onValueChange={(v) => setM({ ...m, providerId: v })} options={[{ value: "none", label: "No vendor — internal / buyer only" }, ...vendors.map((v) => ({ value: v.providerId, label: L.provider(v.providerId)?.name ?? v.providerId }))]} />
          </Field>
          <Field label="Agenda" optional>
            <Textarea rows={3} value={m.agenda} onChange={(ev) => setM({ ...m, agenda: ev.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={nOpen}
        onOpenChange={setNOpen}
        size="lg"
        icon={<NotebookPen />}
        title="Add meeting notes"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNote}>Save notes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <Field label="Meeting" error={err.ntitle}>
              <Input value={n.title} invalid={!!err.ntitle} placeholder="e.g. Shortlist review" onChange={(ev) => setN({ ...n, title: ev.target.value })} />
            </Field>
            <Field label="Date">
              <Input type="date" value={n.date} onChange={(ev) => setN({ ...n, date: ev.target.value })} />
            </Field>
          </div>
          <Field label="Attendees" hint="Comma separated">
            <Input value={n.attendees} onChange={(ev) => setN({ ...n, attendees: ev.target.value })} />
          </Field>
          <Field label="Summary" error={err.summary}>
            <Textarea rows={4} value={n.summary} invalid={!!err.summary} onChange={(ev) => setN({ ...n, summary: ev.target.value })} />
          </Field>
          <Field label="Actions" hint="One per line" optional>
            <Textarea rows={3} value={n.actions} onChange={(ev) => setN({ ...n, actions: ev.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------ Communication history

export function MessagesPanel({ engagement: e, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const [draft, setDraft] = React.useState("");
  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), [e.messages.length]);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    update(e.id, (x) => ({ ...x, messages: [...x.messages, { id: uid("pm"), authorId: actorId, text: t, at: new Date().toISOString() }] }));
    setDraft("");
    toast.success("Message posted to engagement");
  };

  return (
    <Card className="flex h-[600px] flex-col overflow-hidden">
      <CardHeader icon={<MessagesSquare />} title="Communication history" description="Every message on this engagement is logged and visible to the buyer and the Elets team." />
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto border-y border-line bg-subtle/50 px-5 py-5">
        {e.messages.length === 0 ? (
          <EmptyState compact icon={<MessagesSquare />} title="No messages yet" description="Start the conversation — questions, updates and decisions are kept with the engagement." />
        ) : (
          e.messages.map((m) => {
            const me = m.authorId === actorId;
            const p = person(m.authorId);
            return (
              <div key={m.id} className={cn("flex gap-2.5", me && "flex-row-reverse")}>
                <AssigneeAvatar id={m.authorId} size="sm" />
                <div className={cn("max-w-[78%]", me && "text-right")}>
                  <p className="mb-1 text-[11px] text-ink-4">
                    <span className="font-medium text-ink-3">{me ? "You" : p.name}</span>
                    {p.kind === "team" && !me && <span className="ml-1 rounded bg-flame-50 px-1 text-[10px] font-semibold text-flame-700">Elets</span>} · {formatDateTime(m.at)}
                  </p>
                  <div className={cn("inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed", me ? "rounded-tr-md bg-navy-900 text-white" : "rounded-tl-md border border-line bg-white text-ink-2 shadow-xs")}>{m.text}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-white p-2 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
          <textarea
            value={draft}
            rows={1}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" && !ev.shiftKey) {
                ev.preventDefault();
                send();
              }
            }}
            placeholder="Write an update or question…"
            aria-label="Message"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-4"
          />
          <Button size="sm" onClick={send} disabled={!draft.trim()}>
            <Send /> Send
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ Milestones

const MS_TONE: Record<ProMilestone["status"], { label: string; dot: string; badge: "green" | "blue" | "red" }> = {
  done: { label: "Done", dot: "bg-accent-500", badge: "green" },
  upcoming: { label: "Upcoming", dot: "bg-brand-500", badge: "blue" },
  at_risk: { label: "At risk", dot: "bg-red-500", badge: "red" },
};

export function MilestonesPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const [open, setOpen] = React.useState(false);
  const [d, setD] = React.useState({ title: "", due: "", module: "discovery" as ProModuleKey });
  const [err, setErr] = React.useState<Record<string, string>>({});
  const list = [...e.milestones].sort((a, b) => a.due.localeCompare(b.due));
  const done = list.filter((m) => m.status === "done").length;

  const setStatus = (id: string, status: ProMilestone["status"]) => {
    update(e.id, (x) => ({ ...x, milestones: x.milestones.map((m) => (m.id === id ? { ...m, status } : m)) }), actorId, `Milestone marked ${MS_TONE[status].label.toLowerCase()}`);
    toast.success(`Milestone marked ${MS_TONE[status].label.toLowerCase()}`);
  };

  const add = () => {
    const x: Record<string, string> = {};
    if (!d.title.trim()) x.title = "Add a milestone title";
    if (!d.due) x.due = "Choose a due date";
    setErr(x);
    if (Object.keys(x).length) return;
    update(e.id, (eng) => ({ ...eng, milestones: [...eng.milestones, { id: uid("ml"), title: d.title.trim(), due: d.due, module: d.module, status: "upcoming" }] }), actorId, "Added milestone");
    toast.success("Milestone added");
    setOpen(false);
    setD({ title: "", due: "", module: d.module });
  };

  return (
    <Card>
      <CardHeader
        icon={<Flag />}
        title="Milestones"
        description={list.length ? `${done} of ${list.length} complete` : "Key dates agreed with the buyer"}
        action={
          mode === "admin" && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> Add milestone
            </Button>
          )
        }
      />
      <CardContent>
        {list.length === 0 ? (
          <EmptyState
            compact
            icon={<Flag />}
            title="No milestones yet"
            description={mode === "admin" ? "Set the key dates for each stage so the buyer can see the plan at a glance." : "Milestones will be agreed with you during discovery."}
            action={mode === "admin" && <Button size="sm" variant="secondary" onClick={() => setOpen(true)}><Plus /> Add milestone</Button>}
          />
        ) : (
          <ol className="relative ml-2 space-y-1 border-l-2 border-line pl-6">
            {list.map((m) => {
              const days = daysUntil(m.due);
              return (
                <li key={m.id} className="relative rounded-xl px-3 py-3 transition hover:bg-subtle/70">
                  <span className={cn("absolute -left-[34px] top-4 grid size-4 place-items-center rounded-full ring-4 ring-white", MS_TONE[m.status].dot)}>
                    {m.status === "done" && <Check className="size-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium", m.status === "done" ? "text-ink-3" : "text-ink")}>{m.title}</p>
                      <p className="text-xs text-ink-3">
                        {MODULE_NAME[m.module]} · {formatDate(m.due)}
                        {m.status !== "done" && <span className={cn("ml-1.5", days < 0 ? "font-medium text-red-600" : "")}>· {days < 0 ? `${-days}d overdue` : days === 0 ? "due today" : `in ${days}d`}</span>}
                      </p>
                    </div>
                    {mode === "admin" ? (
                      <div className="w-32">
                        <Select size="sm" value={m.status} ariaLabel="Milestone status" onValueChange={(v) => setStatus(m.id, v as ProMilestone["status"])} options={(["upcoming", "at_risk", "done"] as const).map((s) => ({ value: s, label: MS_TONE[s].label }))} />
                      </div>
                    ) : (
                      <Badge tone={MS_TONE[m.status].badge} dot>
                        {MS_TONE[m.status].label}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
      <Modal
        open={open}
        onOpenChange={setOpen}
        icon={<Flag />}
        title="Add milestone"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Add milestone</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Milestone" error={err.title}>
            <Input value={d.title} invalid={!!err.title} placeholder="e.g. RFP issued to shortlisted vendors" onChange={(ev) => setD({ ...d, title: ev.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date" error={err.due}>
              <Input type="date" value={d.due} invalid={!!err.due} onChange={(ev) => setD({ ...d, due: ev.target.value })} />
            </Field>
            <Field label="Stage">
              <Select value={d.module} onValueChange={(v) => setD({ ...d, module: v as ProModuleKey })} options={MODULE_OPTIONS} />
            </Field>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

// ------------------------------------------------------------------ Tasks

const COLUMNS: { key: ProTask["status"]; label: string; icon: React.ElementType; tone: string }[] = [
  { key: "todo", label: "To do", icon: Circle, tone: "text-ink-4" },
  { key: "in_progress", label: "In progress", icon: ListTodo, tone: "text-brand-600" },
  { key: "done", label: "Done", icon: CheckCircle2, tone: "text-accent-600" },
];

const PRIORITY: Record<ProTask["priority"], string> = { high: "bg-red-50 text-red-700 ring-red-100", medium: "bg-amber-50 text-amber-800 ring-amber-100", low: "bg-navy-50 text-ink-3 ring-navy-100" };

export function TasksPanel({ engagement: e, mode, actorId }: PanelProps) {
  const team = useTeam();
  const buyerMembers = useStore(useShallow((s) => s.members.filter((m) => m.orgId === e.buyerId)));
  const update = useStore((s) => s.updateEngagement);
  const [open, setOpen] = React.useState(false);
  const [mine, setMine] = React.useState<"all" | "mine">("all");
  const [d, setD] = React.useState({ title: "", assigneeId: e.rmId, due: "", priority: "medium" as ProTask["priority"], module: "discovery" as ProModuleKey });
  const [err, setErr] = React.useState<Record<string, string>>({});
  const tasks = e.tasks.filter((t) => mine === "all" || t.assigneeId === actorId);

  const move = (id: string, status: ProTask["status"]) => {
    const t = e.tasks.find((x) => x.id === id);
    update(e.id, (x) => ({ ...x, tasks: x.tasks.map((y) => (y.id === id ? { ...y, status } : y)) }), actorId, `Task moved to ${status.replace("_", " ")}`);
    toast.success(status === "done" ? "Task completed" : "Task updated", { description: t?.title });
  };

  const add = () => {
    const x: Record<string, string> = {};
    if (!d.title.trim()) x.title = "Describe the task";
    if (!d.due) x.due = "Choose a due date";
    setErr(x);
    if (Object.keys(x).length) return;
    update(e.id, (eng) => ({ ...eng, tasks: [...eng.tasks, { id: uid("tk"), title: d.title.trim(), assigneeId: d.assigneeId, due: d.due, priority: d.priority, module: d.module, status: "todo" }] }), actorId, "Added task");
    toast.success("Task added");
    setOpen(false);
    setD({ ...d, title: "", due: "" });
  };

  const assignees = [
    ...team.map((t) => ({ value: t.id, label: `${t.name} — Elets` })),
    ...buyerMembers.map((m) => ({ value: m.id, label: `${m.name} — buyer` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={mine} onChange={setMine} options={[{ value: "all", label: `All tasks (${e.tasks.length})` }, { value: "mine", label: `Assigned to me (${e.tasks.filter((t) => t.assigneeId === actorId).length})` }]} />
        {mode === "admin" && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add task
          </Button>
        )}
      </div>
      <div className="scrollbar-thin overflow-x-auto pb-2">
        <div className="grid min-w-[760px] grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.key).sort((a, b) => a.due.localeCompare(b.due));
            return (
              <div key={col.key} className="rounded-2xl border border-line bg-subtle/70 p-3">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <col.icon className={cn("size-4", col.tone)} />
                  <p className="text-[13px] font-semibold text-ink">{col.label}</p>
                  <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-ink-3 ring-1 ring-line">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.length === 0 && <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-4">No tasks</p>}
                  {items.map((t) => {
                    const days = daysUntil(t.due);
                    const own = t.assigneeId === actorId;
                    return (
                      <div key={t.id} className="rounded-xl border border-line bg-white p-3 shadow-xs transition hover:shadow-raised">
                        <div className="flex items-start gap-2">
                          <p className={cn("flex-1 text-[13px] font-medium leading-snug", t.status === "done" ? "text-ink-3 line-through decoration-ink-4/60" : "text-ink")}>{t.title}</p>
                          <AssigneeAvatar id={t.assigneeId} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-3">{MODULE_SHORT[t.module]}</span>
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset", PRIORITY[t.priority])}>{t.priority}</span>
                          <span className={cn("ml-auto text-[11px] tabular-nums", t.status !== "done" && days < 0 ? "font-medium text-red-600" : "text-ink-3")}>
                            {t.status !== "done" && days < 0 ? `${-days}d overdue` : formatDate(t.due, { year: false })}
                          </span>
                        </div>
                        {own && mode === "buyer" && <p className="mt-2 text-[11px] font-medium text-brand-600">Assigned to you</p>}
                        {(mode === "admin" || own) && (
                          <div className="mt-2.5 flex gap-1.5 border-t border-line pt-2.5">
                            {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                              <Button key={c.key} variant={c.key === "done" ? "subtle" : "ghost"} size="xs" onClick={() => move(t.id, c.key)}>
                                {c.key === "done" ? <Check /> : null}
                                {c.key === "done" ? "Mark done" : c.key === "todo" ? (t.status === "done" ? "Reopen" : "To do") : "Start"}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        icon={<ListTodo />}
        title="Add task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Add task</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Task" error={err.title}>
            <Input value={d.title} invalid={!!err.title} placeholder="e.g. Verify vendor certifications" onChange={(ev) => setD({ ...d, title: ev.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assignee">
              <Select value={d.assigneeId} onValueChange={(v) => setD({ ...d, assigneeId: v })} options={assignees} />
            </Field>
            <Field label="Due date" error={err.due}>
              <Input type="date" value={d.due} invalid={!!err.due} onChange={(ev) => setD({ ...d, due: ev.target.value })} />
            </Field>
            <Field label="Priority">
              <Segmented value={d.priority} onChange={(v) => setD({ ...d, priority: v })} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
            </Field>
            <Field label="Stage">
              <Select value={d.module} onValueChange={(v) => setD({ ...d, module: v as ProModuleKey })} options={MODULE_OPTIONS} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------ Final recommendation

export function RecommendationPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const L = useLookups();
  const totals = evaluationTotals(e);
  const candidates = e.shortlist.filter((v) => v.status !== "dropped");
  const [editing, setEditing] = React.useState(false);
  const [d, setD] = React.useState({ providerId: "", summary: "", rationale: "", outcome: "" });
  const [err, setErr] = React.useState<Record<string, string>>({});

  const start = () => {
    const best = Object.entries(totals).sort((a, b) => b[1].total - a[1].total)[0]?.[0];
    setD({
      providerId: e.recommendation?.providerId ?? best ?? candidates[0]?.providerId ?? "",
      summary: e.recommendation?.summary ?? "",
      rationale: e.recommendation?.rationale.join("\n") ?? "",
      outcome: e.outcome ?? "",
    });
    setErr({});
    setEditing(true);
  };

  const save = () => {
    const x: Record<string, string> = {};
    if (!d.providerId) x.providerId = "Choose the recommended vendor";
    if (d.summary.trim().length < 10) x.summary = "Write a short summary";
    if (lines(d.rationale).length === 0) x.rationale = "Add at least one reason";
    setErr(x);
    if (Object.keys(x).length) return;
    update(
      e.id,
      (eng) => ({
        ...eng,
        recommendation: { providerId: d.providerId, summary: d.summary.trim(), rationale: lines(d.rationale) },
        outcome: d.outcome.trim() || null,
        shortlist: eng.shortlist.map((v) => (v.providerId === d.providerId ? { ...v, status: "recommended" } : v.status === "recommended" ? { ...v, status: "proposal_received" } : v)),
      }),
      actorId,
      "Recorded final recommendation",
    );
    toast.success("Recommendation recorded", { description: "The buyer can now see the recommendation report." });
    setEditing(false);
  };

  if (mode === "admin" && editing) {
    return (
      <Card>
        <CardHeader icon={<Award />} title="Record final recommendation" description="Shared with the buyer as a recommendation report once saved." />
        <CardContent className="space-y-4">
          <Field label="Recommended vendor" error={err.providerId}>
            <Select
              value={d.providerId}
              onValueChange={(v) => setD({ ...d, providerId: v })}
              placeholder="Select vendor"
              options={candidates.map((v) => ({ value: v.providerId, label: `${L.provider(v.providerId)?.name}${totals[v.providerId]?.scored ? ` — ${totals[v.providerId].total}/100` : ""}` }))}
            />
          </Field>
          <Field label="Summary" error={err.summary}>
            <Textarea rows={3} value={d.summary} invalid={!!err.summary} onChange={(ev) => setD({ ...d, summary: ev.target.value })} placeholder="One or two sentences the buyer's leadership can act on" />
          </Field>
          <Field label="Rationale" hint="One reason per line" error={err.rationale}>
            <Textarea rows={4} value={d.rationale} invalid={!!err.rationale} onChange={(ev) => setD({ ...d, rationale: ev.target.value })} />
          </Field>
          <Field label="Outcome" optional hint="Record the final decision and post-award feedback when known">
            <Textarea rows={2} value={d.outcome} onChange={(ev) => setD({ ...d, outcome: ev.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save}>
              <Award /> Save recommendation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!e.recommendation) {
    return (
      <Card>
        <EmptyState
          icon={<Award />}
          title="No recommendation yet"
          description={
            mode === "admin"
              ? candidates.length
                ? "Once evaluation is complete, record the recommended vendor with a summary and rationale."
                : "Add vendors to the shortlist and complete the evaluation before recording a recommendation."
              : "After evaluation, Elets will share a recommendation report with the rationale behind the preferred vendor."
          }
          action={mode === "admin" && candidates.length > 0 && <Button onClick={start}><Award /> Record recommendation</Button>}
        />
      </Card>
    );
  }

  const p = L.provider(e.recommendation.providerId);
  const t = totals[e.recommendation.providerId];
  const others = Object.entries(totals)
    .filter(([pid]) => pid !== e.recommendation!.providerId)
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-navy-950 p-6 text-white sm:p-8">
          <div className="grid-bg-dark absolute inset-0 opacity-60" />
          <div className="absolute -right-16 -top-20 size-72 rounded-full bg-flame-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-flame-300">
                <Sparkles className="size-3" /> Elets Pro recommendation · {e.code}
              </p>
              <div className="mt-4 flex items-center gap-4">
                {p && <ProviderLogo provider={p} size="lg" />}
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{p?.name}</h3>
                  <p className="text-sm text-navy-300">{p?.tagline}</p>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-navy-100">{e.recommendation.summary}</p>
            </div>
            {t?.scored ? (
              <div className="flex shrink-0 flex-col items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
                <div className="relative grid place-items-center">
                  <ScoreRing score={t.total} size={84} stroke={6} showLabel={false} />
                  <span className="absolute text-xl font-semibold tabular-nums">{t.total}</span>
                </div>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-navy-300">Weighted score</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Rationale</p>
            <ul className="space-y-2.5">
              {e.recommendation.rationale.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm text-ink-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Evaluation summary</p>
            {Object.keys(totals).length === 0 ? (
              <p className="text-[13px] text-ink-3">No scored evaluation recorded.</p>
            ) : (
              <ul className="space-y-2">
                {[[e.recommendation.providerId, t] as const, ...others].map(([pid, tt]) => {
                  const vp = L.provider(pid);
                  if (!vp || !tt) return null;
                  const win = pid === e.recommendation!.providerId;
                  return (
                    <li key={pid} className="flex items-center gap-3">
                      <span className="w-40 truncate text-[13px] text-ink-2">{vp.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
                        <div className={cn("h-full rounded-full", win ? "bg-accent-500" : "bg-navy-300")} style={{ width: `${tt.total}%` }} />
                      </div>
                      <span className={cn("w-8 text-right text-[13px] font-semibold tabular-nums", win ? "text-accent-700" : "text-ink-3")}>{tt.total}</span>
                      {win && <Trophy className="size-3.5 text-accent-600" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className={cn("flex flex-wrap items-center gap-3 border-t border-line px-6 py-4", e.outcome ? "bg-emerald-50/60" : "bg-subtle/60")}>
          {e.outcome ? <CheckCircle2 className="size-5 text-emerald-600" /> : <TriangleAlert className="size-5 text-amber-500" />}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{e.outcome ? "Outcome recorded" : "Awaiting final decision"}</p>
            <p className="text-xs text-ink-3">{e.outcome ?? "The buyer's decision and post-award feedback will be recorded here."}</p>
          </div>
          {mode === "admin" && (
            <Button variant="secondary" size="sm" onClick={start}>
              Edit recommendation
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
