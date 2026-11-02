"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, CalendarPlus, Clock, MapPin, Phone, Users, Video, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatTime, weekday } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import type { Meeting } from "@/lib/types";
import { person } from "@/lib/people";
import { cancelMeeting } from "@/lib/actions/buyer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { Avatar, EmptyState, PageHeader, ProviderLogo } from "@/components/ui/misc";
import { ScheduleMeetingModal, toIstInputs } from "@/components/buyer/schedule-meeting";

const MODE_ICON = { video: Video, "in-person": MapPin, phone: Phone } as const;
const STATUS: Record<Meeting["status"], { label: string; tone: "green" | "amber" | "neutral" | "red" }> = {
  scheduled: { label: "Confirmed", tone: "green" },
  requested: { label: "Awaiting confirmation", tone: "amber" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export default function MeetingsPage() {
  const user = useUser();
  const L = useLookups();
  const meetings = useStore((s) => s.meetings);
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [cancelId, setCancelId] = React.useState<string | null>(null);
  const [resched, setResched] = React.useState<Meeting | null>(null);

  const now = Date.now();
  const mine = meetings.filter((m) => m.buyerId === user.orgId);
  const isUpcoming = (m: Meeting) => (m.status === "scheduled" || m.status === "requested") && new Date(m.at).getTime() >= now - 2 * 3600000;
  const list = mine.filter((m) => (tab === "upcoming" ? isUpcoming(m) : !isUpcoming(m))).sort((a, b) => (tab === "upcoming" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at)));

  const groups = list.reduce<{ key: string; items: Meeting[] }[]>((acc, m) => {
    const k = formatDate(m.at);
    const g = acc.find((x) => x.key === k);
    if (g) g.items.push(m);
    else acc.push({ key: k, items: [m] });
    return acc;
  }, []);

  const cancelTarget = mine.find((m) => m.id === cancelId);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Demos, discovery calls and Elets Pro syncs. Elets coordinates invitations with providers and confirms each slot."
        actions={
          <Button onClick={() => setScheduleOpen(true)}>
            <CalendarPlus /> Schedule meeting
          </Button>
        }
      />
      <div className="mb-5 flex items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "upcoming", label: `Upcoming (${mine.filter(isUpcoming).length})` },
            { value: "past", label: "Past & cancelled" },
          ]}
        />
        <p className="hidden text-xs text-ink-3 sm:block">All times in IST</p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays />}
            title={tab === "upcoming" ? "No upcoming meetings" : "No past meetings"}
            description="Schedule a discovery call or demo with a matched provider — Elets will coordinate it."
            action={tab === "upcoming" && <Button size="sm" onClick={() => setScheduleOpen(true)}>Schedule meeting</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.key} className="grid gap-3 md:grid-cols-[120px_1fr]">
              <div className="md:pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{weekday(g.items[0].at)}</p>
                <p className="text-lg font-semibold tracking-tight text-ink">{formatDate(g.items[0].at, { year: false })}</p>
              </div>
              <div className="space-y-3">
                {g.items.map((m) => {
                  const Icon = MODE_ICON[m.mode];
                  const p = m.providerId ? L.provider(m.providerId) : undefined;
                  const r = m.requirementId ? L.requirement(m.requirementId) : undefined;
                  const end = new Date(new Date(m.at).getTime() + m.durationMins * 60000).toISOString();
                  const active = isUpcoming(m);
                  return (
                    <Card key={m.id} className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:items-center", m.status === "cancelled" && "opacity-70")}>
                      <div className="flex w-full items-start gap-4 sm:w-auto sm:flex-1">
                        <div className="flex w-20 shrink-0 flex-col">
                          <span className="text-[13px] font-semibold tabular-nums text-ink">{formatTime(m.at)}</span>
                          <span className="text-xs tabular-nums text-ink-4">{formatTime(end)}</span>
                        </div>
                        <span className={cn("hidden w-1 self-stretch rounded-full sm:block", m.status === "scheduled" ? "bg-accent-500" : m.status === "requested" ? "bg-amber-400" : "bg-navy-200")} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={cn("text-[14px] font-semibold text-ink", m.status === "cancelled" && "line-through")}>{m.title}</p>
                            <Badge tone={STATUS[m.status].tone}>{STATUS[m.status].label}</Badge>
                            {m.engagementId && <Badge tone="teal">Elets Pro</Badge>}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
                            <span className="inline-flex items-center gap-1.5"><Icon className="size-3.5" /> {m.location}</span>
                            <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> {m.durationMins} min</span>
                            {r && (
                              <Link href={`/buyer/requirements/${r.id}`} className="font-mono hover:text-brand-600">{r.code}</Link>
                            )}
                          </div>
                          {m.agenda && <p className="mt-2 text-[13px] text-ink-2">{m.agenda}</p>}
                          <div className="mt-2.5 flex items-center gap-2">
                            {p && <ProviderLogo provider={p} size="sm" className="!size-6 !rounded-md !text-[9px]" />}
                            <div className="flex -space-x-1.5">
                              {m.attendees.map((a) => (
                                <Avatar key={a} initials={person(a).initials} size="xs" />
                              ))}
                            </div>
                            <span className="text-xs text-ink-3">
                              <Users className="mr-1 inline size-3.5" />
                              {[p?.name, ...m.attendees.map((a) => (a === user.id ? "You" : person(a).name))].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {active && (
                        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                          {m.mode === "video" && m.status === "scheduled" && (
                            <Button size="sm" onClick={() => toast.info("Video join is simulated in this demo", { description: m.title })}>
                              <Video /> Join
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => setResched(m)}>
                            <CalendarClock /> Reschedule
                          </Button>
                          <Button size="sm" variant="danger-ghost" onClick={() => setCancelId(m.id)}>
                            <XCircle /> Cancel
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ScheduleMeetingModal open={scheduleOpen} onOpenChange={setScheduleOpen} />

      <Modal
        open={!!cancelTarget}
        onOpenChange={(v) => !v && setCancelId(null)}
        title="Cancel this meeting?"
        description={cancelTarget ? `${cancelTarget.title} on ${formatDate(cancelTarget.at)} at ${formatTime(cancelTarget.at)}. Elets will notify the other participants.` : undefined}
        icon={<XCircle />}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelId(null)}>Keep meeting</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (cancelId) cancelMeeting(cancelId);
                setCancelId(null);
                toast.success("Meeting cancelled");
              }}
            >
              Cancel meeting
            </Button>
          </>
        }
      />

      <RescheduleModal meeting={resched} onClose={() => setResched(null)} />
    </div>
  );
}

function RescheduleModal({ meeting, onClose }: { meeting: Meeting | null; onClose: () => void }) {
  const update = useStore((s) => s.updateMeeting);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    if (meeting) {
      const v = toIstInputs(meeting.at);
      setDate(v.date);
      setTime(v.time);
      setErr("");
    }
  }, [meeting]);
  return (
    <Modal
      open={!!meeting}
      onOpenChange={(v) => !v && onClose()}
      title="Propose a new time"
      description="The meeting returns to “awaiting confirmation” until Elets confirms the new slot with all participants."
      icon={<CalendarClock />}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              const at = new Date(`${date}T${time}:00+05:30`);
              if (!date || !time || isNaN(at.getTime()) || at.getTime() < Date.now()) return setErr("Choose a future date and time");
              update(meeting!.id, { at: at.toISOString(), status: "requested" });
              onClose();
              toast.success("New time proposed", { description: `${formatDate(at.toISOString())}, ${formatTime(at.toISOString())}` });
            }}
          >
            Propose time
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" error={err || undefined}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} invalid={!!err} />
        </Field>
        <Field label="Time (IST)">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
