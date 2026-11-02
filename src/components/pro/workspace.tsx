"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CirclePause,
  CirclePlay,
  ClipboardList,
  FileQuestion,
  FastForward,
  Flag,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  MessagesSquare,
  NotebookPen,
  Award,
  Scale,
  Settings2,
  Sparkles,
  Telescope,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn, daysUntil, formatDate } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { useUser } from "@/components/providers";
import type { ProEngagement } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, OrgAvatar } from "@/components/ui/misc";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { EngagementStatusBadge, MODULE_NAME, RMCard, StageRail, WorkflowConfigSheet, advanceModules, currentModule, engagementProgress } from "./shared";
import { BriefPanel, MarketScanPanel, OverviewPanel } from "./panels-overview";
import { DocumentsPanel, EvaluationPanel, VendorsPanel } from "./panels-vendors";
import { MeetingsPanel, MessagesPanel, MilestonesPanel, RecommendationPanel, TasksPanel } from "./panels-collab";

export function ProgressRing({ value, size = 64, dark }: { value: number; size?: number; dark?: boolean }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${value}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="pro-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3565fb" />
            <stop offset="100%" stopColor="#14ae9f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? "rgb(255 255 255 / 0.12)" : "#e6e8ee"} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#pro-ring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className={cn("absolute text-sm font-semibold tabular-nums", dark ? "text-white" : "text-ink")}>
        {value}
        <span className={cn("text-[0.7em]", dark ? "text-navy-300" : "text-ink-3")}>%</span>
      </span>
    </div>
  );
}

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "brief", label: "Requirement brief", icon: ClipboardList },
  { value: "scan", label: "Market scan", icon: Telescope },
  { value: "vendors", label: "Vendors", icon: ListChecks },
  { value: "documents", label: "Documents", icon: FolderOpen },
  { value: "evaluation", label: "Evaluation", icon: Scale },
  { value: "meetings", label: "Meetings & notes", icon: NotebookPen },
  { value: "messages", label: "Communication", icon: MessagesSquare },
  { value: "milestones", label: "Milestones", icon: Flag },
  { value: "tasks", label: "Tasks", icon: ListTodo },
  { value: "recommendation", label: "Recommendation", icon: Award },
] as const;

export function ProWorkspace({ engagementId, mode }: { engagementId: string; mode: "buyer" | "admin" }) {
  const user = useUser();
  const e = useStore((s) => s.engagements.find((x) => x.id === engagementId));
  const update = useStore((s) => s.updateEngagement);
  const L = useLookups();
  const [tab, setTab] = React.useState<string>("overview");
  const [configOpen, setConfigOpen] = React.useState(false);
  const base = mode === "admin" ? "/admin/pro" : "/buyer/pro";

  if (!e || (mode === "buyer" && e.buyerId !== user.orgId)) {
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion />}
          title="Engagement not found"
          description="This Elets Pro engagement doesn't exist or isn't shared with your organisation."
          action={
            <Button variant="secondary" asChild>
              <Link href={base}>
                <ArrowLeft /> Back to Elets Pro
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const buyer = L.buyer(e.buyerId);
  const req = e.requirementId ? L.requirement(e.requirementId) : null;
  const progress = engagementProgress(e);
  const cur = currentModule(e);
  const days = daysUntil(e.targetDate);
  const openTasks = e.tasks.filter((t) => t.status !== "done").length;
  const goTo = (t: string) => {
    setTab(t);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const advance = () => {
    const { modules, next } = advanceModules(e.modules);
    update(e.id, (x) => ({ ...x, modules }), user.id, next ? `Advanced to ${MODULE_NAME[next]}` : "Completed final module");
    toast.success(next ? `Advanced to ${MODULE_NAME[next]}` : "All modules complete", { description: next ? "The buyer can see the new stage in their workspace." : "Mark the engagement completed when the outcome is recorded." });
  };

  const setStatus = (status: ProEngagement["status"]) => {
    update(e.id, (x) => ({ ...x, status }), user.id, `Set engagement status: ${status.replace("_", " ")}`);
    toast.success(`Engagement ${status === "on_hold" ? "put on hold" : status === "completed" ? "marked completed" : "reactivated"}`);
  };

  const panelProps = { engagement: e, mode, actorId: user.id, goTo };
  const allDone = Object.values(e.modules).every((m) => m === "done" || m === "skipped");

  return (
    <div className="space-y-5">
      <Link href={base} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition hover:text-ink">
        <ArrowLeft className="size-4" /> {mode === "admin" ? "All Pro engagements" : "Elets Pro"}
      </Link>

      {/* header */}
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy-900 via-brand-600 to-accent-500" />
          <div className="flex flex-col gap-6 p-5 pt-6 sm:p-6 sm:pt-7 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-navy-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="size-3 text-accent-300" /> Elets Pro
                </span>
                <span className="font-mono text-xs text-ink-3">{e.code}</span>
                <EngagementStatusBadge status={e.status} />
              </div>
              <h1 className="mt-2.5 text-[22px] font-semibold tracking-tight text-ink text-balance sm:text-2xl">{e.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-3">
                {buyer && (
                  <span className="inline-flex items-center gap-2">
                    <OrgAvatar initials={buyer.initials} size="sm" className="!size-6 !rounded-md !text-[9px]" />
                    <span className="font-medium text-ink-2">{buyer.name}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-ink-4" /> Started {formatDate(e.startDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-ink-4" /> Target {formatDate(e.targetDate)}
                  {e.status !== "completed" && <span className={cn("font-medium", days < 0 ? "text-red-600" : days < 21 ? "text-amber-700" : "text-ink-3")}>({days < 0 ? `${-days}d overdue` : `${days}d left`})</span>}
                </span>
                {req && (
                  <Link href={mode === "admin" ? `/admin/requirements/${req.id}` : `/buyer/requirements/${req.id}`} className="inline-flex items-center gap-1.5 hover:text-brand-700">
                    <ClipboardList className="size-4 text-ink-4" /> <span className="font-mono text-xs">{req.code}</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center xl:w-[520px] xl:shrink-0 xl:justify-end">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle/60 px-4 py-3">
                <ProgressRing value={progress} size={56} />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">{e.status === "completed" ? "Completed" : "Current stage"}</p>
                  <p className="text-[13px] font-semibold text-ink">{e.status === "completed" ? "All stages closed" : MODULE_NAME[cur]}</p>
                  <p className="text-xs text-ink-3">{openTasks} open activities</p>
                </div>
              </div>
              <RMCard rmId={e.rmId} className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 xl:max-w-[260px]" />
            </div>
          </div>
        </div>

        {mode === "admin" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-subtle/60 px-5 py-3 sm:px-6">
            <Button size="sm" onClick={advance} disabled={e.status !== "active" || allDone}>
              <FastForward /> Advance to next stage
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfigOpen(true)}>
              <Settings2 /> Configure workflow
            </Button>
            <Dropdown>
              <DropdownTrigger asChild>
                <Button size="sm" variant="secondary">
                  Status <ChevronDown />
                </Button>
              </DropdownTrigger>
              <DropdownContent align="start">
                <DropdownLabel>Engagement status</DropdownLabel>
                <DropdownItem icon={<CirclePlay />} disabled={e.status === "active"} onSelect={() => setStatus("active")}>
                  Active
                </DropdownItem>
                <DropdownItem icon={<CirclePause />} disabled={e.status === "on_hold"} onSelect={() => setStatus("on_hold")}>
                  On hold
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<CheckCircle2 />} disabled={e.status === "completed"} onSelect={() => setStatus("completed")}>
                  Mark completed
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
            <p className="ml-auto hidden text-xs text-ink-3 md:block">Click any stage below to change its state. Changes are visible to the buyer and audit-logged.</p>
          </div>
        )}
      </Card>

      {/* stage rail */}
      <Card className="px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Elets Pro engagement journey</p>
          <p className="text-xs text-ink-3">
            {Object.values(e.modules).filter((m) => m === "done").length} of {Object.values(e.modules).filter((m) => m !== "skipped").length} stages complete
            {Object.values(e.modules).some((m) => m === "skipped") && ` · ${Object.values(e.modules).filter((m) => m === "skipped").length} not in scope`}
          </p>
        </div>
        <StageRail engagement={e} editable={mode === "admin"} actorId={user.id} />
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="pt-5">
          <TabsContent value="overview">
            <OverviewPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="brief">
            <BriefPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="scan">
            <MarketScanPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="vendors">
            <VendorsPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="evaluation">
            <EvaluationPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="meetings">
            <MeetingsPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="messages">
            <MessagesPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="milestones">
            <MilestonesPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="tasks">
            <TasksPanel {...panelProps} />
          </TabsContent>
          <TabsContent value="recommendation">
            <RecommendationPanel {...panelProps} />
          </TabsContent>
        </div>
      </Tabs>

      {mode === "admin" && <WorkflowConfigSheet engagement={e} open={configOpen} onOpenChange={setConfigOpen} actorId={user.id} />}
    </div>
  );
}
