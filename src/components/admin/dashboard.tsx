"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCheck,
  ClipboardList,
  Clock,
  Handshake,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import { OPPORTUNITY_STAGES, REQUIREMENT_STAGES } from "@/lib/types";
import { OPP_STAGE_LABEL, STAGE_SHORT } from "@/lib/labels";
import { cn, daysUntil, formatDate, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaTrend, Bars, Donut, Funnel, Legend, SERIES } from "@/components/ui/charts";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from "@/components/ui/overlay";
import { DEMO_TAG, monthKey, monthLabel, monthRange } from "./common";
import { useTeam } from "@/lib/team";

const VERIF_COLORS = { verified: "#2b4bc8", pending: "#e8a33d", docs_requested: "#f0c27a", unverified: "#c5d0e8", rejected: "#e5202e" } as const;

export function AdminDashboard() {
  const user = useUser();
  const L = useLookups();
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const team = useTeam();
  const matches = useStore((s) => s.matches);
  const opportunities = useStore((s) => s.opportunities);
  const engagements = useStore((s) => s.engagements);
  const proRequests = useStore((s) => s.proRequests);
  const audit = useStore((s) => s.audit);
  const updateRequirement = useStore((s) => s.updateRequirement);
  const reviewMatch = useStore((s) => s.reviewMatch);

  const verified = providers.filter((p) => p.verification === "verified").length;
  const pendingVer = providers.filter((p) => ["pending", "docs_requested", "unverified"].includes(p.verification));
  const activeOpps = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost").length;
  const suggested = matches.filter((m) => m.status === "suggested");
  const intros = matches.filter((m) => m.status === "introduced").length;
  const activeEng = engagements.filter((e) => e.status === "active").length;

  const byStage = REQUIREMENT_STAGES.map((s) => ({ stage: STAGE_SHORT[s], Requirements: requirements.filter((r) => r.stage === s).length }));

  const months = monthRange("2026-07", "2026-11");
  const intake = months.map((m) => ({
    month: monthLabel(m),
    Requirements: requirements.filter((r) => monthKey(r.createdAt) === m).length,
    "Provider sign-ups": providers.filter((p) => monthKey(p.joinedAt) === m).length,
  }));

  const verifData = (Object.keys(VERIF_COLORS) as (keyof typeof VERIF_COLORS)[])
    .map((k) => ({ name: k === "docs_requested" ? "Docs requested" : k[0].toUpperCase() + k.slice(1), value: providers.filter((p) => p.verification === k).length, color: VERIF_COLORS[k] }))
    .filter((d) => d.value > 0);

  const funnel = OPPORTUNITY_STAGES.filter((s) => s !== "lost").map((s, i) => ({
    label: OPP_STAGE_LABEL[s],
    value: opportunities.filter((o) => o.stage === s).length,
    color: s === "won" ? SERIES[1] : SERIES[0],
    i,
  }));

  const unassigned = requirements.filter((r) => !r.assignedTo);
  const atRisk = engagements.flatMap((e) => e.milestones.filter((m) => m.status === "at_risk" || (m.status === "upcoming" && daysUntil(m.due) <= 7 && daysUntil(m.due) >= 0)).map((m) => ({ ...m, eng: e })));
  const newPro = proRequests.filter((r) => r.status === "new");
  const suggestedReqs = Array.from(new Set(suggested.map((m) => m.requirementId)));

  const workload = team.map((t) => ({
    member: t,
    reqs: requirements.filter((r) => r.assignedTo === t.id && r.stage !== "completed").length,
    eng: engagements.filter((e) => e.rmId === t.id && e.status === "active").length,
    opps: opportunities.filter((o) => o.ownerId === t.id && o.stage !== "won" && o.stage !== "lost").length,
  }));
  const maxLoad = Math.max(1, ...workload.map((w) => w.reqs + w.eng + w.opps));

  const attentionCount = unassigned.length + suggestedReqs.length + pendingVer.length + newPro.length + atRisk.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${greeting()}, ${user.name.split(" ")[0]}`}
        description="Marketplace operations at a glance — verification, matching, introductions and Elets Pro engagements."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/admin/reports">
                <TrendingUp /> Reports
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/matching">
                <Workflow /> Review matches
                {suggested.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[11px]">{suggested.length}</span>}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Registered providers" value={providers.length} icon={<Briefcase />} hint="All listed companies" href="/admin/providers" />
        <StatCard label="Verified providers" value={verified} icon={<BadgeCheck />} accent="accent" hint={`${Math.round((verified / Math.max(1, providers.length)) * 100)}% of providers`} href="/admin/providers?verification=verified" />
        <StatCard label="Pending verifications" value={pendingVer.length} icon={<ShieldCheck />} accent="amber" hint="Awaiting review or documents" href="/admin/providers?verification=pending" />
        <StatCard label="Buyer requirements" value={requirements.length} icon={<ClipboardList />} accent="navy" hint={`${requirements.filter((r) => r.stage === "submitted").length} new`} href="/admin/requirements" />
        <StatCard label="Active opportunities" value={activeOpps} icon={<Target />} accent="violet" hint="Introduced and in progress" href="/admin/opportunities" />
        <StatCard label="Matching requests" value={suggested.length} icon={<Workflow />} hint={`Across ${suggestedReqs.length} requirements`} href="/admin/matching" />
        <StatCard label="Pro engagements" value={activeEng} icon={<Sparkles />} accent="accent" hint={`${newPro.length} new requests`} href="/admin/pro" />
        <StatCard label="Introductions made" value={intros} icon={<Handshake />} accent="navy" hint="Buyer ↔ provider" href="/admin/opportunities" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Needs attention" description="Items waiting on the operations team" action={<Badge tone={attentionCount ? "amber" : "green"}>{attentionCount} open</Badge>} icon={<AlertTriangle />} />
          <CardContent className="space-y-1 px-2 pb-3">
            {attentionCount === 0 && <EmptyState compact icon={<CheckCheck />} title="Nothing waiting" description="All requirements, matches and verifications are up to date." />}
            {unassigned.map((r) => (
              <AttentionRow
                key={r.id}
                icon={<UserPlus />}
                tone="blue"
                title={`${r.code} has no relationship manager`}
                meta={`${L.buyer(r.buyerId)?.name} · submitted ${timeAgo(r.createdAt)}`}
                href={`/admin/requirements/${r.id}`}
                action={
                  <Dropdown>
                    <DropdownTrigger asChild>
                      <Button size="xs" variant="secondary">
                        Assign
                      </Button>
                    </DropdownTrigger>
                    <DropdownContent>
                      <DropdownLabel>Assign relationship manager</DropdownLabel>
                      {team.length === 0 && (
                        <DropdownItem disabled onSelect={() => {}}>
                          Add people on the Team page first
                        </DropdownItem>
                      )}
                      {team.map((t) => (
                        <DropdownItem
                          key={t.id}
                          onSelect={() => {
                            updateRequirement(r.id, { assignedTo: t.id }, user.id, `Assigned to ${t.name}`);
                            toast.success(`${r.code} assigned`, { description: t.name });
                          }}
                        >
                          <Avatar initials={t.initials} size="xs" /> {t.name}
                        </DropdownItem>
                      ))}
                    </DropdownContent>
                  </Dropdown>
                }
              />
            ))}
            {suggestedReqs.map((rid) => {
              const r = L.requirement(rid);
              const ms = suggested.filter((m) => m.requirementId === rid);
              return (
                <AttentionRow
                  key={rid}
                  icon={<Workflow />}
                  tone="violet"
                  title={`${ms.length} suggested matches awaiting review`}
                  meta={`${r?.code} · ${r?.title}`}
                  href={`/admin/requirements/${rid}`}
                  action={
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        ms.forEach((m) => reviewMatch(m.id, "approved", user.id));
                        toast.success(`Approved ${ms.length} matches`, { description: r?.code });
                      }}
                    >
                      Approve all
                    </Button>
                  }
                />
              );
            })}
            {pendingVer.map((p) => (
              <AttentionRow
                key={p.id}
                icon={<ShieldCheck />}
                tone="amber"
                title={`${p.name} — ${p.verification === "docs_requested" ? "waiting for documents" : p.verification === "pending" ? "verification requested" : "not yet verified"}`}
                meta={`Joined ${formatDate(p.joinedAt)} · ${p.documents.length} documents`}
                href={`/admin/providers/${p.id}`}
                action={
                  <Button size="xs" variant="secondary" asChild>
                    <Link href={`/admin/providers/${p.id}`}>Review</Link>
                  </Button>
                }
              />
            ))}
            {newPro.map((r) => (
              <AttentionRow
                key={r.id}
                icon={<Sparkles />}
                tone="teal"
                title={`Elets Pro request from ${L.buyer(r.buyerId)?.name}`}
                meta={`${r.services.join(", ")} · ${timeAgo(r.at)}`}
                href="/admin/pro"
                action={
                  <Button size="xs" variant="secondary" asChild>
                    <Link href="/admin/pro">Open</Link>
                  </Button>
                }
              />
            ))}
            {atRisk.map((m) => (
              <AttentionRow
                key={m.eng.id + m.id}
                icon={<Clock />}
                tone={m.status === "at_risk" ? "red" : "amber"}
                title={`${m.title} ${m.status === "at_risk" ? "is at risk" : `due in ${daysUntil(m.due)}d`}`}
                meta={`${m.eng.code} · ${m.eng.title}`}
                href={`/admin/pro/${m.eng.id}`}
                action={
                  <Button size="xs" variant="secondary" asChild>
                    <Link href={`/admin/pro/${m.eng.id}`}>Workspace</Link>
                  </Button>
                }
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Recent platform activity" description="From the audit log" action={<Button variant="link" size="xs" asChild><Link href="/admin/audit">View all</Link></Button>} />
          <CardContent>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {audit.slice(0, 7).map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[25px] top-0.5 grid size-[18px] place-items-center rounded-full bg-white ring-1 ring-line">
                    <span className="size-1.5 rounded-full bg-brand-500" />
                  </span>
                  <p className="text-[13px] text-ink-2">
                    <span className="font-medium text-ink">{person(a.actorId).name}</span> {a.action.toLowerCase()}
                  </p>
                  <p className="truncate text-xs text-ink-3">{a.detail}</p>
                  <p className="text-[11px] text-ink-4">{timeAgo(a.at)}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Requirements by stage" description="Current position of every buyer requirement" action={DEMO_TAG} />
          <CardContent>
            <Bars data={byStage} x="stage" series={[{ key: "Requirements", label: "Requirements" }]} height={230} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Intake over time" description="New requirements and provider sign-ups per month" action={DEMO_TAG} />
          <CardContent>
            <Legend className="mb-2" items={[{ label: "Requirements", color: SERIES[0] }, { label: "Provider sign-ups", color: SERIES[1] }]} />
            <AreaTrend data={intake} x="month" series={[{ key: "Requirements", label: "Requirements" }, { key: "Provider sign-ups", label: "Provider sign-ups" }]} height={206} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Provider verification" description="Verification is separate from matching eligibility" action={DEMO_TAG} />
          <CardContent>
            <Donut data={verifData} height={170} centerValue={providers.length} centerLabel="providers" />
            <Legend className="mt-4 justify-center" items={verifData.map((d) => ({ label: d.name, color: d.color, value: d.value }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Opportunity pipeline" description="Introductions moving towards outcomes" action={DEMO_TAG} />
          <CardContent>
            <Funnel steps={funnel} />
            <p className="mt-4 text-xs text-ink-3">
              {opportunities.filter((o) => o.stage === "lost").length} closed without selection ·{" "}
              <Link href="/admin/opportunities" className="font-medium text-brand-600 hover:underline">
                Open board
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Team workload" description="Open requirements, Pro engagements and opportunities" />
          <CardContent className="space-y-3.5">
            {workload.map((w) => {
              const total = w.reqs + w.eng + w.opps;
              return (
                <div key={w.member.id} className="flex items-center gap-3">
                  <Avatar initials={w.member.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-ink">{w.member.name}</span>
                      <span className="tabular-nums text-ink-3">{total}</span>
                    </div>
                    <div className="mt-1 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-navy-100">
                      {[
                        [w.reqs, SERIES[0]],
                        [w.eng, SERIES[1]],
                        [w.opps, SERIES[3]],
                      ].map(([v, c], i) => (
                        <span key={i} style={{ width: `${((v as number) / maxLoad) * 100}%`, background: c as string }} className="h-full rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <Legend className="pt-1" items={[{ label: "Requirements", color: SERIES[0] }, { label: "Pro", color: SERIES[1] }, { label: "Opportunities", color: SERIES[3] }]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

const TONE_BG: Record<string, string> = {
  blue: "bg-navy-900 text-white",
  violet: "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100",
  amber: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
  teal: "bg-flame-50 text-flame-600 ring-1 ring-inset ring-flame-100",
  red: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100",
};

function AttentionRow({ icon, tone, title, meta, href, action }: { icon: React.ReactNode; tone: string; title: string; meta: string; href: string; action?: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-subtle">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4", TONE_BG[tone])}>{icon}</span>
      <Link href={href} className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink group-hover:text-brand-700">{title}</p>
        <p className="truncate text-xs text-ink-3">{meta}</p>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        {action}
        <ArrowRight className="hidden size-4 text-ink-4 sm:block" />
      </div>
    </div>
  );
}
