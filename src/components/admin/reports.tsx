"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { OPPORTUNITY_STAGES, PRO_MODULES } from "@/lib/types";
import { OPP_STAGE_LABEL } from "@/lib/labels";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Bars, Donut, Funnel, Legend, SERIES } from "@/components/ui/charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { DEMO_TAG, downloadCsv, MiniStat, monthKey, monthLabel, monthRange } from "./common";

type Range = "30" | "90" | "all";
type Table = { head: string[]; rows: (string | number)[][] };

function since(range: Range) {
  if (range === "all") return "0000";
  return new Date(Date.now() - Number(range) * 86400000).toISOString().slice(0, 10);
}

export function Reports() {
  const L = useLookups();
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const opportunities = useStore((s) => s.opportunities);
  const engagements = useStore((s) => s.engagements);
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const [range, setRange] = React.useState<Range>("all");
  const [tab, setTab] = React.useState("providers");
  const from = since(range);

  const P = providers.filter((p) => p.joinedAt >= from);
  const R = requirements.filter((r) => r.createdAt >= from);
  const M = matches.filter((m) => m.createdAt.slice(0, 10) >= from);
  const O = opportunities.filter((o) => o.createdAt.slice(0, 10) >= from);
  const E = engagements.filter((e) => e.startDate >= from || e.status === "active");

  const startMonth = range === "all" ? "2026-06" : from.slice(0, 7);
  const months = monthRange(startMonth, new Date().toISOString().slice(0, 7));

  // providers
  const regByMonth = months.map((m) => ({
    month: monthLabel(m),
    Registered: P.filter((p) => monthKey(p.joinedAt) === m).length,
    Verified: P.filter((p) => p.verifiedAt && monthKey(p.verifiedAt) === m).length,
  }));
  const verifiedP = P.filter((p) => p.verifiedAt);
  const avgVerify = verifiedP.length ? Math.round(verifiedP.reduce((s, p) => s + (new Date(p.verifiedAt!).getTime() - new Date(p.joinedAt).getTime()) / 86400000, 0) / verifiedP.length) : 0;
  const verifMix = [
    { name: "Verified", value: P.filter((p) => p.verification === "verified").length, color: SERIES[1] },
    { name: "Pending", value: P.filter((p) => p.verification === "pending" || p.verification === "docs_requested").length, color: SERIES[2] },
    { name: "Not verified", value: P.filter((p) => p.verification === "unverified" || p.verification === "rejected").length, color: SERIES[4] },
  ].filter((d) => d.value > 0);

  // requirements
  const byCategory = categories
    .map((c) => ({ name: c.name.replace(" & ", " & ").split(" ").slice(0, 2).join(" "), full: c.name, Requirements: R.filter((r) => r.categoryId === c.id).length }))
    .filter((x) => x.Requirements > 0)
    .sort((a, b) => b.Requirements - a.Requirements);
  const byIndustry = industries.map((i) => ({ name: i.name.split(" ")[0], full: i.name, Requirements: R.filter((r) => r.industryId === i.id).length })).filter((x) => x.Requirements > 0);

  // matching
  const scored = M.map((m) => {
    const r = requirements.find((x) => x.id === m.requirementId);
    const p = providers.find((x) => x.id === m.providerId);
    return { m, score: r && p ? scoreMatch(r, toMatchable(p), categories).score : 0 };
  });
  const buckets = [
    { band: "< 65", Matches: scored.filter((s) => s.score < 65).length },
    { band: "65–77", Matches: scored.filter((s) => s.score >= 65 && s.score < 78).length },
    { band: "78–87", Matches: scored.filter((s) => s.score >= 78 && s.score < 88).length },
    { band: "88+", Matches: scored.filter((s) => s.score >= 88).length },
  ];
  const approved = M.filter((m) => !["suggested", "rejected"].includes(m.status)).length;
  const removed = M.filter((m) => m.status === "rejected").length;
  const introduced = M.filter((m) => m.status === "introduced").length;
  const avgScore = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0;

  // pipeline
  const won = O.filter((o) => o.stage === "won").length;
  const lost = O.filter((o) => o.stage === "lost").length;

  // pro
  const proRows = E.map((e) => {
    const vals = Object.values(e.modules);
    const current = PRO_MODULES.find((m) => e.modules[m.key] === "active");
    return {
      e,
      done: vals.filter((v) => v === "done").length,
      active: vals.filter((v) => v === "active").length,
      upcoming: vals.filter((v) => v === "upcoming").length,
      current: current?.name ?? (e.status === "completed" ? "Completed" : "—"),
    };
  });

  const tables: Record<string, Table> = {
    providers: { head: ["Month", "Registered", "Verified"], rows: regByMonth.map((r) => [r.month, r.Registered, r.Verified]) },
    requirements: {
      head: ["Category", "Requirements", "Avg. matches"],
      rows: byCategory.map((c) => {
        const cat = categories.find((x) => x.name === c.full)!;
        const rs = R.filter((r) => r.categoryId === cat.id);
        const avg = rs.length ? (rs.reduce((s, r) => s + matches.filter((m) => m.requirementId === r.id).length, 0) / rs.length).toFixed(1) : "0";
        return [c.full, c.Requirements, avg];
      }),
    },
    matching: {
      head: ["Requirement", "Matches", "Approved", "Removed", "Introduced", "Top score"],
      rows: Array.from(new Set(M.map((m) => m.requirementId))).map((rid) => {
        const s = scored.filter((x) => x.m.requirementId === rid);
        return [
          L.requirement(rid)?.code ?? rid,
          s.length,
          s.filter((x) => !["suggested", "rejected"].includes(x.m.status)).length,
          s.filter((x) => x.m.status === "rejected").length,
          s.filter((x) => x.m.status === "introduced").length,
          Math.max(0, ...s.map((x) => x.score)),
        ];
      }),
    },
    pipeline: { head: ["Stage", "Opportunities"], rows: OPPORTUNITY_STAGES.map((s) => [OPP_STAGE_LABEL[s], O.filter((o) => o.stage === s).length]) },
    pro: { head: ["Engagement", "Buyer", "Status", "Modules done", "Current module", "Open tasks"], rows: proRows.map((r) => [r.e.code, L.buyer(r.e.buyerId)?.name ?? "", r.e.status, `${r.done}/8`, r.current, r.e.tasks.filter((t) => t.status !== "done").length]) },
  };
  const t = tables[tab];

  return (
    <div>
      <PageHeader
        title="Reports & analytics"
        description="Platform performance across providers, requirements, matching, opportunities and Elets Pro. All figures are computed live from marketplace data."
        actions={
          <>
            <Segmented value={range} onChange={setRange} options={[{ value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "all", label: "All time" }]} />
            <Button
              variant="secondary"
              onClick={() => {
                downloadCsv(`elets-report-${tab}-${range}.csv`, [t.head, ...t.rows]);
                toast.success("CSV downloaded", { description: `${t.rows.length} rows` });
              }}
            >
              <Download /> Export CSV
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="providers">Provider registrations</TabsTrigger>
          <TabsTrigger value="requirements">Requirement trends</TabsTrigger>
          <TabsTrigger value="matching">Matching performance</TabsTrigger>
          <TabsTrigger value="pipeline">Opportunity pipeline</TabsTrigger>
          <TabsTrigger value="pro">Pro engagements</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="New registrations" value={P.length} />
            <MiniStat label="Verified" value={P.filter((p) => p.verification === "verified").length} />
            <MiniStat label="Avg. days to verify" value={avgVerify} hint="Joined → verified" />
            <MiniStat label="Matching eligible" value={P.filter((p) => p.matchingEligible).length} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Registrations and verifications by month" action={DEMO_TAG} />
              <CardContent>
                <Legend className="mb-2" items={[{ label: "Registered", color: SERIES[0] }, { label: "Verified", color: SERIES[1] }]} />
                <Bars data={regByMonth} x="month" series={[{ key: "Registered", label: "Registered" }, { key: "Verified", label: "Verified" }]} height={240} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Verification status" action={DEMO_TAG} />
              <CardContent>
                <Donut data={verifMix} height={180} centerValue={P.length} centerLabel="providers" />
                <Legend className="mt-4 justify-center" items={verifMix.map((d) => ({ label: d.name, color: d.color, value: d.value }))} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Requirements" value={R.length} />
            <MiniStat label="Completed" value={R.filter((r) => r.stage === "completed").length} />
            <MiniStat label="Pro requested" value={R.filter((r) => r.proRequested).length} />
            <MiniStat label="High priority" value={R.filter((r) => r.priority === "high").length} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="By technology category" action={DEMO_TAG} />
              <CardContent>
                <Bars data={byCategory} x="name" layout="vertical" series={[{ key: "Requirements", label: "Requirements" }]} height={Math.max(160, byCategory.length * 34)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="By industry" action={DEMO_TAG} />
              <CardContent>
                <Bars data={byIndustry} x="name" series={[{ key: "Requirements", label: "Requirements", color: SERIES[1] }]} height={240} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Matches generated" value={M.length} />
            <MiniStat label="Approval rate" value={`${Math.round((approved / Math.max(1, approved + removed)) * 100)}%`} hint={`${approved} approved · ${removed} removed`} />
            <MiniStat label="Introduction rate" value={`${Math.round((introduced / Math.max(1, M.length)) * 100)}%`} hint={`${introduced} introductions`} />
            <MiniStat label="Average score" value={`${avgScore}%`} hint="Illustrative" />
          </div>
          <Card>
            <CardHeader title="Match score distribution" description="Paid listing packages are not inputs to scoring" action={DEMO_TAG} />
            <CardContent>
              <Bars data={buckets} x="band" series={[{ key: "Matches", label: "Matches" }]} height={220} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Opportunities" value={O.length} />
            <MiniStat label="Active" value={O.filter((o) => o.stage !== "won" && o.stage !== "lost").length} />
            <MiniStat label="Won" value={won} />
            <MiniStat label="Win rate (closed)" value={`${Math.round((won / Math.max(1, won + lost)) * 100)}%`} />
          </div>
          <Card>
            <CardHeader title="Pipeline by stage" action={DEMO_TAG} />
            <CardContent>
              <Funnel steps={OPPORTUNITY_STAGES.map((s) => ({ label: OPP_STAGE_LABEL[s], value: O.filter((o) => o.stage === s).length, color: s === "won" ? SERIES[1] : s === "lost" ? SERIES[4] : SERIES[0] }))} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pro" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Engagements" value={E.length} />
            <MiniStat label="Active" value={E.filter((e) => e.status === "active").length} />
            <MiniStat label="Completed" value={E.filter((e) => e.status === "completed").length} />
            <MiniStat label="Open tasks" value={E.reduce((s, e) => s + e.tasks.filter((t) => t.status !== "done").length, 0)} />
          </div>
          <Card>
            <CardHeader title="Module progress by engagement" description="Eight-stage Elets Pro workflow" action={DEMO_TAG} />
            <CardContent>
              <Legend className="mb-2" items={[{ label: "Done", color: SERIES[1] }, { label: "Active", color: SERIES[0] }, { label: "Upcoming", color: SERIES[4] }]} />
              <Bars
                data={proRows.map((r) => ({ code: r.e.code, Done: r.done, Active: r.active, Upcoming: r.upcoming }))}
                x="code"
                layout="vertical"
                stacked
                series={[{ key: "Done", label: "Done", color: SERIES[1] }, { key: "Active", label: "Active", color: SERIES[0] }, { key: "Upcoming", label: "Upcoming", color: SERIES[4] }]}
                height={Math.max(160, proRows.length * 44)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4 overflow-hidden">
        <CardHeader title="Report table" description="The data behind this report — exported by Export CSV" />
        <div className="scrollbar-thin overflow-x-auto border-t border-line">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="border-b border-line bg-subtle/80">
                {t.head.map((h, i) => (
                  <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 ${i ? "text-right" : "text-left"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.length === 0 && (
                <tr>
                  <td colSpan={t.head.length} className="px-4 py-8 text-center text-ink-3">
                    No data in this period.
                  </td>
                </tr>
              )}
              {t.rows.map((r, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {r.map((c, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j ? "text-right tabular-nums text-ink-2" : "font-medium text-ink"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
