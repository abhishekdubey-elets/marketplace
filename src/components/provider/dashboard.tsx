"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  Handshake,
  Megaphone,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatTime, timeAgo, weekday } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { profileCompletion, useLookups } from "@/lib/hooks";
import { OPP_STAGE_LABEL, OPP_STAGE_TONE, VERIFICATION_LABEL } from "@/lib/labels";
import { BUDGET_LABELS } from "@/lib/data/taxonomy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/controls";
import { EmptyState, PageHeader, ProviderLogo, ScoreRing, StatCard, VerificationBadge } from "@/components/ui/misc";
import { AreaTrend, Funnel, Sparkline, SERIES } from "@/components/ui/charts";
import { NOTIF_ICON } from "@/components/shell/topbar";
import { MONTHS_12, PROVIDER_MATCH_LABEL, buyerLabel, useCurrentProvider, useProviderOpportunities } from "./common";
import { isForUser } from "@/lib/people";

export function ProviderDashboard() {
  const user = useUser();
  const provider = useCurrentProvider();
  const L = useLookups();
  const opps = useProviderOpportunities(provider?.id);
  const opportunities = useStore((s) => s.opportunities);
  const meetings = useStore((s) => s.meetings);
  const notifications = useStore((s) => s.notifications);
  const announcements = useStore((s) => s.announcements);
  const setInterest = useStore((s) => s.setProviderInterest);

  if (!provider) return <EmptyState icon={<Target />} title="Company profile not found" description="Your account is not linked to a provider profile." />;

  const completion = profileCompletion(provider);
  const fresh = opps.filter((o) => ["approved", "shortlisted", "intro_requested"].includes(o.match.status) && o.match.providerInterest === "none").sort((a, b) => b.result.score - a.result.score);
  const myOpps = opportunities.filter((o) => o.providerId === provider.id);
  const activeIntros = myOpps.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const shortlisted = opps.filter((o) => ["shortlisted", "intro_requested", "introduced"].includes(o.match.status));
  const upcoming = meetings
    .filter((m) => m.providerId === provider.id && (m.status === "scheduled" || m.status === "requested"))
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 4);
  const activity = notifications.filter((n) => n.audience === "provider" && isForUser(n, user)).slice(0, 6);
  const news = announcements.filter((a) => a.active && (a.audience === "all" || a.audience === "provider"));
  const views = provider.profileViewsTrend;
  const lastMonth = views.at(-1) ?? 0;
  const prevMonth = views.at(-2) ?? 1;
  const delta = Math.round(((lastMonth - prevMonth) / Math.max(1, prevMonth)) * 100);

  const respond = (matchId: string, interest: "interested" | "declined", title: string) => {
    setInterest(matchId, interest);
    toast.success(interest === "interested" ? "Interest sent to Elets" : "Marked as not a fit", {
      description: interest === "interested" ? `Your relationship manager will review your interest in “${title}”.` : "This opportunity has been moved out of your queue.",
    });
  };

  const funnel = [
    { label: "Matched by Elets", value: opps.length, color: SERIES[0] },
    { label: "Interest expressed", value: opps.filter((o) => o.match.providerInterest === "interested").length, color: SERIES[0] },
    { label: "Introduced", value: myOpps.length, color: SERIES[1] },
    { label: "In evaluation+", value: myOpps.filter((o) => ["evaluation", "proposal", "negotiation", "won"].includes(o.stage)).length, color: SERIES[1] },
    { label: "Won", value: myOpps.filter((o) => o.stage === "won").length, color: SERIES[1] },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <div className="flex items-center gap-2">
            <ProviderLogo provider={provider} size="sm" />
            <span className="text-[13px] font-medium text-ink-2">{provider.name}</span>
            <VerificationBadge status={provider.verification} compact />
          </div>
        }
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="Here is what is happening across your matched opportunities, introductions and profile."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href={`/providers/${provider.slug}`}>
                <Eye /> Public profile
              </Link>
            </Button>
            <Button asChild>
              <Link href="/provider/opportunities">
                <Target /> View opportunities
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium text-ink-3">Profile views · this month</p>
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Eye className="size-4" />
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-[26px] font-semibold leading-none tracking-tight text-ink tabular-nums">{lastMonth}</p>
            <div className="w-24">
              <Sparkline values={views} />
            </div>
          </div>
          <p className="mt-2 text-xs">
            <span className={cn("font-medium", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>{" "}
            <span className="text-ink-3">vs last month · demo data</span>
          </p>
        </div>
        <StatCard label="Relevant opportunities" value={opps.length} icon={<Target />} hint={`${fresh.length} awaiting your response`} href="/provider/opportunities" />
        <StatCard label="Active introductions" value={activeIntros.length} icon={<Handshake />} accent="accent" hint={`${myOpps.length} introductions to date`} href="/provider/leads" />
        <StatCard label="Shortlisted by buyers" value={shortlisted.length} icon={<Star />} accent="violet" hint="Across matched requirements" href="/provider/opportunities" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              icon={<Target />}
              title="New matching opportunities"
              description="Requirements Elets has matched to your capabilities. Buyer identities are shared once an introduction is made."
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/opportunities">
                    All <ChevronRight />
                  </Link>
                </Button>
              }
            />
            <CardContent className="space-y-2.5">
              {fresh.length === 0 ? (
                <EmptyState compact icon={<Check />} title="You're up to date" description="You've responded to every matched opportunity. New matches will appear here after Elets review." />
              ) : (
                fresh.slice(0, 4).map((o) => (
                  <div key={o.match.id} className="group flex flex-col gap-3 rounded-xl border border-line p-3.5 transition hover:border-line-strong hover:bg-subtle/50 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <ScoreRing score={o.result.score} size={48} stroke={4} />
                      <div className="min-w-0">
                        <Link href={`/provider/opportunities/${o.requirement.id}`} className="line-clamp-1 text-[13px] font-semibold text-ink hover:text-brand-700">
                          {o.requirement.title}
                        </Link>
                        <p className="truncate text-xs text-ink-3">{buyerLabel(o, { industry: L.industryName, region: L.regionName })}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone="neutral">{L.categoryName(o.requirement.categoryId)}</Badge>
                          <Badge tone="neutral">{BUDGET_LABELS[o.requirement.budget]}</Badge>
                          <Badge tone={PROVIDER_MATCH_LABEL[o.match.status].tone}>{PROVIDER_MATCH_LABEL[o.match.status].label}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="secondary" onClick={() => respond(o.match.id, "declined", o.requirement.title)}>
                        <ThumbsDown /> Not a fit
                      </Button>
                      <Button size="sm" onClick={() => respond(o.match.id, "interested", o.requirement.title)}>
                        <ThumbsUp /> Express interest
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader title="Profile views" description="Last 12 months · illustrative demo data" />
              <CardContent>
                <AreaTrend data={views.map((v, i) => ({ month: MONTHS_12[i], views: v }))} x="month" series={[{ key: "views", label: "Profile views" }]} height={210} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Opportunity funnel" description="From match to outcome" />
              <CardContent>
                <Funnel steps={funnel} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader
              icon={<Handshake />}
              title="Active introductions"
              description="Opportunities where Elets has introduced you to the buyer"
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/provider/leads">
                    Manage leads <ChevronRight />
                  </Link>
                </Button>
              }
            />
            <CardContent className="p-0">
              {myOpps.length === 0 ? (
                <EmptyState compact icon={<Handshake />} title="No introductions yet" description="Express interest in matched opportunities to be considered for an introduction." />
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {myOpps.slice(0, 5).map((o) => {
                    const r = L.requirement(o.requirementId);
                    const b = L.buyer(o.buyerId);
                    return (
                      <li key={o.id}>
                        <Link href="/provider/leads" className="flex items-center gap-3 px-5 py-3 transition hover:bg-subtle/60">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-subtle text-[11px] font-semibold text-navy-700">{b?.initials}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-ink">{b?.name}</p>
                            <p className="truncate text-xs text-ink-3">{r?.title}</p>
                          </div>
                          <div className="hidden text-right text-xs text-ink-3 sm:block">
                            <p className="text-ink-2">{o.nextStep}</p>
                            {o.nextStepDue && <p>Due {formatDate(o.nextStepDue, { year: false })}</p>}
                          </div>
                          <Badge tone={OPP_STAGE_TONE[o.stage]} dot>
                            {OPP_STAGE_LABEL[o.stage]}
                          </Badge>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile completion" description="Complete profiles are easier for Elets to match" />
            <CardContent>
              <div className="flex items-center gap-4">
                <ScoreRing score={completion.percent} size={64} />
                <div className="flex-1">
                  <Progress value={completion.percent} tone={completion.percent === 100 ? "green" : "brand"} />
                  <p className="mt-2 text-xs text-ink-3">
                    {completion.checks.filter(([, ok]) => ok).length} of {completion.checks.length} sections complete
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {completion.checks
                  .filter(([, ok]) => !ok)
                  .slice(0, 4)
                  .map(([label]) => (
                    <li key={label} className="flex items-center gap-2 text-[13px] text-ink-2">
                      <span className="size-4 rounded-full border-2 border-dashed border-line-strong" />
                      {label}
                    </li>
                  ))}
                {completion.checks.every(([, ok]) => ok) && (
                  <li className="flex items-center gap-2 text-[13px] text-emerald-700">
                    <BadgeCheck className="size-4" /> Every section is complete
                  </li>
                )}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                  <Link href="/provider/profile">Edit profile</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/provider/onboarding">
                    Guided setup <ArrowRight />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className={cn("px-5 py-4", provider.verification === "verified" ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-gradient-to-br from-amber-50 to-white")}>
              <div className="flex items-center gap-3">
                <span className={cn("grid size-10 place-items-center rounded-xl", provider.verification === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                  <BadgeCheck className="size-5" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">Verification: {VERIFICATION_LABEL[provider.verification]}</p>
                  <p className="text-xs text-ink-3">{provider.verifiedAt ? `Verified on ${formatDate(provider.verifiedAt)}` : "Submit documents for Elets review"}</p>
                </div>
              </div>
            </div>
            <CardContent className="pt-4">
              <p className="text-xs leading-relaxed text-ink-3">Verification confirms your company details, documents and references. It is separate from your listing package and from matching eligibility.</p>
              <Button variant="link" size="sm" className="mt-2" asChild>
                <Link href="/provider/verification">Verification details →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              icon={<CalendarDays />}
              title="Upcoming meetings"
              action={
                upcoming.length > 0 ? (
                  <Badge tone="blue">{upcoming.length}</Badge>
                ) : undefined
              }
            />
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyState compact icon={<CalendarDays />} title="No meetings scheduled" description="Meetings arranged by Elets with buyers will show here." />
              ) : (
                upcoming.map((m) => (
                  <div key={m.id} className="flex gap-3 rounded-xl border border-line p-3">
                    <div className="grid w-11 shrink-0 place-items-center rounded-lg bg-brand-50 py-1 text-center">
                      <span className="text-[10px] font-semibold uppercase text-brand-600">{weekday(m.at)}</span>
                      <span className="text-base font-semibold leading-none text-brand-800">{formatDate(m.at, { year: false }).split(" ")[0]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-[13px] font-medium text-ink">{m.title}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-3">
                        {m.mode === "video" ? <Video className="size-3" /> : <CalendarDays className="size-3" />}
                        {formatTime(m.at)} · {m.durationMins} min
                      </p>
                      {m.status === "requested" && (
                        <Badge tone="amber" className="mt-1.5">
                          Awaiting confirmation
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Recent activity" />
            <CardContent>
              <ol className="relative space-y-4 border-l border-line pl-5">
                {activity.map((n) => {
                  const I = NOTIF_ICON[n.type];
                  return (
                    <li key={n.id} className="relative">
                      <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full border border-line bg-white text-ink-3">
                        <I className="size-3" />
                      </span>
                      <Link href={n.href} className="text-[13px] font-medium text-ink hover:text-brand-700">
                        {n.title}
                      </Link>
                      <p className="line-clamp-2 text-xs text-ink-3">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-ink-4">{timeAgo(n.at)}</p>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {news.length > 0 && (
            <Card className="border-brand-100 bg-gradient-to-br from-brand-50/70 to-white">
              <CardHeader icon={<Megaphone />} title="From Elets" />
              <CardContent className="space-y-3">
                {news.map((a) => (
                  <div key={a.id}>
                    <p className="text-[13px] font-medium text-ink">{a.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{a.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
