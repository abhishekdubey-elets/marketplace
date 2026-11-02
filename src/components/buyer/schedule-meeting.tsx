"use client";

import * as React from "react";
import { CalendarDays, MapPin, Phone, Video } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import type { Meeting } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/controls";
import { Modal } from "@/components/ui/overlay";

const pad = (n: number) => String(n).padStart(2, "0");
function defaultDate() {
  const d = new Date(Date.now() + 3 * 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Converts an existing ISO timestamp to IST date/time input values. */
export function toIstInputs(iso: string) {
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600000);
  return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
}

export function ScheduleMeetingModal({
  open,
  onOpenChange,
  requirementId,
  providerId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requirementId?: string;
  providerId?: string;
}) {
  const user = useUser();
  const requirements = useStore((s) => s.requirements).filter((r) => r.buyerId === user.orgId && r.stage !== "completed");
  const matches = useStore((s) => s.matches);
  const providers = useStore((s) => s.providers);
  const schedule = useStore((s) => s.scheduleMeeting);

  const [reqId, setReqId] = React.useState(requirementId ?? "none");
  const [provId, setProvId] = React.useState(providerId ?? "none");
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(defaultDate());
  const [time, setTime] = React.useState("11:00");
  const [duration, setDuration] = React.useState("45");
  const [mode, setMode] = React.useState<Meeting["mode"]>("video");
  const [agenda, setAgenda] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setReqId(requirementId ?? "none");
      setProvId(providerId ?? "none");
      setTitle("");
      setDate(defaultDate());
      setTime("11:00");
      setAgenda("");
      setErr({});
    }
  }, [open, requirementId, providerId]);

  // Providers relevant to the selected requirement (visible matches), else all active providers.
  const relevant =
    reqId !== "none"
      ? matches.filter((m) => m.requirementId === reqId && !["suggested", "rejected"].includes(m.status)).map((m) => providers.find((p) => p.id === m.providerId)!).filter(Boolean)
      : providers.filter((p) => p.accountStatus === "active");

  const provName = providers.find((p) => p.id === provId)?.name;
  const req = requirements.find((r) => r.id === reqId);
  const suggestedTitle = provName ? `${provName} — ${req ? "discussion on " + req.code : "introduction call"}` : req ? `${req.code} — discussion with Elets` : "Discussion with Elets";

  const submit = () => {
    const e: Record<string, string> = {};
    if (!date) e.date = "Pick a date";
    const at = new Date(`${date}T${time || "11:00"}:00+05:30`);
    if (date && at.getTime() < Date.now()) e.date = "Choose a future date and time";
    setErr(e);
    if (Object.keys(e).length) return;
    schedule({
      title: title.trim() || suggestedTitle,
      at: at.toISOString(),
      durationMins: Number(duration),
      mode,
      location: mode === "video" ? "Video call" : mode === "phone" ? "Phone" : "To be confirmed",
      buyerId: user.orgId,
      providerId: provId === "none" ? null : provId,
      requirementId: reqId === "none" ? null : reqId,
      engagementId: null,
      attendees: [user.id, ...(req?.assignedTo ? [req.assignedTo] : [])],
      status: "requested",
      agenda: agenda.trim() || undefined,
    });
    onOpenChange(false);
    toast.success("Meeting requested", { description: "Elets will confirm the slot with all participants." });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      icon={<CalendarDays />}
      title="Schedule a meeting"
      description="Elets coordinates the invitation with the provider and confirms the slot."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Request meeting</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Requirement" optional>
            <Select value={reqId} onValueChange={(v) => { setReqId(v); setProvId("none"); }} options={[{ value: "none", label: "Not linked" }, ...requirements.map((r) => ({ value: r.id, label: `${r.code} — ${r.title}` }))]} />
          </Field>
          <Field label="Provider" optional>
            <Select value={provId} onValueChange={setProvId} options={[{ value: "none", label: "Elets team only" }, ...relevant.map((p) => ({ value: p.id, label: p.name }))]} />
          </Field>
        </div>
        <Field label="Title" hint={`Leave blank to use “${suggestedTitle}”.`}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={suggestedTitle} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" error={err.date}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} invalid={!!err.date} />
          </Field>
          <Field label="Time (IST)">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
          <Field label="Duration">
            <Select value={duration} onValueChange={setDuration} options={["30", "45", "60", "90", "120"].map((d) => ({ value: d, label: `${d} minutes` }))} />
          </Field>
        </div>
        <Field label="Format">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "video", label: <><Video /> Video</> },
              { value: "in-person", label: <><MapPin /> In person</> },
              { value: "phone", label: <><Phone /> Phone</> },
            ]}
          />
        </Field>
        <Field label="Agenda" optional>
          <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="What would you like to cover?" />
        </Field>
      </div>
    </Modal>
  );
}
