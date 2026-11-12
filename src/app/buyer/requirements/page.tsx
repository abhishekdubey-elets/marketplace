"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, LayoutGrid, List, PlusCircle, Sparkles } from "lucide-react";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import type { Requirement } from "@/lib/types";
import { REQUIREMENT_STAGES } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/labels";
import { BUDGET_LABELS } from "@/lib/data/taxonomy";
import { person } from "@/lib/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { StageBadge } from "@/components/shared/domain";
import { Input } from "@/components/ui/input";
import { useBuyerPlan } from "@/lib/use-plan";

export default function RequirementsPage() {
  const user = useUser();
  const premium = useBuyerPlan() === "premium";
  const router = useRouter();
  const L = useLookups();
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const [scope, setScope] = React.useState<"active" | "completed" | "all">("active");
  const [stage, setStage] = React.useState("any");
  const [view, setView] = React.useState<"table" | "cards">("table");
  const [q, setQ] = React.useState("");

  const mine = requirements.filter((r) => r.buyerId === user.orgId);
  const rows = mine
    .filter((r) => (scope === "all" ? true : scope === "active" ? r.stage !== "completed" : r.stage === "completed"))
    .filter((r) => stage === "any" || r.stage === stage)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const matchCount = (id: string) => matches.filter((m) => m.requirementId === id && m.status !== "suggested" && m.status !== "rejected").length;

  const columns: Column<Requirement>[] = [
    {
      key: "title",
      header: "Requirement",
      sortValue: (r) => r.title,
      cell: (r) => (
        <div className="flex min-w-[260px] items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <DynIcon name={L.category(r.categoryId)?.icon ?? "Layers"} className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{r.title}</p>
            <p className="font-mono text-[11px] text-ink-4">{r.code}</p>
          </div>
        </div>
      ),
    },
    { key: "cat", header: "Category", hideOnMobile: true, sortValue: (r) => L.categoryName(r.categoryId), cell: (r) => <span className="whitespace-nowrap">{L.categoryName(r.categoryId)}</span> },
    { key: "stage", header: "Status", sortValue: (r) => REQUIREMENT_STAGES.indexOf(r.stage), cell: (r) => <StageBadge stage={r.stage} /> },
    {
      key: "matches",
      header: "Matches",
      align: "center",
      sortValue: (r) => matchCount(r.id),
      cell: (r) => {
        const n = matchCount(r.id);
        return n ? <span className="font-semibold tabular-nums text-ink">{n}</span> : <span className="text-ink-4">—</span>;
      },
    },
    {
      key: "rm",
      header: "Elets contact",
      hideOnMobile: true,
      cell: (r) =>
        r.assignedTo ? (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Avatar initials={person(r.assignedTo).initials} size="xs" /> {person(r.assignedTo).name}
          </span>
        ) : (
          <span className="text-ink-4">Being assigned</span>
        ),
    },
    {
      key: "pro",
      header: "",
      cell: (r) => (r.proRequested ? <Badge tone="teal"><Sparkles /> Pro</Badge> : null),
    },
    { key: "updated", header: "Updated", align: "right", sortValue: (r) => r.updatedAt, cell: (r) => <span className="whitespace-nowrap text-ink-3">{timeAgo(r.updatedAt)}</span> },
  ];

  const toolbar = (
    <>
      <Segmented
        value={scope}
        onChange={setScope}
        options={[
          { value: "active", label: `Active (${mine.filter((r) => r.stage !== "completed").length})` },
          { value: "completed", label: "Completed" },
          { value: "all", label: "All" },
        ]}
      />
      <div className="w-48">
        <Select size="sm" ariaLabel="Filter by stage" value={stage} onValueChange={setStage} options={[{ value: "any", label: "Any stage" }, ...REQUIREMENT_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))]} />
      </div>
      <Segmented value={view} onChange={setView} options={[{ value: "table", label: <List aria-label="Table view" /> }, { value: "cards", label: <LayoutGrid aria-label="Card view" /> }]} />
    </>
  );

  const cardRows = rows.filter((r) => !q || (r.title + r.code).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="My requirements"
        description="Track every technology requirement from submission through matching, introductions, evaluation and completion."
        actions={
          <Button asChild>
            <Link href="/buyer/requirements/new">
              <PlusCircle /> Post a requirement
            </Link>
          </Button>
        }
      />
      {view === "table" ? (
        <DataTable
          rows={rows}
          columns={columns}
          searchText={(r) => `${r.code} ${r.title} ${L.categoryName(r.categoryId)}`}
          searchPlaceholder="Search requirements…"
          toolbar={toolbar}
          onRowClick={(r) => router.push(`/buyer/requirements/${r.id}`)}
          empty={{
            icon: <ClipboardList />,
            title: "No requirements here",
            description: "Post a requirement and Elets will review, structure and match it with verified providers.",
            action: (
              <Button asChild size="sm">
                <Link href="/buyer/requirements/new">Post a requirement</Link>
              </Button>
            ),
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-card lg:flex-row lg:items-center">
            <div className="lg:w-72">
              <Input placeholder="Search requirements…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search requirements" />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">{toolbar}</div>
          </div>
          {cardRows.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white shadow-card">
              <EmptyState icon={<ClipboardList />} title="No requirements here" description="Try another filter or post a new requirement." />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cardRows.map((r) => {
                const idx = REQUIREMENT_STAGES.indexOf(r.stage);
                return (
                  <Link key={r.id} href={`/buyer/requirements/${r.id}`} className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <DynIcon name={L.category(r.categoryId)?.icon ?? "Layers"} className="size-5" />
                      </span>
                      <StageBadge stage={r.stage} />
                    </div>
                    <p className="mt-3 font-mono text-[11px] text-ink-4">{r.code}</p>
                    <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-ink group-hover:text-brand-700">{r.title}</p>
                    <p className="mt-2 line-clamp-2 text-[13px] text-ink-3">{r.problem}</p>
                    {premium && (
                      <div className="mt-4 grid grid-cols-8 gap-1">
                        {REQUIREMENT_STAGES.map((s, i) => (
                          <span key={s} className={cn("h-1.5 rounded-full", i <= idx ? "bg-brand-500" : "bg-navy-100")} />
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-ink-3">
                      <span>{BUDGET_LABELS[r.budget]}</span>
                      <span>{matchCount(r.id)} matches · {formatDate(r.createdAt, { year: false })}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
