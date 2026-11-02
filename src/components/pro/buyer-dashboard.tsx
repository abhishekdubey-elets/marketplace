"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock, Flag, History, Inbox, ListTodo, MapPin, Send, ShieldCheck, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate, formatTime, timeAgo, weekday } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { useUser } from "@/components/providers";
import { PRO_MODULES, type ProModuleKey } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProviderLogo } from "@/components/ui/misc";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";
import { AssigneeAvatar, EngagementStatusBadge, MODULE_DESCRIPTION, MODULE_ICON, MODULE_NAME, StageRail, currentModule, engagementProgress, teamMember } from "./shared";
import { ProgressRing } from "./workspace";

export function BuyerProDashboard() {
  const user = useUser();
  const engagements = useStore((s) => s.engagements);
  const meetings = useStore((s) => s.meetings);
  const proRequests = useStore((s) => s.proRequests);
  const L = useLookups();
  const [open, setOpen] = React.useState(false);

  const mine = engagements.filter((e) => e.buyerId === user.orgId);
  const active = mine.filter((e) => e.status !== "completed");
  const history = mine.filter((e) => e.status === "completed");
  const ids = new Set(mine.map((e) => e.id));
  const upcoming = meetings.filter((m) => m.engagementId && ids.has(m.engagementId) && (m.status === "scheduled" || m.status === "requested")).sort((a, b) => a.at.localeCompare(b.at));
  const milestones = active
    .flatMap((e) => e.milestones.filter((m) => m.status !== "done").map((m) => ({ ...m, e })))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const pending = active
    .flatMap((e) => e.tasks.filter((t) => t.status !== "done").map((t) => ({ ...t, e })))
    .sort((a, b) => Number(b.assigneeId === user.id) - Number(a.assigneeId === user.id) || a.due.localeCompare(b.due))
    .slice(0, 6);
  const myRequests = proRequests.filter((r) => r.buyerId === user.orgId);
  const yourActions = pending.filter((t) => t.assigneeId === user.id).length;

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl bg-navy-950 text-white shadow-raised">
        <div className="grid-bg-dark absolute inset-0 opacity-70" />
        <div className="absolute -right-20 -top-24 size-80 rounded-full bg-brand-600/30 blur-[100px]" />
        <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-accent-500/20 blur-[100px]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-accent-200">
              <Sparkles className="size-3.5 text-accent-300" /> Elets Pro · Managed Solutions
            </p>
            <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-[28px]">Your technology procurement, managed end to end.</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-navy-200">
              A dedicated Elets relationship manager guides each engagement through eight structured stages — from requirement discovery and market research to evaluation, negotiation and post-award review.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="white" size="lg" onClick={() => setOpen(true)}>
                <Sparkles /> Request Elets Pro assistance
              </Button>
              <Button variant="outline-dark" size="lg" asChild>
                <Link href="/pro">How Elets Pro works</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:w-[360px] lg:grid-cols-1">
            {[
              { label: "Active engagements", value: active.length },
              { label: "Upcoming meetings", value: upcoming.length },
              { label: "Actions for you", value: yourActions },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur lg:flex lg:items-center lg:justify-between">
                <p className="text-xs text-navy-300">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums lg:mt-0">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* active engagements */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Active engagements</h2>
          <span className="text-xs text-ink-3">{active.length} in progress</span>
        </div>
        {active.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles />}
              title="No active Pro engagements"
              description="Request Elets Pro for any requirement and a relationship manager will be assigned to manage the selection process with you."
              action={<Button onClick={() => setOpen(true)}><Sparkles /> Request assistance</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {active.map((e) => {
              const cur = currentModule(e);
              const Icon = MODULE_ICON[cur];
              const rm = teamMember(e.rmId);
              const next = [...e.milestones].filter((m) => m.status !== "done").sort((a, b) => a.due.localeCompare(b.due))[0];
              const open = e.tasks.filter((t) => t.status !== "done").length;
              const vendors = e.shortlist.filter((v) => v.status !== "dropped");
              return (
                <Link key={e.id} href={`/buyer/pro/${e.id}`} className="group block">
                  <Card className="h-full p-5 transition group-hover:-translate-y-0.5 group-hover:border-line-strong group-hover:shadow-raised">
                    <div className="flex items-start gap-4">
                      <ProgressRing value={engagementProgress(e)} size={60} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-ink-3">{e.code}</span>
                          <EngagementStatusBadge status={e.status} />
                        </div>
                        <p className="mt-1 text-[15px] font-semibold leading-snug text-ink group-hover:text-brand-700">{e.title}</p>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-navy-50 px-2 py-1 text-xs font-medium text-navy-700">
                          <Icon className="size-3.5" /> {MODULE_NAME[cur]}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </div>
                    <div className="mt-4">
                      <StageRail engagement={e} compact />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-xs">
                      <div>
                        <p className="text-ink-4">Next milestone</p>
                        <p className="mt-0.5 truncate font-medium text-ink-2">{next ? next.title : "—"}</p>
                        {next && <p className={cn("text-[11px]", next.status === "at_risk" ? "font-medium text-red-600" : "text-ink-3")}>{formatDate(next.due, { year: false })}{next.status === "at_risk" && " · at risk"}</p>}
                      </div>
                      <div>
                        <p className="text-ink-4">Pending activities</p>
                        <p className="mt-0.5 font-medium text-ink-2">{open}</p>
                        <p className="text-[11px] text-ink-3">{vendors.length} vendors in play</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rm && <AssigneeAvatar id={rm.id} size="sm" />}
                        <div className="min-w-0">
                          <p className="text-ink-4">Your RM</p>
                          <p className="truncate font-medium text-ink-2">{rm?.name}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader icon={<CalendarDays />} title="Upcoming meetings" description="Across your Pro engagements" />
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-3">No meetings scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.slice(0, 4).map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <div className="w-11 shrink-0 overflow-hidden rounded-lg border border-line text-center">
                      <p className="bg-navy-900 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">{weekday(m.at)}</p>
                      <p className="py-0.5 text-sm font-semibold text-ink">{formatDate(m.at, { year: false }).split(" ")[0]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{m.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                        {m.mode === "video" ? <Video className="size-3" /> : <MapPin className="size-3" />} {formatTime(m.at)}
                        {m.status === "requested" && <span className="ml-1 font-medium text-amber-700">· awaiting confirmation</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader icon={<Flag />} title="Important milestones" />
          <CardContent>
            {milestones.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-3">No upcoming milestones.</p>
            ) : (
              <ul className="space-y-3">
                {milestones.map((m) => {
                  const d = daysUntil(m.due);
                  return (
                    <li key={m.id + m.e.id} className="flex items-start gap-2.5">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", m.status === "at_risk" ? "bg-red-500" : "bg-brand-500")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{m.title}</p>
                        <p className="text-xs text-ink-3">
                          {m.e.code} · {formatDate(m.due, { year: false })} · {d < 0 ? `${-d}d overdue` : `in ${d}d`}
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

        <Card>
          <CardHeader icon={<ListTodo />} title="Pending activities" description={yourActions ? `${yourActions} need your input` : "Being handled by Elets"} />
          <CardContent>
            {pending.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-3">Nothing pending.</p>
            ) : (
              <ul className="space-y-2.5">
                {pending.map((t) => (
                  <li key={t.id + t.e.id}>
                    <Link href={`/buyer/pro/${t.e.id}`} className="flex items-start gap-2.5 rounded-lg p-1 -m-1 hover:bg-subtle">
                      <AssigneeAvatar id={t.assigneeId} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium leading-snug text-ink">{t.title}</p>
                        <p className="text-xs text-ink-3">
                          Due {formatDate(t.due, { year: false })}
                          {t.assigneeId === user.id && <span className="ml-1 font-semibold text-brand-600">· You</span>}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<Inbox />}
            title="Your Pro requests"
            action={
              <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
                New request
              </Button>
            }
          />
          <CardContent>
            {myRequests.length === 0 ? (
              <EmptyState compact icon={<Inbox />} title="No open requests" description="Requests you submit appear here until a relationship manager converts them into an engagement." />
            ) : (
              <ul className="space-y-2.5">
                {myRequests.map((r) => {
                  const req = r.requirementId ? L.requirement(r.requirementId) : null;
                  return (
                    <li key={r.id} className="rounded-xl border border-line p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-medium text-ink">{req ? `${req.code} — ${req.title}` : "General procurement support"}</p>
                        {r.status === "new" ? (
                          <Badge tone="amber" dot>
                            Submitted — RM will contact you
                          </Badge>
                        ) : r.status === "contacted" ? (
                          <Badge tone="blue" dot>
                            RM in contact
                          </Badge>
                        ) : (
                          <Badge tone="green" dot>
                            Engagement created
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.services.map((s) => (
                          <span key={s} className="rounded-md bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700">
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-ink-3">
                        <Clock className="mr-1 inline size-3" />
                        {timeAgo(r.at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader icon={<History />} title="Engagement history" description="Completed engagements and their outcomes" />
          <CardContent>
            {history.length === 0 ? (
              <EmptyState compact icon={<History />} title="No completed engagements yet" description="Completed engagements and post-award reviews are kept here for reference." />
            ) : (
              <ul className="space-y-3">
                {history.map((e) => {
                  const p = e.recommendation ? L.provider(e.recommendation.providerId) : null;
                  return (
                    <li key={e.id}>
                      <Link href={`/buyer/pro/${e.id}`} className="group flex gap-3 rounded-xl border border-line p-3.5 transition hover:border-line-strong hover:bg-subtle/50">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-semibold text-ink group-hover:text-brand-700">{e.title}</p>
                            <span className="font-mono text-[11px] text-ink-4">{e.code}</span>
                          </div>
                          {p && (
                            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-2">
                              <ProviderLogo provider={p} size="sm" className="!size-5 !rounded-md !text-[8px]" /> Selected: <span className="font-medium">{p.name}</span>
                            </p>
                          )}
                          {e.outcome && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-3">{e.outcome}</p>}
                          <p className="mt-1 text-[11px] text-ink-4">
                            {formatDate(e.startDate)} – {formatDate(e.targetDate)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <RequestProModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function RequestProModal({ open, onOpenChange, defaultRequirementId }: { open: boolean; onOpenChange: (v: boolean) => void; defaultRequirementId?: string }) {
  const user = useUser();
  const requirements = useStore((s) => s.requirements);
  const requestPro = useStore((s) => s.requestPro);
  const mine = requirements.filter((r) => r.buyerId === user.orgId && r.stage !== "completed");
  const [reqId, setReqId] = React.useState<string>(defaultRequirementId ?? "none");
  const [services, setServices] = React.useState<ProModuleKey[]>([]);
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setReqId(defaultRequirementId ?? "none");
      setServices(["discovery", "shortlisting", "evaluation"]);
      setNote("");
      setErr({});
    }
  }, [open, defaultRequirementId]);

  const toggle = (k: ProModuleKey) => setServices((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const submit = () => {
    const x: Record<string, string> = {};
    if (!services.length) x.services = "Choose at least one service";
    if (note.trim().length < 10) x.note = "Briefly describe what you need help with";
    setErr(x);
    if (Object.keys(x).length) return;
    requestPro({ buyerId: user.orgId!, requirementId: reqId === "none" ? null : reqId, services: services.map((k) => MODULE_NAME[k]), note: note.trim() });
    toast.success("Elets Pro request submitted", { description: "A relationship manager will contact you within one working day." });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      icon={<Sparkles />}
      title="Request Elets Pro assistance"
      description="Choose the stages where you'd like managed support. Your relationship manager will confirm scope with you before the engagement starts."
      footer={
        <>
          <p className="mr-auto hidden items-center gap-1.5 text-xs text-ink-3 sm:flex">
            <ShieldCheck className="size-3.5 text-accent-600" /> Elets remains independent of vendors throughout the process.
          </p>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Send /> Submit request
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Related requirement" hint="Link an existing requirement, or request support for something new.">
          <Select value={reqId} onValueChange={setReqId} options={[{ value: "none", label: "Not linked — new or early-stage need" }, ...mine.map((r) => ({ value: r.id, label: `${r.code} — ${r.title}` }))]} />
        </Field>
        <Field label={`Services (${services.length} selected)`} error={err.services}>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRO_MODULES.map((m, i) => {
              const on = services.includes(m.key);
              const Icon = MODULE_ICON[m.key];
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggle(m.key)}
                  aria-pressed={on}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                    on ? "border-brand-500 bg-brand-50/50 ring-4 ring-brand-100" : "border-line bg-white hover:border-line-strong",
                  )}
                >
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg transition", on ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-600")}>
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">
                      <span className="mr-1 text-ink-4">{i + 1}.</span>
                      {m.name}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-3">{MODULE_DESCRIPTION[m.key]}</span>
                  </span>
                  <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-[5px] border", on ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white")}>
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="What do you need help with?" error={err.note}>
          <Textarea rows={3} value={note} invalid={!!err.note} onChange={(ev) => setNote(ev.target.value)} placeholder="e.g. We need help structuring evaluation criteria and comparing vendor proposals for the board." />
        </Field>
      </div>
    </Modal>
  );
}
