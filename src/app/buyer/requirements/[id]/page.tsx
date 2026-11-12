"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Download,
  FileText,
  GitCompareArrows,
  Handshake,
  Mail,
  MessagesSquare,
  Phone,
  Send,
  Sparkles,
  Star,
  Target,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { scoreMatch, toMatchable } from "@/lib/matching";
import type { Match, MatchResult, Provider } from "@/lib/types";
import { PRO_MODULES } from "@/lib/types";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE } from "@/lib/labels";
import { BUDGET_LABELS, DEPLOYMENT_LABELS, SCALE_LABELS, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { person } from "@/lib/people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/controls";
import { Field, Textarea } from "@/components/ui/input";
import { Modal, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { Avatar, EmptyState, PageSkeleton, ProviderLogo, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { IntegrityNote, MatchExplanation, StageBadge, StageHistory, StageTracker } from "@/components/shared/domain";
import { ScheduleMeetingModal } from "@/components/buyer/schedule-meeting";
import { defaultContactId, teamMember } from "@/lib/team";

export default function Page() {
  return (
    <React.Suspense fallback={<PageSkeleton />}>
      <RequirementDetail />
    </React.Suspense>
  );
}

function RequirementDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const user = useUser();
  const L = useLookups();
  const req = useStore((s) => s.requirements.find((r) => r.id === id && r.buyerId === user.orgId));
  const matches = useStore((s) => s.matches);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const engagements = useStore((s) => s.engagements);
  const proRequests = useStore((s) => s.proRequests);
  const [tab, setTab] = React.useState(params.get("tab") ?? "overview");
  const [proOpen, setProOpen] = React.useState(false);
  const [meetOpen, setMeetOpen] = React.useState(false);
  const [meetProvider, setMeetProvider] = React.useState<string | undefined>();

  const visible = React.useMemo(() => {
    if (!req) return [];
    return matches
      .filter((m) => m.requirementId === req.id && m.status !== "suggested" && m.status !== "rejected")
      .map((m) => {
        const p = providers.find((x) => x.id === m.providerId);
        return p ? { m, p, res: scoreMatch(req, toMatchable(p), categories) } : null;
      })
      .filter((x): x is { m: Match; p: Provider; res: MatchResult } => !!x)
      .sort((a, b) => b.res.score - a.res.score);
  }, [req, matches, providers, categories]);

  if (!req) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardList />}
          title="Requirement not found"
          description="It may have been removed, or it belongs to another organisation."
          action={<Button asChild variant="secondary"><Link href="/buyer/requirements">Back to requirements</Link></Button>}
        />
      </Card>
    );
  }

  const pending = matches.filter((m) => m.requirementId === req.id && m.status === "suggested").length;
  const eng = engagements.find((e) => e.requirementId === req.id);
  const proPending = proRequests.some((r) => r.requirementId === req.id && r.status !== "converted");
  const rm = req.assignedTo ? teamMember(req.assignedTo) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/buyer/requirements" className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
          <ChevronLeft className="size-4" /> All requirements
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <DynIcon name={L.category(req.categoryId)?.icon ?? "Layers"} className="size-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-ink-3">{req.code}</span>
                <StageBadge stage={req.stage} />
                {req.priority === "high" && <Badge tone="red">High priority</Badge>}
              </div>
              <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-ink text-balance sm:text-2xl">{req.title}</h1>
              <p className="mt-1 text-[13px] text-ink-3">
                {L.industryName(req.industryId)} · {L.categoryName(req.categoryId)} · Submitted {formatDate(req.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { setMeetProvider(undefined); setMeetOpen(true); }}>
              <CalendarDays /> Schedule meeting
            </Button>
            {eng ? (
              <Button variant="navy" asChild>
                <Link href={`/buyer/pro/${eng.id}`}>
                  <Sparkles /> Open Pro workspace
                </Link>
              </Button>
            ) : req.proRequested || proPending ? (
              <Tooltip content="Your Elets relationship manager will contact you to scope the engagement.">
                <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent-50 px-3 text-[13px] font-medium text-accent-700 ring-1 ring-inset ring-accent-100">
                  <Sparkles className="size-4" /> Elets Pro requested
                </span>
              </Tooltip>
            ) : (
              <Button variant="navy" onClick={() => setProOpen(true)}>
                <Sparkles /> Request Elets Pro
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="px-5 py-5">
        <StageTracker requirement={req} />
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches" count={visible.length}>Matched providers</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <Card>
                <CardHeader title="Business requirement" icon={<FileText />} />
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{req.problem}</p>
                  {req.objectives.length > 0 && (
                    <>
                      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Objectives</p>
                      <ul className="space-y-2">
                        {req.objectives.map((o) => (
                          <li key={o} className="flex items-start gap-2.5 text-[13px] text-ink-2">
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                              <Check className="size-2.5" strokeWidth={3} />
                            </span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {req.capabilities.length > 0 && (
                    <>
                      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Capabilities needed</p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.capabilities.map((c) => (
                          <Badge key={c} tone="blue">{c}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                  {req.additionalNotes && (
                    <div className="mt-5 rounded-xl bg-subtle p-3.5 text-[13px] text-ink-2 ring-1 ring-inset ring-line">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Additional notes</p>
                      {req.additionalNotes}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Scope & constraints" icon={<Workflow />} />
                <CardContent>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    {[
                      ["Budget range", BUDGET_LABELS[req.budget]],
                      ["Timeline", TIMELINE_LABELS[req.timeline]],
                      ["Scale", SCALE_LABELS[req.scale]],
                      ["Location", req.location || "—"],
                      ["Delivery regions", req.regions.length ? req.regions.map(L.regionName).join(", ") : "Any"],
                      ["Deployment", req.deployment.length ? req.deployment.map((d) => DEPLOYMENT_LABELS[d]).join(", ") : "Open"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-ink-3">{k}</dt>
                        <dd className="mt-0.5 text-[13px] font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-ink-3">Compliance required</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {req.compliance.length ? req.compliance.map((c) => <Badge key={c} tone="green">{c}</Badge>) : <span className="text-[13px] text-ink-4">None specified</span>}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Attachments" description="Documents shared with the Elets team" icon={<FileText />} />
                <CardContent>
                  {req.attachments.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-3">No documents attached.</p>
                  ) : (
                    <ul className="space-y-2">
                      {req.attachments.map((a) => (
                        <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
                          <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-ink">{a.name}</span>
                            <span className="text-xs text-ink-3">{a.size} · {formatDate(a.uploadedAt)}</span>
                          </span>
                          <Button variant="ghost" size="icon-sm" onClick={() => toast.info("Downloads are simulated in this demo")} aria-label={`Download ${a.name}`}>
                            <Download />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader title="Your Elets contact" icon={<Handshake />} />
                <CardContent>
                  {rm ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar initials={rm.initials} size="lg" />
                        <div>
                          <p className="text-sm font-semibold text-ink">{rm.name}</p>
                          <p className="text-xs text-ink-3">{rm.title}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-[13px] text-ink-2">
                        <p className="flex items-center gap-2"><Mail className="size-4 text-ink-4" /> {rm.email}</p>
                        <p className="flex items-center gap-2"><Phone className="size-4 text-ink-4" /> {rm.phone}</p>
                      </div>
                      <Button variant="secondary" className="mt-4 w-full" onClick={() => setTab("messages")}>
                        <MessagesSquare /> Message {rm.name.split(" ")[0]}
                      </Button>
                    </>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-ink-3">A relationship manager will be assigned once Elets reviews your requirement.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">Matching status</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{visible.length}</p>
                <p className="text-xs text-ink-3">providers recommended{pending > 0 && ` · ${pending} under Elets review`}</p>
                <Button size="sm" className="mt-4 w-full" onClick={() => setTab("matches")} disabled={!visible.length}>
                  View matches <ArrowRight />
                </Button>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-5 space-y-4">
          <IntegrityNote />
          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Target />}
                title={req.stage === "submitted" || req.stage === "under_review" ? "Elets is reviewing your requirement" : "Elets is reviewing matches"}
                description={
                  pending > 0
                    ? `${pending} potential providers have been identified and are being reviewed by your relationship manager before they are shared.`
                    : "Matched providers appear here after the Elets team reviews them for relevance and eligibility."
                }
              />
            </Card>
          ) : (
            visible.map(({ m, p, res }, i) => <MatchRow key={m.id} match={m} provider={p} result={res} rank={i + 1} onMeet={() => { setMeetProvider(p.id); setMeetOpen(true); }} />)
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-5">
          <Card>
            <CardHeader title="Status history" description="Every stage change is recorded with who made it." icon={<ClipboardList />} />
            <CardContent className="pl-8">
              <StageHistory requirement={req} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-5">
          <RequirementMessages requirementId={req.id} code={req.code} rmId={req.assignedTo} />
        </TabsContent>
      </Tabs>

      <ProRequestModal open={proOpen} onOpenChange={setProOpen} requirementId={req.id} buyerId={user.orgId!} />
      <ScheduleMeetingModal open={meetOpen} onOpenChange={setMeetOpen} requirementId={req.id} providerId={meetProvider} />
    </div>
  );
}

function MatchRow({ match, provider, result, rank, onMeet }: { match: Match; provider: Provider; result: MatchResult; rank: number; onMeet: () => void }) {
  const [open, setOpen] = React.useState(rank === 1);
  const shortlist = useStore((s) => s.shortlistMatch);
  const requestIntro = useStore((s) => s.requestIntroduction);
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const L = useLookups();
  const inCompare = compare.includes(provider.id);
  const canShortlist = match.status === "approved" || match.status === "shortlisted";
  const canIntro = match.status === "approved" || match.status === "shortlisted";

  return (
    <Card className={cn("overflow-hidden transition", match.status === "shortlisted" && "ring-2 ring-violet-200")}>
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="hidden w-5 text-center text-xs font-semibold text-ink-4 sm:block">#{rank}</span>
          <ProviderLogo provider={provider} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/buyer/providers/${provider.slug}`} className="truncate text-[15px] font-semibold tracking-tight text-ink hover:text-brand-700">
                {provider.name}
              </Link>
              <VerificationBadge status={provider.verification} compact />
              <Badge tone={MATCH_STATUS_TONE[match.status]} dot>{MATCH_STATUS_LABEL[match.status]}</Badge>
            </div>
            <p className="mt-0.5 truncate text-[13px] text-ink-3">{provider.tagline}</p>
            <p className="mt-1 text-xs text-ink-4">
              {provider.hq} · {provider.categories.map(L.categoryName).slice(0, 2).join(", ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ScoreRing score={result.score} size={60} />
          <div className="w-32">
            <p className="text-[13px] font-semibold text-ink">{result.score}% Match</p>
            <p className="text-xs text-ink-3">{result.label}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pb-4">
        {result.reasons.slice(0, 3).map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <Check className="size-3.5 text-accent-600" /> {r}
          </span>
        ))}
      </div>
      {open && (
        <div className="border-t border-line bg-subtle/40 px-5 py-5 animate-fade-in">
          <MatchExplanation result={result} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)}>
          <ChevronDown className={cn("transition", open && "rotate-180")} /> {open ? "Hide" : "Why this match"}
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const ok = toggleCompare(provider.id);
              if (!ok) toast.error("You can compare up to 4 providers");
              else toast.success(inCompare ? "Removed from comparison" : "Added to comparison");
            }}
          >
            <GitCompareArrows /> {inCompare ? "Comparing" : "Compare"}
          </Button>
          {canShortlist && (
            <Button
              variant={match.status === "shortlisted" ? "subtle" : "secondary"}
              size="sm"
              onClick={() => {
                shortlist(match.id, match.status !== "shortlisted");
                toast.success(match.status === "shortlisted" ? "Removed from shortlist" : "Added to shortlist", { description: provider.name });
              }}
            >
              <Star className={cn(match.status === "shortlisted" && "fill-current")} /> {match.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
            </Button>
          )}
          {canIntro ? (
            <Button
              size="sm"
              onClick={() => {
                requestIntro(match.id);
                toast.success("Introduction requested", { description: `Elets will introduce you to ${provider.name}.` });
              }}
            >
              <Handshake /> Request introduction
            </Button>
          ) : match.status === "introduced" ? (
            <Button size="sm" variant="secondary" onClick={onMeet}>
              <CalendarDays /> Schedule meeting
            </Button>
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent-50 px-3 text-xs font-medium text-accent-700">
              <Handshake className="size-3.5" /> Introduction requested
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function ProRequestModal({ open, onOpenChange, requirementId, buyerId }: { open: boolean; onOpenChange: (v: boolean) => void; requirementId: string; buyerId: string }) {
  const requestPro = useStore((s) => s.requestPro);
  const [services, setServices] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setServices([PRO_MODULES[0].name, PRO_MODULES[2].name, PRO_MODULES[3].name]);
      setNote("");
    }
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      icon={<Sparkles />}
      title="Request Elets Pro assistance"
      description="Elets Pro is a managed service: a relationship manager works with your team through procurement and vendor selection. Choose where you need support."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="navy"
            disabled={!services.length}
            onClick={() => {
              requestPro({ buyerId, requirementId, services, note: note.trim() });
              onOpenChange(false);
              toast.success("Elets Pro requested", { description: "Your relationship manager will contact you to scope the engagement." });
            }}
          >
            <Sparkles /> Send request
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-2">Services needed</p>
          <div className="flex flex-wrap gap-2">
            {PRO_MODULES.map((m) => (
              <Chip key={m.key} selected={services.includes(m.name)} onClick={() => setServices((s) => (s.includes(m.name) ? s.filter((x) => x !== m.name) : [...s, m.name]))}>
                {m.name}
              </Chip>
            ))}
          </div>
        </div>
        <Field label="Anything we should know?" optional>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. We need to issue a tender by March and need help with evaluation criteria." />
        </Field>
        <Link href="/pro" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          How Elets Pro works <ArrowRight className="size-3" />
        </Link>
      </div>
    </Modal>
  );
}

function RequirementMessages({ requirementId, code, rmId }: { requirementId: string; code: string; rmId: string | null }) {
  const user = useUser();
  const router = useRouter();
  const threads = useStore((s) => s.threads).filter((t) => t.context.kind === "requirement" && t.context.id === requirementId && t.participants.includes(user.id));
  const send = useStore((s) => s.sendMessage);
  const createThread = useStore((s) => s.createThread);
  const [text, setText] = React.useState("");
  const thread = threads[0];
  const to = rmId ?? defaultContactId();

  const submit = () => {
    if (!text.trim()) return;
    if (thread) send(thread.id, user.id, text.trim());
    else createThread({ subject: `${code} — question`, participants: [user.id, to], context: { kind: "requirement", id: requirementId } }, user.id, text.trim());
    setText("");
    toast.success("Message sent", { description: `To ${person(to).name}` });
  };

  return (
    <Card>
      <CardHeader
        title={thread ? thread.subject : "Conversation with Elets"}
        description={`Messages about ${code} with ${person(to).name}`}
        icon={<MessagesSquare />}
        action={
          thread && (
            <Button variant="secondary" size="sm" onClick={() => router.push(`/buyer/messages?thread=${thread.id}`)}>
              Open in inbox
            </Button>
          )
        }
      />
      <CardContent>
        {thread ? (
          <div className="space-y-4">
            {thread.messages.map((m) => {
              const me = m.authorId === user.id;
              return (
                <div key={m.id} className={cn("flex gap-2.5", me && "flex-row-reverse")}>
                  <Avatar initials={person(m.authorId).initials} size="sm" />
                  <div className={cn("max-w-[80%]", me && "text-right")}>
                    <p className="mb-1 text-[11px] text-ink-4">
                      {me ? "You" : person(m.authorId).name} · {formatDateTime(m.at)}
                    </p>
                    <div className={cn("inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed", me ? "rounded-tr-md bg-brand-600 text-white" : "rounded-tl-md border border-line bg-subtle text-ink-2")}>{m.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState compact icon={<MessagesSquare />} title="No messages yet" description="Ask a question about this requirement — it goes straight to your Elets contact." />
        )}
        <div className="mt-5 flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="min-h-0"
            placeholder="Write a message…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button onClick={submit} disabled={!text.trim()}>
            <Send /> Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
