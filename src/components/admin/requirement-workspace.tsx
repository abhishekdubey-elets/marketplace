"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  FileText,
  Handshake,
  ListOrdered,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  StickyNote,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups, useRankedProviders } from "@/lib/hooks";
import { person } from "@/lib/people";
import { MATCH_DIMENSIONS, REQUIREMENT_STAGES, type Match, type Requirement, type RequirementStage } from "@/lib/types";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE, STAGE_LABEL } from "@/lib/labels";
import { DIMENSION_META, isMatchEligible, scoreMatch, toMatchable } from "@/lib/matching";
import { BUDGET_LABELS, COMPLIANCE_OPTIONS, DEPLOYMENT_LABELS, SCALE_LABELS, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { cn, formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, EmptyState, OrgAvatar, PageHeader, ProviderLogo, ScoreRing, SectionLabel, VerificationBadge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chip, Segmented } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { IntegrityNote, MatchExplanation, StageBadge, StageHistory, StageTracker } from "@/components/shared/domain";
import { useTeamOptions } from "./common";
import { PLAN_LABEL, isPremium, planOf } from "@/lib/plans";

export function RequirementWorkspace() {
  const teamOptions = useTeamOptions();
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const L = useLookups();
  const req = useStore((s) => s.requirements.find((r) => r.id === id));
  const engagement = useStore((s) => s.engagements.find((e) => e.requirementId === id));
  const setStage = useStore((s) => s.setRequirementStage);
  const updateRequirement = useStore((s) => s.updateRequirement);

  if (!req)
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="Requirement not found"
        action={
          <Button variant="secondary" asChild>
            <Link href="/admin/requirements">Back to requirements</Link>
          </Button>
        }
      />
    );

  const buyer = L.buyer(req.buyerId);

  return (
    <div>
      <Link href="/admin/requirements" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> All requirements
      </Link>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-3">{req.code}</span>
            <StageBadge stage={req.stage} />
            {req.proRequested && <Badge tone="navy"><Sparkles /> Pro requested</Badge>}
            <Tooltip content={isPremium(buyer) ? "Premium buyer: the Elets team runs and reviews matching." : "Free buyer: matching runs automatically and matches are shared without review. Introductions and meetings need Premium."}>
              <span><Badge tone={isPremium(buyer) ? "violet" : "neutral"}>{PLAN_LABEL[planOf(buyer)]} plan</Badge></span>
            </Tooltip>
          </div>
        }
        title={req.title}
        description={`${buyer?.name} · ${L.categoryName(req.categoryId)} · submitted ${formatDate(req.createdAt)}`}
        actions={
          <Button variant="secondary" asChild>
            <Link href="/admin/messages">
              <MessageSquare /> Message buyer
            </Link>
          </Button>
        }
      />

      <StageControl req={req} onChange={(s, note) => {
        setStage(req.id, s, user.id, note || undefined);
        toast.success("Status updated", { description: `${req.code} → ${STAGE_LABEL[s]}. The buyer has been notified.` });
      }} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs defaultValue="matching">
            <TabsList className="mb-5">
              <TabsTrigger value="matching">
                <Workflow /> Matching console
              </TabsTrigger>
              <TabsTrigger value="brief">
                <FileText /> Structure requirement
              </TabsTrigger>
              <TabsTrigger value="notes" count={req.internalNotes.length}>
                <StickyNote /> Notes & history
              </TabsTrigger>
            </TabsList>
            <TabsContent value="matching">
              <MatchingConsole req={req} />
            </TabsContent>
            <TabsContent value="brief">
              <StructureForm req={req} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesPanel req={req} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Assignment" />
            <CardContent className="space-y-4">
              <Field label="Relationship manager">
                <Select
                  value={req.assignedTo ?? undefined}
                  placeholder="Unassigned"
                  onValueChange={(v) => {
                    updateRequirement(req.id, { assignedTo: v }, user.id, `Assigned to ${person(v).name}`);
                    toast.success("Relationship manager assigned");
                  }}
                  options={teamOptions}
                />
              </Field>
              <Field label="Priority">
                <Segmented
                  value={req.priority}
                  onChange={(v) => {
                    updateRequirement(req.id, { priority: v }, user.id, `Priority set to ${v}`);
                    toast.success("Priority updated");
                  }}
                  options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                  ]}
                />
              </Field>
            </CardContent>
          </Card>

          {buyer && (
            <Card>
              <CardHeader title="Buyer organisation" icon={<Building2 />} />
              <CardContent>
                <div className="flex items-center gap-3">
                  <OrgAvatar initials={buyer.initials} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{buyer.name}</p>
                    <p className="text-xs text-ink-3">{buyer.type}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-[13px]">
                  <Row label="Contact" value={buyer.contactName} />
                  <Row label="Email" value={buyer.contactEmail} />
                  <Row label="Location" value={[buyer.city, buyer.state].filter(Boolean).join(", ") || "—"} />
                  <Row label="Sector" value={L.industryName(buyer.industryId)} />
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Requirement summary" />
            <CardContent>
              <dl className="space-y-2 text-[13px]">
                <Row label="Budget" value={BUDGET_LABELS[req.budget]} />
                <Row label="Timeline" value={TIMELINE_LABELS[req.timeline]} />
                <Row label="Scale" value={SCALE_LABELS[req.scale]} />
                <Row label="Location" value={req.location} />
                <Row label="Deployment" value={req.deployment.map((d) => DEPLOYMENT_LABELS[d]).join(", ")} />
                <Row label="Industry" value={L.industryName(req.industryId)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Attachments" icon={<Paperclip />} />
            <CardContent>
              {req.attachments.length === 0 ? (
                <p className="text-[13px] text-ink-3">No documents attached.</p>
              ) : (
                <ul className="space-y-2">
                  {req.attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
                      <FileText className="size-4 text-ink-4" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-ink">{a.name}</p>
                        <p className="text-[11px] text-ink-4">{a.size}</p>
                      </div>
                      <Button size="icon-xs" variant="ghost" aria-label={`Download ${a.name}`} onClick={() => toast.info("File storage is simulated in this demo", { description: a.name })}>
                        <Download />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className={cn(req.proRequested && "border-transparent bg-navy-900 text-white")}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-2">
                <Sparkles className={cn("size-4", req.proRequested ? "text-flame-300" : "text-flame-600")} />
                <p className={cn("text-sm font-semibold", req.proRequested ? "text-white" : "text-ink")}>Elets Pro</p>
              </div>
              {engagement ? (
                <>
                  <p className="mt-1.5 text-xs text-navy-200">Managed engagement {engagement.code} is running for this requirement.</p>
                  <Button size="sm" variant="white" className="mt-3" asChild>
                    <Link href={`/admin/pro/${engagement.id}`}>Open workspace</Link>
                  </Button>
                </>
              ) : req.proRequested ? (
                <>
                  <p className="mt-1.5 text-xs text-navy-200">The buyer requested managed support. Create a Pro engagement to assign a relationship manager and structured workflow.</p>
                  <Button size="sm" variant="white" className="mt-3" asChild>
                    <Link href={`/admin/pro?create=${req.id}`}>Create engagement</Link>
                  </Button>
                </>
              ) : (
                <p className="mt-1.5 text-xs text-ink-3">Not requested by the buyer. You can still propose Elets Pro support from the Pro module.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="text-right text-ink-2">{value}</dd>
    </div>
  );
}

// ------------------------------------------------------------------ stage control

function StageControl({ req, onChange }: { req: Requirement; onChange: (s: RequirementStage, note: string) => void }) {
  const [stage, setStage] = React.useState<RequirementStage>(req.stage);
  const [note, setNote] = React.useState("");
  React.useEffect(() => setStage(req.stage), [req.stage]);
  return (
    <Card>
      <CardContent className="pt-5">
        <StageTracker requirement={req} />
        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 md:flex-row md:items-center">
          <span className="text-[13px] font-medium text-ink-2 md:w-28">Change status</span>
          <div className="md:w-56">
            <Select value={stage} onValueChange={(v) => setStage(v as RequirementStage)} options={REQUIREMENT_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))} />
          </div>
          <div className="flex-1">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the buyer (optional)" />
          </div>
          <Button
            disabled={stage === req.stage}
            onClick={() => {
              onChange(stage, note.trim());
              setNote("");
            }}
          >
            Update status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ matching console

function MatchingConsole({ req }: { req: Requirement }) {
  const user = useUser();
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const allMatches = useStore((s) => s.matches);
  const runMatching = useStore((s) => s.runMatching);
  const reviewMatch = useStore((s) => s.reviewMatch);
  const makeIntro = useStore((s) => s.makeIntroduction);
  const addMatch = useStore((s) => s.addMatch);
  const ranked = useRankedProviders(req.id);
  const [running, setRunning] = React.useState(false);
  const [manual, setManual] = React.useState<string | undefined>();
  const [showRejected, setShowRejected] = React.useState(false);

  const matches = allMatches.filter((m) => m.requirementId === req.id);
  const scored = matches
    .map((m) => {
      const p = providers.find((x) => x.id === m.providerId)!;
      return { m, p, res: scoreMatch(req, toMatchable(p), categories) };
    })
    .filter((x) => x.p)
    .sort((a, b) => b.res.score - a.res.score);
  const visible = scored.filter((x) => showRejected || x.m.status !== "rejected");
  const rejectedCount = scored.filter((x) => x.m.status === "rejected").length;
  const inList = new Set(matches.map((m) => m.providerId));
  const addable = providers.filter((p) => !inList.has(p.id) && p.accountStatus === "active");

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const n = runMatching(req.id, user.id, Math.max(5, matches.length + 3));
      setRunning(false);
      if (n) toast.success(`Matching engine suggested ${n} provider${n > 1 ? "s" : ""}`, { description: "Review each suggestion before it is shown to the buyer." });
      else toast.info("No new providers to suggest", { description: "All top-ranked eligible providers are already in the list." });
    }, 700);
  };

  return (
    <div className="space-y-5">
      <IntegrityNote />
      <Card>
        <CardHeader
          title="Matched providers"
          description="Suggestions require Elets review before buyers see them. Introductions are made only after approval."
          action={
            <Button onClick={run} loading={running}>
              <Workflow /> Run matching engine
            </Button>
          }
        />
        <div className="flex flex-col gap-2 border-y border-line bg-subtle/60 px-5 py-3 sm:flex-row sm:items-center">
          <span className="text-xs font-medium text-ink-3">Add provider manually</span>
          <div className="flex flex-1 gap-2">
            <Select key={manual ?? "none"} value={manual} onValueChange={setManual} placeholder="Choose a provider…" size="sm" options={addable.map((p) => ({ value: p.id, label: `${p.name}${isMatchEligible(p) ? "" : " (not eligible)"}` }))} />
            <Button
              size="sm"
              variant="secondary"
              disabled={!manual}
              onClick={() => {
                const p = providers.find((x) => x.id === manual);
                if (!p) return;
                if (!isMatchEligible(p)) return toast.error("Provider is not eligible for matching", { description: "Enable matching eligibility on the provider first." });
                addMatch(req.id, p.id, user.id);
                setManual(undefined);
                toast.success("Provider added for review", { description: p.name });
              }}
            >
              <Plus /> Add
            </Button>
          </div>
          {rejectedCount > 0 && (
            <button className="text-xs font-medium text-ink-3 hover:text-ink" onClick={() => setShowRejected(!showRejected)}>
              {showRejected ? "Hide" : "Show"} removed ({rejectedCount})
            </button>
          )}
        </div>
        <div className="divide-y divide-line">
          {visible.length === 0 && (
            <EmptyState
              icon={<Workflow />}
              title="No matches yet"
              description="Run the matching engine to score every eligible provider across eight dimensions."
              action={
                <Button onClick={run} loading={running}>
                  <Workflow /> Run matching engine
                </Button>
              }
            />
          )}
          {visible.map(({ m, p, res }) => (
            <MatchRow
              key={m.id}
              match={m}
              name={p.name}
              provider={p}
              res={res}
              onApprove={() => {
                reviewMatch(m.id, "approved", user.id);
                toast.success("Match approved", { description: `${p.name} is now visible to the buyer.` });
              }}
              onRemove={() => {
                reviewMatch(m.id, "rejected", user.id);
                toast.success("Match removed", { description: p.name });
              }}
              onIntro={() => {
                makeIntro(m.id, user.id);
                toast.success("Introduction made", { description: `${p.name} and the buyer have been connected. An opportunity was created.` });
              }}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Full ranked list"
          description={`All ${ranked.length} eligible providers scored by the engine — shows why the top providers were selected.`}
          icon={<ListOrdered />}
        />
        <div className="scrollbar-thin overflow-x-auto border-t border-line">
          <table className="w-full min-w-[860px] text-[12px]">
            <thead>
              <tr className="border-b border-line bg-subtle/80 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                <th className="px-4 py-2">#</th>
                <th className="px-2 py-2">Provider</th>
                <th className="px-2 py-2 text-right">Score</th>
                {MATCH_DIMENSIONS.map((d) => (
                  <th key={d} className="px-1.5 py-2 text-center">
                    <Tooltip content={`${DIMENSION_META[d].label} (weight ${DIMENSION_META[d].weight})`}>
                      <span className="cursor-help">{DIMENSION_META[d].label.split(" ")[0]}</span>
                    </Tooltip>
                  </th>
                ))}
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => {
                const p = providers.find((x) => x.id === r.providerId)!;
                const m = matches.find((x) => x.providerId === r.providerId);
                return (
                  <tr key={r.providerId} className="border-b border-line/60 last:border-0 hover:bg-subtle/60">
                    <td className="px-4 py-2 tabular-nums text-ink-4">{i + 1}</td>
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-2">
                        <ProviderLogo provider={p} size="sm" className="size-6 rounded-md text-[9px]" />
                        <span className="truncate font-medium text-ink">{p.name}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums text-ink">{r.score}</td>
                    {MATCH_DIMENSIONS.map((d) => (
                      <td key={d} className="px-1.5 py-2 text-center">
                        <span
                          className="inline-block w-9 rounded py-0.5 tabular-nums"
                          style={{ background: `rgb(33 73 232 / ${(r.dimensions[d] / 100) * 0.22})`, color: r.dimensions[d] >= 70 ? "#1c3ac4" : "#667085" }}
                        >
                          {r.dimensions[d]}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      {m ? (
                        <Badge tone={MATCH_STATUS_TONE[m.status]}>{MATCH_STATUS_LABEL[m.status]}</Badge>
                      ) : (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            addMatch(req.id, p.id, user.id);
                            toast.success("Added for review", { description: p.name });
                          }}
                        >
                          <Plus /> Add
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-ink-3">
          Listing packages are not inputs to the engine. Providers excluded from matching or suspended do not appear in this list.
        </p>
      </Card>
    </div>
  );
}

function MatchRow({
  match,
  provider,
  name,
  res,
  onApprove,
  onRemove,
  onIntro,
}: {
  match: Match;
  provider: ReturnType<typeof useStore.getState>["providers"][number];
  name: string;
  res: ReturnType<typeof scoreMatch>;
  onApprove: () => void;
  onRemove: () => void;
  onIntro: () => void;
}) {
  const [open, setOpen] = React.useState(match.status === "suggested");
  const canIntro = ["approved", "shortlisted", "intro_requested"].includes(match.status);
  return (
    <div className={cn("px-5 py-4", match.status === "rejected" && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-3">
        <ScoreRing score={res.score} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/providers/${provider.id}`} className="truncate text-sm font-semibold text-ink hover:text-brand-700">
              {name}
            </Link>
            <VerificationBadge status={provider.verification} compact />
          </div>
          <p className="mt-0.5 text-xs text-ink-3">
            {res.label} · {res.reasons[0] ?? "Scored by engine"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone={MATCH_STATUS_TONE[match.status]} dot>
              {MATCH_STATUS_LABEL[match.status]}
            </Badge>
            {match.providerInterest === "interested" && <Badge tone="teal">Provider interested</Badge>}
            {match.providerInterest === "declined" && <Badge tone="red">Provider declined</Badge>}
            {match.reviewedBy && <span className="text-[11px] text-ink-4">Reviewed by {person(match.reviewedBy).name}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {match.status === "suggested" && (
            <>
              <Button size="sm" onClick={onApprove}>
                <Check /> Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={onRemove}>
                <X /> Remove
              </Button>
            </>
          )}
          {match.status === "rejected" && (
            <Button size="sm" variant="secondary" onClick={onApprove}>
              <RotateCcw /> Restore
            </Button>
          )}
          {canIntro && (
            <Button size="sm" variant={match.status === "intro_requested" ? "primary" : "secondary"} onClick={onIntro}>
              <Handshake /> Make introduction
            </Button>
          )}
          {match.status === "introduced" && (
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin/opportunities">View opportunity</Link>
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" onClick={() => setOpen(!open)} aria-label={open ? "Hide explanation" : "Show explanation"} aria-expanded={open}>
            <ChevronDown className={cn("transition", open && "rotate-180")} />
          </Button>
        </div>
      </div>
      {open && (
        <div className="mt-4 rounded-xl border border-line bg-subtle/50 p-4 animate-fade-in">
          <MatchExplanation result={res} />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ structure form

function TagInput({ value, onChange, placeholder, suggestions }: { value: string[]; onChange: (v: string[]) => void; placeholder: string; suggestions?: string[] }) {
  const [draft, setDraft] = React.useState("");
  const add = (t: string) => {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  const listId = React.useId();
  return (
    <div className="rounded-lg border border-line bg-white p-2 shadow-xs focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-700">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="grid size-4 place-items-center rounded hover:bg-brand-100" aria-label={`Remove ${t}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            }
            if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          placeholder={placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-[13px] outline-none placeholder:text-ink-4"
        />
        {suggestions && (
          <datalist id={listId}>
            {suggestions.filter((s) => !value.includes(s)).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  );
}

function StructureForm({ req }: { req: Requirement }) {
  const user = useUser();
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const regions = useStore((s) => s.regions);
  const update = useStore((s) => s.updateRequirement);
  const init = React.useCallback(
    () => ({ title: req.title, problem: req.problem, categoryId: req.categoryId, capabilities: req.capabilities, compliance: req.compliance, scale: req.scale, regions: req.regions, budget: req.budget, timeline: req.timeline, objectives: req.objectives }),
    [req],
  );
  const [d, setD] = React.useState(init);
  React.useEffect(() => setD(init()), [init]);
  const dirty = JSON.stringify(d) !== JSON.stringify(init());
  const capSuggestions = Array.from(new Set(providers.flatMap((p) => p.capabilities))).sort();

  return (
    <Card>
      <CardHeader title="Structure requirement" description="Refine the buyer's submission into a structured brief. Capabilities, compliance, scale and regions feed directly into match scoring." />
      <CardContent className="space-y-5">
        <Field label="Title">
          <Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        </Field>
        <Field label="Problem statement">
          <Textarea value={d.problem} onChange={(e) => setD({ ...d, problem: e.target.value })} rows={4} />
        </Field>
        <Field label="Objectives" hint="Press Enter to add">
          <TagInput value={d.objectives} onChange={(v) => setD({ ...d, objectives: v })} placeholder="Add objective…" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Technology category">
            <Select value={d.categoryId} onValueChange={(v) => setD({ ...d, categoryId: v })} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="Project scale">
            <Select value={d.scale} onValueChange={(v) => setD({ ...d, scale: v as Requirement["scale"] })} options={Object.entries(SCALE_LABELS).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="Budget">
            <Select value={d.budget} onValueChange={(v) => setD({ ...d, budget: v as Requirement["budget"] })} options={Object.entries(BUDGET_LABELS).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="Timeline">
            <Select value={d.timeline} onValueChange={(v) => setD({ ...d, timeline: v as Requirement["timeline"] })} options={Object.entries(TIMELINE_LABELS).map(([value, label]) => ({ value, label }))} />
          </Field>
        </div>
        <Field label="Required capabilities" hint="Compared against provider capabilities for functional fit. Suggestions come from provider profiles.">
          <TagInput value={d.capabilities} onChange={(v) => setD({ ...d, capabilities: v })} placeholder="Add capability…" suggestions={capSuggestions} />
        </Field>
        <div>
          <SectionLabel className="mb-2">Compliance & certifications</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_OPTIONS.map((c) => (
              <Chip key={c} selected={d.compliance.includes(c)} onClick={() => setD({ ...d, compliance: d.compliance.includes(c) ? d.compliance.filter((x) => x !== c) : [...d.compliance, c] })}>
                {c}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <SectionLabel className="mb-2">Delivery regions</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {regions.filter((r) => r.active).map((r) => (
              <Chip key={r.id} selected={d.regions.includes(r.id)} onClick={() => setD({ ...d, regions: d.regions.includes(r.id) ? d.regions.filter((x) => x !== r.id) : [...d.regions, r.id] })}>
                {r.name}
              </Chip>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          {dirty && <span className="mr-auto text-xs text-amber-700">Unsaved changes</span>}
          <Button variant="secondary" disabled={!dirty} onClick={() => setD(init())}>
            Discard
          </Button>
          <Button
            disabled={!dirty || !d.title.trim()}
            onClick={() => {
              update(req.id, d, user.id, "Requirement structured: " + Object.keys(d).filter((k) => JSON.stringify(d[k as keyof typeof d]) !== JSON.stringify(init()[k as keyof typeof d])).join(", "));
              toast.success("Requirement updated", { description: "Match scores have been recalculated." });
            }}
          >
            <Save /> Save brief
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ notes

function NotesPanel({ req }: { req: Requirement }) {
  const user = useUser();
  const addNote = useStore((s) => s.addRequirementNote);
  const [text, setText] = React.useState("");
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <Card>
        <CardHeader title="Internal notes" description="Visible to the Elets team only" icon={<StickyNote />} />
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Add context for the team — calls, clarifications, constraints…" />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!text.trim()}
                onClick={() => {
                  addNote(req.id, user.id, text.trim());
                  setText("");
                  toast.success("Note added");
                }}
              >
                Add note
              </Button>
            </div>
          </div>
          {req.internalNotes.length === 0 ? (
            <EmptyState compact icon={<StickyNote />} title="No internal notes" description="Notes help the team hand over context between relationship managers." />
          ) : (
            <ul className="space-y-3">
              {[...req.internalNotes].reverse().map((n) => (
                <li key={n.id} className="flex gap-3">
                  <Avatar initials={person(n.authorId).initials} size="sm" />
                  <div className="min-w-0 flex-1 rounded-xl border border-line bg-subtle/50 px-3.5 py-2.5">
                    <p className="text-xs text-ink-3">
                      <span className="font-medium text-ink-2">{person(n.authorId).name}</span> · <span title={formatDateTime(n.at)}>{timeAgo(n.at)}</span>
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{n.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader title="Status history" />
        <CardContent>
          <StageHistory requirement={req} />
        </CardContent>
      </Card>
    </div>
  );
}
