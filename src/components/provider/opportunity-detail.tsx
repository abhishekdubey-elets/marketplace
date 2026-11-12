"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CircleHelp,
  Clock,
  Coins,
  EyeOff,
  MapPin,
  MessageSquare,
  Server,
  ShieldCheck,
  Target,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import { BUDGET_LABELS, DEPLOYMENT_LABELS, SCALE_LABELS, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/overlay";
import { EmptyState, OrgAvatar } from "@/components/ui/misc";
import { IntegrityNote, MatchExplanation, MatchScoreBlock, StageBadge } from "@/components/shared/domain";
import { PROVIDER_MATCH_LABEL, buyerLabel, interestBadge, useCurrentProvider, useProviderOpportunities } from "./common";
import { defaultContactId } from "@/lib/team";

const ORDER = ["approved", "shortlisted", "intro_requested", "introduced"] as const;

export function ProviderOpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();
  const provider = useCurrentProvider();
  const L = useLookups();
  const opps = useProviderOpportunities(provider?.id);
  const setInterest = useStore((s) => s.setProviderInterest);
  const createThread = useStore((s) => s.createThread);
  const meetings = useStore((s) => s.meetings);
  const [respond, setRespond] = React.useState<"interested" | "declined" | null>(null);
  const [note, setNote] = React.useState("");
  const [askOpen, setAskOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [qErr, setQErr] = React.useState("");

  const o = opps.find((x) => x.requirement.id === id);
  if (!provider || !o) {
    return (
      <Card>
        <EmptyState
          icon={<EyeOff />}
          title="Opportunity not available"
          description="This requirement isn't matched to your profile, or Elets hasn't completed its review yet."
          action={
            <Button variant="secondary" asChild>
              <Link href="/provider/opportunities">
                <ArrowLeft /> Back to opportunities
              </Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const { requirement: r, match: m, result } = o;
  const introduced = m.status === "introduced";
  const rmId = r.assignedTo ?? defaultContactId();
  const rm = person(rmId);
  const statusIdx = ORDER.indexOf(m.status as (typeof ORDER)[number]);
  const myMeetings = meetings.filter((x) => x.requirementId === r.id && x.providerId === provider.id);
  const have = new Set(provider.capabilities.map((c) => c.toLowerCase()));

  const submitResponse = () => {
    if (!respond) return;
    setInterest(m.id, respond);
    if (note.trim()) {
      createThread(
        { subject: `${respond === "interested" ? "Interest" : "Declined"} — ${r.code}`, participants: [user.id, rmId], context: { kind: "requirement", id: r.id } },
        user.id,
        note.trim(),
      );
    }
    toast.success(respond === "interested" ? "Interest sent to Elets" : "Response recorded", {
      description: respond === "interested" ? `${rm.name} will review and may propose an introduction.` : "Thanks — this helps Elets improve future matches.",
    });
    setRespond(null);
    setNote("");
  };

  const timeline = [
    { label: "Matched by engine", done: true, at: m.createdAt },
    { label: "Reviewed & approved by Elets", done: statusIdx >= 0, at: m.reviewedBy ? m.createdAt : null, by: m.reviewedBy },
    { label: "Shortlisted by buyer", done: statusIdx >= 1 },
    { label: "Introduction requested", done: statusIdx >= 2 },
    { label: "Introduction made", done: statusIdx >= 3, at: introduced ? m.updatedAt : null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => router.push("/provider/opportunities")} className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
          <ArrowLeft className="size-4" /> Opportunities
        </button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-ink-3">{r.code}</span>
              <Badge tone={PROVIDER_MATCH_LABEL[m.status].tone} dot>
                {PROVIDER_MATCH_LABEL[m.status].label}
              </Badge>
              {interestBadge(m.providerInterest)}
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{r.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3">
              {introduced ? <Building2 className="size-4" /> : <EyeOff className="size-4" />}
              {buyerLabel(o, { industry: L.industryName, region: L.regionName })}
              {!introduced && <span className="text-ink-4">· buyer identity shared after introduction</span>}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setAskOpen(true)}>
              <CircleHelp /> Ask Elets
            </Button>
            {m.providerInterest !== "declined" && (
              <Button variant="secondary" onClick={() => setRespond("declined")}>
                <ThumbsDown /> Not a fit
              </Button>
            )}
            {m.providerInterest !== "interested" && (
              <Button onClick={() => setRespond("interested")}>
                <ThumbsUp /> Express interest
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Requirement brief" description={`Submitted ${formatDate(r.createdAt)} · structured by Elets`} action={<StageBadge stage={r.stage} />} />
            <CardContent className="space-y-5">
              <p className="text-[13px] leading-relaxed text-ink-2">{r.problem}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Coins, label: "Budget", value: BUDGET_LABELS[r.budget] },
                  { icon: Clock, label: "Timeline", value: TIMELINE_LABELS[r.timeline] },
                  { icon: MapPin, label: "Location", value: introduced ? r.location : r.regions.map(L.regionName).join(", ") },
                  { icon: Target, label: "Scale", value: SCALE_LABELS[r.scale] },
                ].map((x) => (
                  <div key={x.label} className="rounded-xl border border-line bg-subtle/50 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-4">
                      <x.icon className="size-3.5" /> {x.label}
                    </p>
                    <p className="mt-1 text-[13px] font-medium text-ink">{x.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Objectives</p>
                  <ul className="space-y-1.5">
                    {r.objectives.map((x) => (
                      <li key={x} className="flex items-start gap-2 text-[13px] text-ink-2">
                        <Target className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Required capabilities vs your profile</p>
                  <ul className="space-y-1.5">
                    {r.capabilities.map((c) => {
                      const ok = have.has(c.toLowerCase());
                      return (
                        <li key={c} className="flex items-center gap-2 text-[13px]">
                          <span className={cn("grid size-4 place-items-center rounded-full", ok ? "bg-accent-100 text-accent-700" : "bg-navy-100 text-ink-4")}>
                            {ok ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
                          </span>
                          <span className={ok ? "text-ink-2" : "text-ink-3"}>{c}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-4 text-[13px]">
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                    <Server className="size-3.5" /> Deployment
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.deployment.map((d) => (
                      <Badge key={d} tone="neutral">
                        {DEPLOYMENT_LABELS[d]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                    <ShieldCheck className="size-3.5" /> Compliance
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.compliance.map((c) => (
                      <Badge key={c} tone={provider.certifications.includes(c) ? "green" : "amber"}>
                        {provider.certifications.includes(c) && <Check />}
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Why you were matched" description="Explainable eight-dimension framework" action={<MatchScoreBlock result={result} size={56} />} />
            <CardContent className="space-y-5">
              <MatchExplanation result={result} />
              <IntegrityNote />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Your response" />
            <CardContent>
              <div className="rounded-xl border border-line bg-subtle/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-3">Current status</span>
                  {interestBadge(m.providerInterest)}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-3">
                  {m.providerInterest === "none"
                    ? "Let Elets know whether this opportunity fits your capabilities and capacity."
                    : m.providerInterest === "interested"
                      ? "Elets has your interest. Introductions are made after Elets and the buyer agree on the shortlist."
                      : "You marked this as not a fit. You can change your response at any time."}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant={m.providerInterest === "declined" ? "subtle" : "secondary"} size="sm" onClick={() => setRespond("declined")}>
                  <ThumbsDown /> Not a fit
                </Button>
                <Button variant={m.providerInterest === "interested" ? "subtle" : "primary"} size="sm" onClick={() => setRespond("interested")}>
                  <ThumbsUp /> Interested
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Match progress" />
            <CardContent>
              <ol className="space-y-0">
                {timeline.map((t, i) => (
                  <li key={t.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < timeline.length - 1 && <span className={cn("absolute left-[9px] top-5 h-full w-0.5", t.done && timeline[i + 1].done ? "bg-brand-500" : "bg-line")} />}
                    <span className={cn("relative z-10 grid size-5 shrink-0 place-items-center rounded-full", t.done ? "bg-brand-600 text-white" : "border-2 border-line-strong bg-white")}>
                      {t.done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <div>
                      <p className={cn("text-[13px]", t.done ? "font-medium text-ink" : "text-ink-4")}>{t.label}</p>
                      {t.done && t.at && <p className="text-xs text-ink-3">{formatDate(t.at)}{t.by ? ` · ${person(t.by).name}` : ""}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title={introduced ? "Buyer" : "About the buyer"} />
            <CardContent>
              {introduced && o.buyer ? (
                <div className="flex items-center gap-3">
                  <OrgAvatar initials={o.buyer.initials} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{o.buyer.name}</p>
                    <p className="text-xs text-ink-3">
                      {[o.buyer.type, o.buyer.city, o.buyer.state].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-3">Contact: {o.buyer.contactName}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-dashed border-line-strong bg-subtle text-ink-4">
                    <EyeOff className="size-4" />
                  </span>
                  <p className="text-xs leading-relaxed text-ink-3">
                    {buyerLabel(o, { industry: L.industryName, region: L.regionName })}. Elets shares the buyer&apos;s identity and contact details once an introduction is made.
                  </p>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <span className="grid size-8 place-items-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">{rm.initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{rm.name}</p>
                  <p className="truncate text-xs text-ink-3">Elets relationship manager</p>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => setAskOpen(true)} aria-label="Message relationship manager">
                  <MessageSquare />
                </Button>
              </div>
            </CardContent>
          </Card>

          {myMeetings.length > 0 && (
            <Card>
              <CardHeader icon={<CalendarDays />} title="Meetings" />
              <CardContent className="space-y-2">
                {myMeetings.map((x) => (
                  <div key={x.id} className="rounded-xl border border-line p-3">
                    <p className="text-[13px] font-medium text-ink">{x.title}</p>
                    <p className="text-xs text-ink-3">
                      {formatDateTime(x.at)} · {x.location}
                    </p>
                    <Badge tone={x.status === "scheduled" ? "blue" : x.status === "requested" ? "amber" : "neutral"} className="mt-1.5 capitalize">
                      {x.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={!!respond}
        onOpenChange={(v) => !v && setRespond(null)}
        title={respond === "interested" ? "Express interest" : "Mark as not a fit"}
        description={
          respond === "interested"
            ? "Your relationship manager will see your interest and may propose an introduction to the buyer."
            : "Optional: tell Elets why — e.g. capacity, region or scope — so future matches improve."
        }
        icon={respond === "interested" ? <ThumbsUp /> : <ThumbsDown />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRespond(null)}>
              Cancel
            </Button>
            <Button onClick={submitResponse}>{respond === "interested" ? "Send interest" : "Confirm"}</Button>
          </>
        }
      >
        <Field label="Note to Elets" optional hint="Sent as a message to your relationship manager">
          <Textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={respond === "interested" ? "e.g. We have a comparable implementation and an on-ground team in the region." : "e.g. Delivery capacity is committed until Q2."}
          />
        </Field>
      </Modal>

      <Modal
        open={askOpen}
        onOpenChange={setAskOpen}
        title="Ask Elets a question"
        description={`Your question goes to ${rm.name}. Elets relays clarifications to the buyer where needed.`}
        icon={<CircleHelp />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAskOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!question.trim()) return setQErr("Write your question");
                const tid = createThread({ subject: `Question — ${r.code}`, participants: [user.id, rmId], context: { kind: "requirement", id: r.id } }, user.id, question.trim());
                setAskOpen(false);
                setQuestion("");
                setQErr("");
                toast.success("Question sent", {
                  description: `${rm.name} will reply in Messages.`,
                  action: { label: "Open", onClick: () => router.push(`/provider/messages?thread=${tid}`) },
                });
              }}
            >
              Send question
            </Button>
          </>
        }
      >
        <Field label="Your question" error={qErr}>
          <Textarea rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} invalid={!!qErr} placeholder="e.g. Is the buyer open to a phased rollout starting with two sites?" />
        </Field>
      </Modal>
    </div>
  );
}
