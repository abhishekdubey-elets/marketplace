"use client";

import * as React from "react";
import { BarChart3, Eye, Gauge, Handshake, MessageSquareReply } from "lucide-react";
import { useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/controls";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { AreaTrend, Bars, Donut, Funnel, Legend, SERIES } from "@/components/ui/charts";
import { MONTHS_12, useCurrentProvider, useProviderOpportunities } from "./common";
import { SAMPLE_DATA } from "@/lib/seed";

export function ProviderAnalytics() {
  const provider = useCurrentProvider();
  const L = useLookups();
  const opps = useProviderOpportunities(provider?.id);
  const opportunities = useStore((s) => s.opportunities);
  const [range, setRange] = React.useState<"6" | "12">("12");

  if (!provider) return <EmptyState icon={<BarChart3 />} title="Company profile not found" />;

  const leads = opportunities.filter((o) => o.providerId === provider.id);
  const views = provider.profileViewsTrend;
  const months = range === "6" ? 6 : 12;
  const trend = views.slice(-months).map((v, i) => ({ month: MONTHS_12.slice(-months)[i], views: v, searches: Math.round(v * 0.42) }));
  const totalViews = views.slice(-months).reduce((s, v) => s + v, 0);
  const responded = opps.filter((o) => o.match.providerInterest !== "none").length;
  const responseRate = opps.length ? Math.round((responded / opps.length) * 100) : 0;
  const avgScore = opps.length ? Math.round(opps.reduce((s, o) => s + o.result.score, 0) / opps.length) : 0;

  // Views by buyer sector: distributed by the sectors of matched requirements, weighted to the provider's verticals (demo model).
  const sectorWeights = new Map<string, number>();
  provider.industries.forEach((i) => sectorWeights.set(i, 1));
  opps.forEach((o) => sectorWeights.set(o.requirement.industryId, (sectorWeights.get(o.requirement.industryId) ?? 0) + 2));
  const wTotal = [...sectorWeights.values()].reduce((s, v) => s + v, 0) || 1;
  const bySector = [...sectorWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, w], i) => ({ name: L.industryName(id), value: Math.round((w / wTotal) * totalViews), color: SERIES[i] }));

  const bands = [
    { band: "90%+", count: opps.filter((o) => o.result.score >= 90).length },
    { band: "80–89%", count: opps.filter((o) => o.result.score >= 80 && o.result.score < 90).length },
    { band: "70–79%", count: opps.filter((o) => o.result.score >= 70 && o.result.score < 80).length },
    { band: "Below 70%", count: opps.filter((o) => o.result.score < 70).length },
  ];

  const capCounts = new Map<string, number>();
  opps.forEach((o) => o.requirement.capabilities.forEach((c) => capCounts.set(c, (capCounts.get(c) ?? 0) + 1)));
  const have = new Set(provider.capabilities);
  const topCaps = [...capCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([cap, n]) => ({ cap, requested: n, covered: have.has(cap) ? n : 0 }));

  const funnel = [
    { label: "Matched", value: opps.length, color: SERIES[0] },
    { label: "Interested", value: opps.filter((o) => o.match.providerInterest === "interested").length, color: SERIES[0] },
    { label: "Introduced", value: leads.length, color: SERIES[1] },
    { label: "Won", value: leads.filter((o) => o.stage === "won").length, color: SERIES[1] },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance analytics"
        description={SAMPLE_DATA ? "How buyers discover your profile and how your matched opportunities progress. Values are illustrative demo data." : "How your matched opportunities progress. Profile-view tracking isn't switched on yet, so view figures stay at zero for now."}
        actions={<Segmented value={range} onChange={setRange} options={[{ value: "6", label: "6 months" }, { value: "12", label: "12 months" }]} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Profile views · ${months} months`} value={totalViews.toLocaleString("en-IN")} icon={<Eye />} hint={SAMPLE_DATA ? "Demo data" : undefined} />
        <StatCard label="Response rate" value={`${responseRate}%`} icon={<MessageSquareReply />} accent="accent" hint={`${responded} of ${opps.length} opportunities answered`} />
        <StatCard label="Average match score" value={`${avgScore}%`} icon={<Gauge />} accent="violet" hint="Across Elets-approved matches" />
        <StatCard label="Introductions" value={leads.length} icon={<Handshake />} accent="amber" hint={`${leads.filter((o) => o.stage === "won").length} won`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Profile views & search appearances" description={SAMPLE_DATA ? "Monthly · demo data" : "Monthly · tracking not yet enabled"} action={<Legend items={[{ label: "Profile views", color: SERIES[0] }, { label: "Search appearances", color: SERIES[1] }]} />} />
          <CardContent>
            <AreaTrend data={trend} x="month" series={[{ key: "views", label: "Profile views" }, { key: "searches", label: "Search appearances" }]} height={250} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Views by buyer sector" description={SAMPLE_DATA ? "Estimated distribution · demo data" : "Tracking not yet enabled"} />
          <CardContent>
            <Donut data={bySector} centerValue={totalViews.toLocaleString("en-IN")} centerLabel="views" height={180} />
            <Legend className="mt-4" items={bySector.map((s) => ({ label: s.name, color: s.color, value: s.value }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Match score distribution" description="Elets-approved matches by score band" />
          <CardContent>
            <Bars data={bands} x="band" series={[{ key: "count", label: "Opportunities" }]} height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Opportunity funnel" description="Matched → interested → introduced → won" />
          <CardContent className="pt-2">
            <Funnel steps={funnel} />
            <p className="mt-5 rounded-lg bg-subtle px-3 py-2 text-xs leading-relaxed text-ink-3">
              Introductions depend on buyer shortlisting and Elets review. Responding quickly to matched opportunities helps your relationship manager move faster.
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader title="Top capabilities requested" description="In requirements matched to you" action={<Legend items={[{ label: "Requested", color: SERIES[4] }, { label: "On your profile", color: SERIES[1] }]} />} />
          <CardContent>
            {topCaps.length === 0 ? (
              <EmptyState compact icon={<BarChart3 />} title="No data yet" />
            ) : (
              <Bars
                data={topCaps}
                x="cap"
                layout="vertical"
                series={[
                  { key: "requested", label: "Requested", color: SERIES[4] },
                  { key: "covered", label: "On your profile", color: SERIES[1] },
                ]}
                height={260}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
