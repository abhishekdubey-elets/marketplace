"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Briefcase, CheckCircle2, Inbox, ListTodo, Phone, Plus, Settings2, Sparkles, TriangleAlert, Users, Workflow } from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate, timeAgo } from "@/lib/utils";
import { useStore, type ProRequest } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { useUser } from "@/components/providers";
import { PRO_MODULES, type ProEngagement } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, OrgAvatar, PageHeader, StatCard } from "@/components/ui/misc";
import { Field, Input } from "@/components/ui/input";
import { Modal, Tooltip } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";
import { Segmented, Progress } from "@/components/ui/controls";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Bars } from "@/components/ui/charts";
import { AssigneeAvatar, EngagementStatusBadge, MODULE_DESCRIPTION, MODULE_ICON, MODULE_NAME, WorkflowConfigSheet, currentModule, engagementProgress, teamMember } from "./shared";
import { suggestRm, useTeam } from "@/lib/team";
import { person } from "@/lib/people";
import { isPremium } from "@/lib/plans";

export function AdminProDashboard() {
  const team = useTeam();
  const user = useUser();
  const router = useRouter();
  const engagements = useStore((s) => s.engagements);
  const proRequests = useStore((s) => s.proRequests);
  const updateReq = useStore((s) => s.updateProRequest);
  const setBuyerPlan = useStore((s) => s.setBuyerPlan);
  const buyersAll = useStore((s) => s.buyers);
  const L = useLookups();
  const [status, setStatus] = React.useState<"all" | ProEngagement["status"]>("all");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [prefill, setPrefill] = React.useState<{ buyerId?: string; requirementId?: string | null; requestId?: string }>({});
  const [configFor, setConfigFor] = React.useState<string | null>(null);

  const active = engagements.filter((e) => e.status === "active");
  const atRisk = engagements.flatMap((e) => e.milestones.filter((m) => m.status === "at_risk" || (m.status === "upcoming" && daysUntil(m.due) < 0)).map((m) => ({ ...m, e })));
  const openTasks = engagements.filter((e) => e.status !== "completed").reduce((s, e) => s + e.tasks.filter((t) => t.status !== "done").length, 0);
  const newRequests = proRequests.filter((r) => r.status !== "converted");
  const byStage = PRO_MODULES.map((m) => ({ stage: m.short, Engagements: active.filter((e) => currentModule(e) === m.key).length }));
  const rows = engagements.filter((e) => status === "all" || e.status === status);

  const columns: Column<ProEngagement>[] = [
    {
      key: "engagement",
      header: "Engagement",
      sortValue: (e) => e.code,
      cell: (e) => (
        <div className="min-w-[220px]">
          <p className="font-mono text-[11px] text-ink-4">{e.code}</p>
          <p className="font-medium text-ink">{e.title}</p>
        </div>
      ),
    },
    {
      key: "buyer",
      header: "Buyer",
      sortValue: (e) => L.buyer(e.buyerId)?.name ?? "",
      hideOnMobile: true,
      cell: (e) => {
        const b = L.buyer(e.buyerId);
        return (
          <div className="flex items-center gap-2">
            {b && <OrgAvatar initials={b.initials} size="sm" />}
            <span className="max-w-[180px] truncate text-ink-2">{b?.name}</span>
          </div>
        );
      },
    },
    {
      key: "stage",
      header: "Stage",
      sortValue: (e) => engagementProgress(e),
      cell: (e) => {
        const cur = currentModule(e);
        const Icon = MODULE_ICON[cur];
        return (
          <div className="w-44">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
              <Icon className="size-3.5 text-navy-500" /> {e.status === "completed" ? "Completed" : MODULE_NAME[cur]}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={engagementProgress(e)} tone={e.status === "completed" ? "green" : "brand"} className="flex-1" />
              <span className="w-8 text-right text-[11px] tabular-nums text-ink-3">{engagementProgress(e)}%</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "rm",
      header: "RM",
      sortValue: (e) => teamMember(e.rmId)?.name ?? "",
      hideOnMobile: true,
      cell: (e) => (
        <div className="flex items-center gap-2">
          <AssigneeAvatar id={e.rmId} size="sm" />
          <span className="whitespace-nowrap text-ink-2">{teamMember(e.rmId)?.name}</span>
        </div>
      ),
    },
    {
      key: "target",
      header: "Target",
      sortValue: (e) => e.targetDate,
      cell: (e) => {
        const d = daysUntil(e.targetDate);
        return (
          <div className="whitespace-nowrap">
            <p className="text-ink-2">{formatDate(e.targetDate)}</p>
            {e.status !== "completed" && <p className={cn("text-[11px]", d < 0 ? "font-medium text-red-600" : d < 21 ? "text-amber-700" : "text-ink-4")}>{d < 0 ? `${-d}d overdue` : `${d}d left`}</p>}
          </div>
        );
      },
    },
    { key: "status", header: "Status", sortValue: (e) => e.status, cell: (e) => <EngagementStatusBadge status={e.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (e) => (
        <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <Tooltip content="Configure workflow">
            <Button variant="ghost" size="icon-xs" onClick={() => setConfigFor(e.id)} aria-label="Configure workflow">
              <Settings2 />
            </Button>
          </Tooltip>
          <Button variant="ghost" size="icon-xs" onClick={() => router.push(`/admin/pro/${e.id}`)} aria-label="Open workspace">
            <ArrowRight />
          </Button>
        </div>
      ),
    },
  ];

  const convert = (r: ProRequest) => {
    setPrefill({ buyerId: r.buyerId, requirementId: r.requirementId, requestId: r.id });
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1 rounded-md bg-navy-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <Sparkles className="size-3 text-accent-300" /> Elets Pro
          </span>
        }
        title="Managed engagements"
        description="Run the eight-stage Elets Pro process for every buyer engagement — assign relationship managers, track milestones, evaluation and outcomes."
        actions={
          <Button
            onClick={() => {
              setPrefill({});
              setCreateOpen(true);
            }}
          >
            <Plus /> Create engagement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active engagements" value={active.length} icon={<Briefcase />} hint={`${engagements.filter((e) => e.status === "completed").length} completed · ${engagements.filter((e) => e.status === "on_hold").length} on hold`} />
        <StatCard label="Milestones at risk" value={atRisk.length} icon={<TriangleAlert />} accent="amber" hint={atRisk[0] ? `${atRisk[0].e.code}: ${atRisk[0].title}` : "All milestones on track"} />
        <StatCard label="Open tasks" value={openTasks} icon={<ListTodo />} accent="violet" hint="Across active engagements" />
        <StatCard label="Pro requests" value={newRequests.length} icon={<Inbox />} accent="accent" hint={newRequests.length ? "Awaiting relationship manager" : "Inbox clear"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader icon={<Workflow />} title="Active engagements by stage" description="Where each live engagement currently sits in the Elets Pro process" />
          <CardContent>
            <Bars data={byStage} x="stage" series={[{ key: "Engagements", label: "Engagements" }]} height={220} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader icon={<Inbox />} title="Pro requests inbox" description={`${newRequests.length} open`} />
          <CardContent>
            {newRequests.length === 0 ? (
              <EmptyState compact icon={<CheckCircle2 />} title="Inbox clear" description="New buyer requests for Elets Pro assistance will appear here." />
            ) : (
              <ul className="space-y-3">
                {newRequests.map((r) => {
                  const b = L.buyer(r.buyerId);
                  const req = r.requirementId ? L.requirement(r.requirementId) : null;
                  return (
                    <li key={r.id} className="rounded-xl border border-line p-3.5">
                      <div className="flex items-start gap-3">
                        {b && <OrgAvatar initials={b.initials} size="sm" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-semibold text-ink">{b?.name}</p>
                            <Badge tone={r.status === "new" ? "amber" : "blue"} dot>
                              {r.status === "new" ? "New" : "Contacted"}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-3">
                            {req ? `${req.code} · ${req.title}` : "No linked requirement"} · {timeAgo(r.at)}
                          </p>
                          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{r.note}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {r.services.map((s) => (
                              <span key={s} className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[11px] font-medium text-navy-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
                        {r.status === "new" && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => {
                              updateReq(r.id, "contacted");
                              toast.success("Marked as contacted", { description: b?.name });
                            }}
                          >
                            <Phone /> Mark contacted
                          </Button>
                        )}
                        {!isPremium(buyersAll.find((x) => x.id === r.buyerId)) && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => {
                              setBuyerPlan(r.buyerId, "premium", user.id);
                              if (r.services.length === 1 && r.services[0] === "Premium plan") updateReq(r.id, "converted");
                              toast.success("Premium activated", { description: `${b?.name} can now talk to suppliers and schedule meetings.` });
                            }}
                          >
                            <Sparkles /> Activate Premium
                          </Button>
                        )}
                        <Button size="xs" onClick={() => convert(r)}>
                          Convert to engagement <ArrowRight />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchText={(e) => `${e.code} ${e.title} ${L.buyer(e.buyerId)?.name} ${teamMember(e.rmId)?.name}`}
        searchPlaceholder="Search engagements, buyers, RMs…"
        onRowClick={(e) => router.push(`/admin/pro/${e.id}`)}
        initialSort={{ key: "target", dir: "asc" }}
        toolbar={
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: `All (${engagements.length})` },
              { value: "active", label: "Active" },
              { value: "on_hold", label: "On hold" },
              { value: "completed", label: "Completed" },
            ]}
          />
        }
        empty={{ title: "No engagements", description: "Create an engagement or convert a Pro request.", icon: <Briefcase /> }}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader icon={<Users />} title="Relationship manager workload" />
          <CardContent>
            <ul className="space-y-3">
              {team.map((t) => {
                const mine = engagements.filter((e) => e.rmId === t.id && e.status !== "completed");
                const tasks = engagements.flatMap((e) => e.tasks).filter((x) => x.assigneeId === t.id && x.status !== "done").length;
                const load = Math.min(100, mine.length * 30 + tasks * 6);
                return (
                  <li key={t.id} className="flex items-center gap-3">
                    <AssigneeAvatar id={t.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-medium text-ink">{t.name}</p>
                        <p className="shrink-0 text-xs text-ink-3">
                          <span className="font-semibold text-ink">{mine.length}</span> engagements · {tasks} tasks
                        </p>
                      </div>
                      <Progress value={load} tone={load > 75 ? "amber" : "accent"} className="mt-1.5" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            icon={<Settings2 />}
            title="Pro workflow template"
            description="The standard eight-module process. Modules can be switched off per engagement from the workflow configuration."
          />
          <CardContent>
            <ol className="grid gap-2 sm:grid-cols-2">
              {PRO_MODULES.map((m, i) => {
                const Icon = MODULE_ICON[m.key];
                const using = engagements.filter((e) => e.modules[m.key] !== "skipped").length;
                return (
                  <li key={m.key} className="flex items-start gap-3 rounded-xl border border-line p-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-navy-900 text-white">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        <span className="mr-1 text-ink-4">{i + 1}.</span>
                        {m.name}
                      </p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-ink-3">{MODULE_DESCRIPTION[m.key]}</p>
                      <p className="mt-1 text-[11px] text-ink-4">
                        In scope for {using} of {engagements.length} engagements
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <React.Suspense fallback={null}>
        <CreateParamWatcher
          onCreate={(requirementId) => {
            const r = L.requirement(requirementId);
            if (!r) return toast.error("Requirement not found", { description: requirementId });
            const pending = proRequests.find((x) => x.requirementId === requirementId && x.status !== "converted");
            setPrefill({ buyerId: r.buyerId, requirementId, requestId: pending?.id });
            setCreateOpen(true);
          }}
        />
      </React.Suspense>
      <CreateEngagementModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefill={prefill}
        onCreated={(id) => {
          if (prefill.requestId) updateReq(prefill.requestId, "converted");
          router.push(`/admin/pro/${id}`);
        }}
        actorId={user.id}
      />
      <WorkflowConfigSheet engagement={engagements.find((e) => e.id === configFor) ?? null} open={!!configFor} onOpenChange={(v) => !v && setConfigFor(null)} actorId={user.id} />
    </div>
  );
}

/** Opens the create modal when the page is reached via /admin/pro?create=<requirementId>. */
function CreateParamWatcher({ onCreate }: { onCreate: (requirementId: string) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const create = params.get("create");
  const handled = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!create || handled.current === create) return;
    handled.current = create;
    onCreate(create);
    router.replace("/admin/pro", { scroll: false });
  }, [create, onCreate, router]);
  return null;
}

function CreateEngagementModal({
  open,
  onOpenChange,
  prefill,
  onCreated,
  actorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill: { buyerId?: string; requirementId?: string | null };
  onCreated: (id: string) => void;
  actorId: string;
}) {
  const buyers = useStore((s) => s.buyers);
  const requirements = useStore((s) => s.requirements);
  const create = useStore((s) => s.createEngagement);
  const team = useTeam();
  const [d, setD] = React.useState({ buyerId: "", requirementId: "none", title: "", rmId: team[0]?.id ?? actorId, targetDate: "" });
  const [err, setErr] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open) return;
    const req = prefill.requirementId ? requirements.find((r) => r.id === prefill.requirementId) : undefined;
    const buyer = buyers.find((b) => b.id === prefill.buyerId);
    const rm = suggestRm(team, buyer ? [buyer.industryId] : [])?.id ?? actorId;
    setD({ buyerId: prefill.buyerId ?? "", requirementId: prefill.requirementId ?? "none", title: req ? `${req.title}` : "", rmId: rm, targetDate: "" });
    setErr({});
  }, [open, prefill, requirements, buyers, team, actorId]);

  const reqs = requirements.filter((r) => r.buyerId === d.buyerId);

  const submit = () => {
    const x: Record<string, string> = {};
    if (!d.buyerId) x.buyerId = "Choose the buyer organisation";
    if (d.title.trim().length < 5) x.title = "Give the engagement a descriptive title";
    if (!d.targetDate) x.targetDate = "Set a target date";
    else if (daysUntil(d.targetDate) < 0) x.targetDate = "Target date must be in the future";
    setErr(x);
    if (Object.keys(x).length) return;
    const id = create({ title: d.title.trim(), buyerId: d.buyerId, requirementId: d.requirementId === "none" ? null : d.requirementId, rmId: d.rmId, targetDate: d.targetDate }, actorId);
    toast.success("Engagement created", { description: `${person(d.rmId).name} assigned as relationship manager` });
    onOpenChange(false);
    onCreated(id);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      icon={<Sparkles />}
      title="Create Elets Pro engagement"
      description="Starts the engagement at Requirement Discovery. The buyer is notified and gets access to the engagement workspace."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>
            <Plus /> Create engagement
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Buyer organisation" error={err.buyerId} className="sm:col-span-2">
          <Select
            value={d.buyerId}
            placeholder="Select buyer"
            onValueChange={(v) => {
              const b = buyers.find((x) => x.id === v);
              const rm = suggestRm(team, b ? [b.industryId] : [])?.id ?? d.rmId;
              setD({ ...d, buyerId: v, requirementId: "none", rmId: rm });
            }}
            options={buyers.map((b) => ({ value: b.id, label: b.name }))}
          />
        </Field>
        <Field label="Linked requirement" optional className="sm:col-span-2" hint={d.buyerId && !reqs.length ? "This buyer has no requirements yet." : "The brief is pre-filled from the requirement."}>
          <Select
            value={d.requirementId}
            onValueChange={(v) => {
              const r = requirements.find((x) => x.id === v);
              setD({ ...d, requirementId: v, title: r && !d.title ? r.title : d.title });
            }}
            options={[{ value: "none", label: "None" }, ...reqs.map((r) => ({ value: r.id, label: `${r.code} — ${r.title}` }))]}
          />
        </Field>
        <Field label="Engagement title" error={err.title} className="sm:col-span-2">
          <Input value={d.title} invalid={!!err.title} onChange={(ev) => setD({ ...d, title: ev.target.value })} placeholder="e.g. HIS vendor selection" />
        </Field>
        <Field label="Relationship manager">
          <Select value={d.rmId} onValueChange={(v) => setD({ ...d, rmId: v })} options={team.length ? team.map((t) => ({ value: t.id, label: t.name })) : [{ value: actorId, label: "Me" }]} />
        </Field>
        <Field label="Target date" error={err.targetDate}>
          <Input type="date" value={d.targetDate} invalid={!!err.targetDate} onChange={(ev) => setD({ ...d, targetDate: ev.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
