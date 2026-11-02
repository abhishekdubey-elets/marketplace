"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileSearch,
  Handshake,
  Heart,
  Megaphone,
  Phone,
  PlusCircle,
  Sparkles,
  Target,
  Users,
  Video,
  MapPin,
} from "lucide-react";
import { cn, formatDate, formatTime, timeAgo, weekday } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { REQUIREMENT_STAGES, PRO_MODULES } from "@/lib/types";
import { OPP_STAGE_LABEL, OPP_STAGE_TONE, STAGE_LABEL, STAGE_SHORT } from "@/lib/labels";
import { person } from "@/lib/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, EmptyState, ProviderLogo, ScoreRing, StatCard, VerificationBadge } from "@/components/ui/misc";
import { Donut, Legend, SERIES } from "@/components/ui/charts";
import { Progress } from "@/components/ui/controls";
import { StageBadge } from "@/components/shared/domain";
import { NOTIF_ICON } from "@/components/shell/topbar";

const STAGE_COLORS: Record<string, string> = {
  submitted: "#94a6cc",
  under_review: "#e8a33d",
  matching: "#2149e8",
  shortlisted: "#7c5cf0",
  introduced: "#14ae9f",
  evaluation: "#5b86ff",
  negotiation: "#c97a1a",
  completed: "#0c1631",
};

export default function BuyerDashboard() {
  const user = useUser();
  const L = useLookups();
  const orgId = user.orgId!;
  const buyer = useStore((s) => s.buyers.find((b) => b.id === orgId));
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const opportunities = useStore((s) => s.opportunities);
  const meetings = useStore((s) => s.meetings);
  const engagements = useStore((s) => s.engagements);
  const notifications = useStore((s) => s.notifications);
  const announcements = useStore((s) => s.announcements);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);

  const reqs = requirements.filter((r) => r.buyerId === orgId);
  const active = reqs.filter((r) => r.stage !== "completed");
  const reqIds = new Set(reqs.map((r) => r.id));
  const visible = matches.filter((m) => reqIds.has(m.requirementId) && m.status !== "suggested" && m.status !== "rejected");
  const recommended = visible.filter((m) => m.status === "approved");
  const shortlisted = visible.filter((m) => m.status === "shortlisted" || m.status === "intro_requested");
  const opps = opportunities.filter((o) => o.buyerId === orgId);
  const openOpps = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const now = Date.now();
  const upcoming = meetings
    .filter((m) => m.buyerId === orgId && (m.status === "scheduled" || m.status === "requested") && new Date(m.at).getTime() >= now - 3600000)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 5);
  const eng = engagements.find((e) => e.buyerId === orgId && e.status === "active");
  const feed = notifications.filter((n) => n.audience === "buyer" && (n.userId === null || n.userId === user.id)).slice(0, 6);
  const news = announcements.filter((a) => a.active && (a.audience === "all" || a.audience === "buyer"));

  const stageData = REQUIREMENT_STAGES.map((s) => ({ name: STAGE_LABEL[s], value: reqs.filter((r) => r.stage === s).length, color: STAGE_COLORS[s] })).filter((d) => d.value > 0);

  const recs = recommended
    .map((m) => {
      const r = L.requirement(m.requirementId)!;
      const p = L.provider(m.providerId)!;
      return { m, r, p, res: scoreMatch(r, toMatchable(p), categories) };
    })
    .filter((x) => x.r && x.p)
    .sort((a, b) => b.res.score - a.res.score)
    .slice(0, 4);

  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = user.name.replace(/^(Dr\.|Prof\.)\s*/, "").split(" ")[0];
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="relative overflow-hidden rounded-2xl border border-navy-800 bg-navy-950 px-6 py-6 text-white shadow-raised sm:px-8">
        <div className="grid-bg-dark absolute inset-0" />
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium text-navy-300">
              {weekday(today)}, {formatDate(today)} · {buyer?.name}
            </p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px]">
              {greeting}, {user.name.startsWith("Dr.") ? `Dr. ${user.name.split(" ").at(-1)}` : first}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-navy-200">
              You have <span className="font-semibold text-white">{active.length} active requirements</span>, {recommended.length} new provider recommendations and{" "}
              {upcoming.length} upcoming meetings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline-dark" asChild>
              <Link href="/buyer/discover">
                <FileSearch /> Explore providers
              </Link>
            </Button>
            <Button variant="white" asChild>
              <Link href="/buyer/requirements/new">
                <PlusCircle /> Post a requirement
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active requirements" value={active.length} icon={<ClipboardList />} hint={`${reqs.length - active.length} completed`} href="/buyer/requirements" />
        <StatCard label="Providers recommended" value={visible.length} icon={<Target />} accent="accent" hint={`${recommended.length} awaiting your review`} href="/buyer/requirements" />
        <StatCard label="Shortlisted" value={shortlisted.length + visible.filter((m) => m.status === "introduced").length} icon={<Heart />} accent="violet" hint={`${visible.filter((m) => m.status === "introduced").length} introduced`} href="/buyer/shortlist" />
        <StatCard label="Ongoing opportunities" value={openOpps.length} icon={<Handshake />} accent="amber" hint={`${opps.length - openOpps.length} closed`} href="/buyer/opportunities" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Requirement pipeline"
            description="Where each active requirement sits in the Elets process."
            icon={<ClipboardList />}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/buyer/requirements">
                  View all <ArrowRight />
                </Link>
              </Button>
            }
          />
          <CardContent className="space-y-1 px-2 pb-3">
            {active.length === 0 && (
              <EmptyState compact icon={<ClipboardList />} title="No active requirements" description="Post a requirement and Elets will structure it and identify suitable providers." action={<Button asChild size="sm"><Link href="/buyer/requirements/new">Post a requirement</Link></Button>} />
            )}
            {active.map((r) => {
              const idx = REQUIREMENT_STAGES.indexOf(r.stage);
              const n = visible.filter((m) => m.requirementId === r.id).length;
              return (
                <Link key={r.id} href={`/buyer/requirements/${r.id}`} className="group block rounded-xl px-3 py-3 transition hover:bg-subtle">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-ink-4">{r.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink group-hover:text-brand-700">{r.title}</span>
                    {r.proRequested && <Badge tone="teal"><Sparkles /> Pro</Badge>}
                    <StageBadge stage={r.stage} />
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="grid flex-1 grid-cols-8 gap-1" aria-label={`Stage ${idx + 1} of 8`}>
                      {REQUIREMENT_STAGES.map((s, i) => (
                        <span key={s} title={STAGE_SHORT[s]} className={cn("h-1.5 rounded-full", i < idx ? "bg-brand-500" : i === idx ? "bg-brand-500/60 animate-pulse" : "bg-navy-100")} />
                      ))}
                    </div>
                    <span className="w-28 shrink-0 text-right text-[11px] text-ink-3">{n ? `${n} providers matched` : `Updated ${timeAgo(r.updatedAt)}`}</span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* status overview */}
        <Card>
          <CardHeader title="Status overview" description="All requirements by stage" icon={<Target />} />
          <CardContent>
            {stageData.length ? (
              <>
                <Donut data={stageData} centerValue={reqs.length} centerLabel="requirements" height={190} />
                <Legend className="mt-4" items={stageData.map((d) => ({ label: d.name, color: d.color, value: d.value }))} />
              </>
            ) : (
              <EmptyState compact icon={<Target />} title="No data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* recommendations */}
        <Card className="lg:col-span-2">
          <CardHeader title="New provider recommendations" description="Approved by Elets after review. Scores use the 8-dimension framework." icon={<Sparkles />} />
          <CardContent>
            {recs.length === 0 ? (
              <EmptyState compact icon={<Sparkles />} title="No new recommendations" description="When Elets approves new matches for your requirements, they will appear here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recs.map(({ m, r, p, res }) => (
                  <Link key={m.id} href={`/buyer/requirements/${r.id}?tab=matches`} className="group flex gap-3 rounded-xl border border-line p-3.5 transition hover:border-line-strong hover:shadow-raised">
                    <ProviderLogo provider={p} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink group-hover:text-brand-700">{p.name}</p>
                      <p className="truncate text-xs text-ink-3">for {r.code}</p>
                      <div className="mt-1.5"><VerificationBadge status={p.verification} compact /></div>
                      <p className="mt-2 line-clamp-1 text-xs text-ink-3">{res.reasons[0]}</p>
                    </div>
                    <div className="text-center">
                      <ScoreRing score={res.score} size={48} stroke={4} />
                      <p className="mt-1 text-[10px] text-ink-4">{res.label.split(" ")[0]}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* meetings */}
        <Card>
          <CardHeader
            title="Upcoming meetings"
            icon={<CalendarDays />}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/buyer/meetings">All</Link>
              </Button>
            }
          />
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <EmptyState compact icon={<CalendarDays />} title="No upcoming meetings" />}
            {upcoming.map((m) => {
              const MIcon = m.mode === "video" ? Video : m.mode === "phone" ? Phone : MapPin;
              return (
                <Link key={m.id} href="/buyer/meetings" className="flex gap-3 rounded-xl p-2 transition hover:bg-subtle">
                  <div className="w-12 shrink-0 rounded-lg border border-line bg-white py-1 text-center shadow-xs">
                    <p className="text-[10px] font-semibold uppercase text-brand-600">{weekday(m.at)}</p>
                    <p className="text-lg font-semibold leading-none text-ink">{formatDate(m.at, { year: false }).split(" ")[0]}</p>
                    <p className="text-[10px] text-ink-4">{formatDate(m.at, { year: false }).split(" ")[1]}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{m.title}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                      <MIcon className="size-3.5" /> {formatTime(m.at)}
                      {m.status === "requested" && <Badge tone="amber" className="ml-1">Requested</Badge>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* opportunities */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ongoing opportunities"
            description="Introductions that are progressing towards an outcome."
            icon={<Handshake />}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/buyer/opportunities">
                  View all <ArrowRight />
                </Link>
              </Button>
            }
          />
          <CardContent className="px-0 pb-2">
            {openOpps.length === 0 ? (
              <EmptyState compact icon={<Handshake />} title="No ongoing opportunities" description="Once Elets makes an introduction, the opportunity is tracked here." />
            ) : (
              <div className="divide-y divide-line">
                {openOpps.slice(0, 5).map((o) => {
                  const p = L.provider(o.providerId);
                  const r = L.requirement(o.requirementId);
                  const steps = ["introduction", "discovery", "evaluation", "proposal", "negotiation"];
                  const pct = ((steps.indexOf(o.stage) + 1) / (steps.length + 1)) * 100;
                  return (
                    <Link key={o.id} href="/buyer/opportunities" className="flex items-center gap-3 px-5 py-3 transition hover:bg-subtle">
                      {p && <ProviderLogo provider={p} size="sm" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{p?.name}</p>
                        <p className="truncate text-xs text-ink-3">
                          {r?.code} · Next: {o.nextStep}
                        </p>
                      </div>
                      <div className="hidden w-32 sm:block">
                        <Progress value={pct} tone="accent" />
                      </div>
                      <Badge tone={OPP_STAGE_TONE[o.stage]}>{OPP_STAGE_LABEL[o.stage]}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pro + shortlist */}
        <div className="space-y-6">
          {eng ? (
            <Link href={`/buyer/pro/${eng.id}`} className="group relative block overflow-hidden rounded-2xl border border-navy-800 bg-navy-900 p-5 text-white shadow-raised">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent-500/25 blur-2xl" />
              <div className="relative">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-300">
                  <Sparkles className="size-3.5" /> Elets Pro engagement
                </p>
                <p className="mt-2 text-[15px] font-semibold leading-snug">{eng.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-navy-300">{eng.code}</p>
                {(() => {
                  const done = PRO_MODULES.filter((m) => eng.modules[m.key] === "done" || eng.modules[m.key] === "skipped").length;
                  const cur = PRO_MODULES.find((m) => eng.modules[m.key] === "active");
                  return (
                    <>
                      <div className="mt-4 grid grid-cols-8 gap-1">
                        {PRO_MODULES.map((m) => (
                          <span key={m.key} className={cn("h-1.5 rounded-full", eng.modules[m.key] === "done" ? "bg-accent-400" : eng.modules[m.key] === "active" ? "bg-white" : "bg-white/15")} />
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-navy-200">
                        {done} of 8 stages complete{cur && <> · Now: <span className="font-medium text-white">{cur.name}</span></>}
                      </p>
                    </>
                  );
                })()}
                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
                  <Avatar initials={person(eng.rmId).initials} size="sm" className="ring-navy-900" />
                  <p className="flex-1 text-xs text-navy-200">
                    <span className="font-medium text-white">{person(eng.rmId).name}</span> · Relationship manager
                  </p>
                  <ArrowRight className="size-4 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
              </div>
            </Link>
          ) : (
            <Card className="p-5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-600">
                <Sparkles className="size-3.5" /> Elets Pro
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">Need hands-on support?</p>
              <p className="mt-1 text-[13px] text-ink-3">A relationship manager can run discovery, diligence, RFP and evaluation with you.</p>
              <Button className="mt-4" size="sm" asChild>
                <Link href="/buyer/pro">Explore Elets Pro</Link>
              </Button>
            </Card>
          )}

          <Card>
            <CardHeader title="Shortlisted providers" icon={<Users />} action={<Button variant="ghost" size="sm" asChild><Link href="/buyer/shortlist">All</Link></Button>} />
            <CardContent className="space-y-1">
              {shortlisted.length === 0 && <p className="py-4 text-center text-xs text-ink-3">No shortlisted providers yet.</p>}
              {shortlisted.slice(0, 4).map((m) => {
                const p = providers.find((x) => x.id === m.providerId);
                if (!p) return null;
                return (
                  <Link key={m.id} href={`/buyer/providers/${p.slug}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-subtle">
                    <ProviderLogo provider={p} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
                      <p className="truncate text-[11px] text-ink-3">{L.requirement(m.requirementId)?.code}</p>
                    </div>
                    <Badge tone={m.status === "intro_requested" ? "teal" : "violet"}>{m.status === "intro_requested" ? "Intro requested" : "Shortlisted"}</Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" icon={<ClipboardList />} action={<Button variant="ghost" size="sm" asChild><Link href="/buyer/notifications">View all</Link></Button>} />
          <CardContent>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {feed.map((n) => {
                const I = NOTIF_ICON[n.type];
                return (
                  <li key={n.id} className="relative">
                    <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full border-2 border-white bg-brand-50 text-brand-600">
                      <I className="size-2.5" />
                    </span>
                    <Link href={n.href} className="group block">
                      <p className="text-[13px] font-medium text-ink group-hover:text-brand-700">{n.title}</p>
                      <p className="text-xs leading-relaxed text-ink-3">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-ink-4">{timeAgo(n.at)}</p>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Announcements" icon={<Megaphone />} />
          <CardContent className="space-y-3">
            {news.length === 0 && <p className="py-4 text-center text-xs text-ink-3">No announcements.</p>}
            {news.map((a) => (
              <div key={a.id} className="rounded-xl bg-subtle p-3.5 ring-1 ring-inset ring-line">
                <p className="text-[13px] font-semibold text-ink">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">{a.body}</p>
                <p className="mt-2 text-[11px] text-ink-4">{formatDate(a.at)}</p>
              </div>
            ))}
            <div className="rounded-xl border border-dashed border-line-strong p-3.5" style={{ borderColor: SERIES[4] }}>
              <p className="text-[13px] font-semibold text-ink">Not sure where to start?</p>
              <p className="mt-1 text-xs text-ink-3">Describe the business problem — Elets will help structure it into a requirement.</p>
              <Link href="/buyer/requirements/new" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">Start the guided wizard →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
