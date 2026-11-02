"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useLookups } from "@/lib/hooks";
import { BUDGET_LABELS, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, PageHeader, ScoreRing, StatCard } from "@/components/ui/misc";
import { IntegrityNote } from "@/components/shared/domain";
import { PROVIDER_MATCH_LABEL, buyerLabel, interestBadge, useCurrentProvider, useProviderOpportunities, type ProviderOpp } from "./common";

type Row = ProviderOpp & { id: string };

export function ProviderOpportunities() {
  const router = useRouter();
  const provider = useCurrentProvider();
  const L = useLookups();
  const opps = useProviderOpportunities(provider?.id);
  const [interest, setInterest] = React.useState<"all" | "none" | "interested" | "declined">("all");
  const [category, setCategory] = React.useState("all");
  const [band, setBand] = React.useState("all");
  const [sort, setSort] = React.useState<"score" | "date">("score");

  const rows: Row[] = React.useMemo(() => {
    const out = opps
      .filter((o) => interest === "all" || o.match.providerInterest === interest)
      .filter((o) => category === "all" || o.requirement.categoryId === category)
      .filter((o) => {
        const s = o.result.score;
        if (band === "strong") return s >= 88;
        if (band === "good") return s >= 78 && s < 88;
        if (band === "partial") return s < 78;
        return true;
      })
      .map((o) => ({ ...o, id: o.match.id }));
    return out.sort((a, b) => (sort === "score" ? b.result.score - a.result.score : b.match.createdAt.localeCompare(a.match.createdAt)));
  }, [opps, interest, category, band, sort]);

  if (!provider) return <EmptyState icon={<Target />} title="Company profile not found" />;

  const cats = Array.from(new Set(opps.map((o) => o.requirement.categoryId)));
  const columns: Column<Row>[] = [
    {
      key: "opp",
      header: "Opportunity",
      cell: (o) => (
        <div className="flex min-w-0 items-center gap-3">
          <ScoreRing score={o.result.score} size={44} stroke={4} />
          <div className="min-w-0">
            <p className="line-clamp-1 text-[13px] font-semibold text-ink group-hover:text-brand-700">{o.requirement.title}</p>
            <p className="truncate text-xs text-ink-3">
              <span className="font-mono">{o.requirement.code}</span> · {buyerLabel(o, { industry: L.industryName, region: L.regionName })}
            </p>
          </div>
        </div>
      ),
    },
    { key: "match", header: "Alignment", cell: (o) => <span className="whitespace-nowrap text-xs font-medium text-ink-2">{o.result.label}</span>, sortValue: (o) => o.result.score, hideOnMobile: true },
    { key: "cat", header: "Category", cell: (o) => <Badge tone="neutral">{L.categoryName(o.requirement.categoryId)}</Badge>, hideOnMobile: true },
    {
      key: "budget",
      header: "Budget · timeline",
      cell: (o) => (
        <div className="whitespace-nowrap text-xs">
          <p className="text-ink-2">{BUDGET_LABELS[o.requirement.budget]}</p>
          <p className="text-ink-4">{TIMELINE_LABELS[o.requirement.timeline]}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: "regions", header: "Regions", cell: (o) => <span className="text-xs text-ink-3">{o.requirement.regions.map(L.regionName).join(", ")}</span>, hideOnMobile: true },
    {
      key: "status",
      header: "Status",
      cell: (o) => (
        <div className="flex flex-col items-start gap-1">
          <Badge tone={PROVIDER_MATCH_LABEL[o.match.status].tone}>{PROVIDER_MATCH_LABEL[o.match.status].label}</Badge>
          {interestBadge(o.match.providerInterest)}
        </div>
      ),
    },
    { key: "date", header: "Matched", cell: (o) => <span className="whitespace-nowrap text-xs text-ink-3">{formatDate(o.match.createdAt)}</span>, sortValue: (o) => o.match.createdAt, hideOnMobile: true },
  ];

  const awaiting = opps.filter((o) => o.match.providerInterest === "none").length;
  const avg = opps.length ? Math.round(opps.reduce((s, o) => s + o.result.score, 0) / opps.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Opportunities" description="Buyer requirements that Elets has reviewed and matched to your profile. Respond to let your relationship manager know whether to propose an introduction." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Matched opportunities" value={opps.length} icon={<Target />} hint="Elets-approved matches" />
        <StatCard label="Awaiting your response" value={awaiting} accent="amber" icon={<Target />} hint="Respond to keep momentum" />
        <StatCard label="Average match score" value={`${avg}%`} accent="accent" icon={<Target />} hint="Illustrative demo values" />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        searchText={(o) => `${o.requirement.title} ${o.requirement.code} ${o.requirement.capabilities.join(" ")}`}
        searchPlaceholder="Search opportunities"
        onRowClick={(o) => router.push(`/provider/opportunities/${o.requirement.id}`)}
        empty={{ title: "No opportunities match these filters", description: "Clear filters, or keep your profile complete so Elets can match you to more requirements." }}
        toolbar={
          <>
            <Segmented
              value={interest}
              onChange={setInterest}
              options={[
                { value: "all", label: "All" },
                { value: "none", label: `New (${awaiting})` },
                { value: "interested", label: "Interested" },
                { value: "declined", label: "Declined" },
              ]}
            />
            <div className="w-44">
              <Select size="sm" value={category} onValueChange={setCategory} options={[{ value: "all", label: "All categories" }, ...cats.map((c) => ({ value: c, label: L.categoryName(c) }))]} />
            </div>
            <div className="w-40">
              <Select
                size="sm"
                value={band}
                onValueChange={setBand}
                options={[
                  { value: "all", label: "Any score" },
                  { value: "strong", label: "88%+ Strong" },
                  { value: "good", label: "78–87% Good" },
                  { value: "partial", label: "Below 78%" },
                ]}
              />
            </div>
            <div className="w-40">
              <Select size="sm" value={sort} onValueChange={(v) => setSort(v as "score" | "date")} options={[{ value: "score", label: "Sort: best match" }, { value: "date", label: "Sort: newest" }]} />
            </div>
          </>
        }
      />
      <IntegrityNote />
    </div>
  );
}
