"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Download, Inbox, Sparkles, UserX, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { REQUIREMENT_STAGES, type Requirement, type RequirementStage } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/labels";
import { TEAM } from "@/lib/data/taxonomy";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/controls";
import { Tooltip } from "@/components/ui/overlay";
import { StageBadge } from "@/components/shared/domain";
import { downloadCsv, FilterSelect, TEAM_OPTIONS } from "./common";

const PRIORITY_TONE = { high: "red", medium: "amber", low: "neutral" } as const;

export function RequirementsList() {
  const user = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const L = useLookups();
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const industries = useStore((s) => s.industries);
  const updateRequirement = useStore((s) => s.updateRequirement);
  const setStage = useStore((s) => s.setRequirementStage);

  const [view, setView] = React.useState<"all" | "new" | "unassigned" | "active" | "completed">((params.get("view") as "all") ?? "all");
  const [stage, setStageF] = React.useState("all");
  const [priority, setPriority] = React.useState("all");
  const [rm, setRm] = React.useState("all");
  const [industry, setIndustry] = React.useState("all");

  const rows = requirements.filter(
    (r) =>
      (view === "all" ||
        (view === "new" && r.stage === "submitted") ||
        (view === "unassigned" && !r.assignedTo) ||
        (view === "active" && r.stage !== "completed" && r.stage !== "submitted") ||
        (view === "completed" && r.stage === "completed")) &&
      (stage === "all" || r.stage === stage) &&
      (priority === "all" || r.priority === priority) &&
      (rm === "all" || (rm === "none" ? !r.assignedTo : r.assignedTo === rm)) &&
      (industry === "all" || r.industryId === industry),
  );

  const columns: Column<Requirement>[] = [
    {
      key: "title",
      header: "Requirement",
      sortValue: (r) => r.code,
      cell: (r) => (
        <div className="min-w-[240px] max-w-[380px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-ink-4">{r.code}</span>
            {r.proRequested && (
              <Tooltip content="Buyer requested Elets Pro managed support">
                <span className="inline-flex items-center gap-0.5 rounded bg-gradient-to-r from-brand-600 to-accent-500 px-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="size-2.5" /> Pro
                </span>
              </Tooltip>
            )}
          </div>
          <p className="truncate font-medium text-ink">{r.title}</p>
          <p className="truncate text-xs text-ink-3">
            {L.buyer(r.buyerId)?.name} · {L.categoryName(r.categoryId)}
          </p>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      sortValue: (r) => REQUIREMENT_STAGES.indexOf(r.stage),
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()} className="w-44">
          <Select
            size="sm"
            ariaLabel={`Stage for ${r.code}`}
            value={r.stage}
            onValueChange={(v) => {
              setStage(r.id, v as RequirementStage, user.id);
              toast.success(`${r.code} moved`, { description: STAGE_LABEL[v as RequirementStage] });
            }}
            options={REQUIREMENT_STAGES.map((s) => ({ value: s, label: <StageBadge stage={s} /> }))}
          />
        </div>
      ),
    },
    {
      key: "rm",
      header: "Relationship manager",
      sortValue: (r) => r.assignedTo ?? "",
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()} className={cn("w-44 rounded-lg", !r.assignedTo && "ring-2 ring-amber-200")}>
          <Select
            size="sm"
            ariaLabel={`Relationship manager for ${r.code}`}
            value={r.assignedTo ?? undefined}
            placeholder="Unassigned"
            onValueChange={(v) => {
              updateRequirement(r.id, { assignedTo: v }, user.id, `Assigned to ${TEAM.find((t) => t.id === v)?.name}`);
              toast.success("Relationship manager assigned", { description: `${r.code} → ${TEAM.find((t) => t.id === v)?.name}` });
            }}
            options={TEAM_OPTIONS}
          />
        </div>
      ),
    },
    {
      key: "matches",
      header: "Matches",
      align: "right",
      hideOnMobile: true,
      sortValue: (r) => matches.filter((m) => m.requirementId === r.id).length,
      cell: (r) => {
        const ms = matches.filter((m) => m.requirementId === r.id);
        const pending = ms.filter((m) => m.status === "suggested").length;
        return (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            {ms.length}
            {pending > 0 && <Badge tone="amber">{pending} to review</Badge>}
          </span>
        );
      },
    },
    { key: "priority", header: "Priority", sortValue: (r) => ["low", "medium", "high"].indexOf(r.priority), hideOnMobile: true, cell: (r) => <Badge tone={PRIORITY_TONE[r.priority]}>{r.priority[0].toUpperCase() + r.priority.slice(1)}</Badge> },
    { key: "updated", header: "Updated", align: "right", sortValue: (r) => r.updatedAt, hideOnMobile: true, cell: (r) => <span className="whitespace-nowrap text-xs text-ink-3" title={formatDate(r.updatedAt)}>{timeAgo(r.updatedAt)}</span> },
  ];

  const counts = {
    all: requirements.length,
    new: requirements.filter((r) => r.stage === "submitted").length,
    unassigned: requirements.filter((r) => !r.assignedTo).length,
    active: requirements.filter((r) => r.stage !== "completed" && r.stage !== "submitted").length,
    completed: requirements.filter((r) => r.stage === "completed").length,
  };

  return (
    <div>
      <PageHeader
        title="Requirements"
        description="Review, structure and route buyer requirements. Assign relationship managers, move stages and initiate matching."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              downloadCsv("elets-requirements.csv", [
                ["Code", "Title", "Buyer", "Category", "Stage", "Priority", "RM", "Created"],
                ...rows.map((r) => [r.code, r.title, L.buyer(r.buyerId)?.name ?? "", L.categoryName(r.categoryId), STAGE_LABEL[r.stage], r.priority, TEAM.find((t) => t.id === r.assignedTo)?.name ?? "Unassigned", r.createdAt]),
              ]);
              toast.success("Export started", { description: `${rows.length} requirements` });
            }}
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="New submissions" value={counts.new} icon={<Inbox />} accent="amber" />
        <StatCard label="Unassigned" value={counts.unassigned} icon={<UserX />} accent="violet" />
        <StatCard label="In matching" value={requirements.filter((r) => r.stage === "matching").length} icon={<Workflow />} />
        <StatCard label="Completed" value={counts.completed} icon={<ClipboardList />} accent="accent" />
      </div>
      <div className="mb-3 overflow-x-auto">
        <Segmented
          value={view}
          onChange={setView}
          options={(["all", "new", "unassigned", "active", "completed"] as const).map((v) => ({ value: v, label: `${v[0].toUpperCase() + v.slice(1)} · ${counts[v]}` }))}
        />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        searchText={(r) => `${r.code} ${r.title} ${L.buyer(r.buyerId)?.name} ${r.capabilities.join(" ")}`}
        searchPlaceholder="Search code, title, buyer…"
        onRowClick={(r) => router.push(`/admin/requirements/${r.id}`)}
        initialSort={{ key: "updated", dir: "desc" }}
        toolbar={
          <>
            <FilterSelect label="Stages" value={stage} onChange={setStageF} options={REQUIREMENT_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))} />
            <FilterSelect label="Priorities" value={priority} onChange={setPriority} options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
            <FilterSelect label="Managers" value={rm} onChange={setRm} options={[{ value: "none", label: "Unassigned" }, ...TEAM_OPTIONS]} />
            <FilterSelect label="Industries" value={industry} onChange={setIndustry} options={industries.map((i) => ({ value: i.id, label: i.name }))} />
          </>
        }
        empty={{ title: "No requirements match these filters", icon: <ClipboardList /> }}
      />
    </div>
  );
}
