"use client";

import * as React from "react";
import { Download, ScrollText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { person } from "@/lib/people";
import type { AuditEntry } from "@/lib/types";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tone } from "@/lib/labels";
import { downloadCsv, FilterSelect } from "./common";

const ENTITY: Record<AuditEntry["entity"], { label: string; tone: Tone }> = {
  provider: { label: "Provider", tone: "blue" },
  buyer: { label: "Buyer", tone: "navy" },
  requirement: { label: "Requirement", tone: "violet" },
  match: { label: "Match", tone: "teal" },
  opportunity: { label: "Opportunity", tone: "amber" },
  engagement: { label: "Elets Pro", tone: "green" },
  category: { label: "Taxonomy", tone: "neutral" },
  content: { label: "Content", tone: "neutral" },
  team: { label: "Team", tone: "neutral" },
  system: { label: "System", tone: "neutral" },
};

export function AuditLog() {
  const audit = useStore((s) => s.audit);
  const [entity, setEntity] = React.useState("all");
  const [actor, setActor] = React.useState("all");
  const actors = Array.from(new Set(audit.map((a) => a.actorId)));
  const rows = audit.filter((a) => (entity === "all" || a.entity === entity) && (actor === "all" || a.actorId === actor));

  const columns: Column<AuditEntry>[] = [
    {
      key: "at",
      header: "When",
      sortValue: (a) => a.at,
      cell: (a) => (
        <div className="whitespace-nowrap">
          <p className="text-[13px] text-ink">{timeAgo(a.at)}</p>
          <p className="text-[11px] text-ink-4">{formatDateTime(a.at)}</p>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      sortValue: (a) => person(a.actorId).name,
      cell: (a) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Avatar initials={person(a.actorId).initials} size="xs" />
          <span className="text-[13px] text-ink">{person(a.actorId).name}</span>
        </span>
      ),
    },
    { key: "action", header: "Action", sortValue: (a) => a.action, cell: (a) => <span className="font-medium text-ink">{a.action}</span> },
    { key: "entity", header: "Entity", sortValue: (a) => a.entity, cell: (a) => <Badge tone={ENTITY[a.entity].tone}>{ENTITY[a.entity].label}</Badge> },
    { key: "detail", header: "Detail", cell: (a) => <span className="line-clamp-2 max-w-md text-xs text-ink-3">{a.detail}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every important administrative action — verification decisions, listing changes, stage changes, matching reviews and introductions — is recorded here."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              downloadCsv("elets-audit-log.csv", [["Timestamp", "Actor", "Action", "Entity", "Entity ID", "Detail"], ...rows.map((a) => [a.at, person(a.actorId).name, a.action, a.entity, a.entityId ?? "", a.detail])]);
              toast.success("Audit log exported", { description: `${rows.length} entries` });
            }}
          >
            <Download /> Export CSV
          </Button>
        }
      />
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-ink-3 shadow-xs">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-600" />
        <p>
          Entries are append-only in the application. Listing-package changes are logged with an explicit note that they have no effect on matching. In this demo the log is stored in your browser; production
          storage is the <code className="rounded bg-subtle px-1 font-mono text-[11px]">audit_log</code> table described in the Supabase schema.
        </p>
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        pageSize={15}
        searchText={(a) => `${a.action} ${a.detail} ${person(a.actorId).name} ${a.entity}`}
        searchPlaceholder="Search actions and details…"
        initialSort={{ key: "at", dir: "desc" }}
        toolbar={
          <>
            <FilterSelect label="Entities" value={entity} onChange={setEntity} options={(Object.keys(ENTITY) as AuditEntry["entity"][]).map((k) => ({ value: k, label: ENTITY[k].label }))} />
            <FilterSelect label="Actors" value={actor} onChange={setActor} options={actors.map((a) => ({ value: a, label: person(a).name }))} />
          </>
        }
        empty={{ title: "No audit entries", icon: <ScrollText /> }}
      />
    </div>
  );
}
