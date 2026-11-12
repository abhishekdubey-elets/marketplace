"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Download, Eye, FileText, FolderOpen, ListChecks, Plus, Scale, ShieldCheck, Sparkles, Trash2, Trophy, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { useStore, uid } from "@/lib/store";
import type { EvaluationCriterion, ProDocument, ShortlistEntry } from "@/lib/types";
import { providerHref, useLookups } from "@/lib/hooks";
import { rankProviders, scoreMatch, toMatchable } from "@/lib/matching";
import { person } from "@/lib/people";
import type { Tone } from "@/lib/labels";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ProviderLogo, ScorePill, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal, Tooltip } from "@/components/ui/overlay";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/controls";
import { evaluationTotals } from "./shared";
import type { PanelProps } from "./panels-overview";

// ------------------------------------------------------------------ Shortlisted vendors

export const VENDOR_STATUS: Record<ShortlistEntry["status"], { label: string; tone: Tone }> = {
  longlist: { label: "Longlist", tone: "neutral" },
  shortlisted: { label: "Shortlisted", tone: "blue" },
  diligence: { label: "In due diligence", tone: "violet" },
  rfp_invited: { label: "RFP invited", tone: "teal" },
  proposal_received: { label: "Proposal received", tone: "amber" },
  recommended: { label: "Recommended", tone: "green" },
  dropped: { label: "Dropped", tone: "red" },
};

export const DILIGENCE: Record<ShortlistEntry["diligence"], { label: string; tone: Tone }> = {
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "blue" },
  cleared: { label: "Cleared", tone: "green" },
  flagged: { label: "Flagged", tone: "red" },
};

const PIPELINE: ShortlistEntry["status"][] = ["longlist", "shortlisted", "diligence", "rfp_invited", "proposal_received", "recommended"];

export function VendorsPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const L = useLookups();
  const req = e.requirementId ? L.requirement(e.requirementId) : undefined;
  const [open, setOpen] = React.useState(false);
  const role = mode === "admin" ? "admin" : "buyer";

  const setEntry = (pid: string, patch: Partial<ShortlistEntry>, label: string) => {
    update(e.id, (x) => ({ ...x, shortlist: x.shortlist.map((s) => (s.providerId === pid ? { ...s, ...patch } : s)) }), actorId, label);
    toast.success(label, { description: L.provider(pid)?.name });
  };

  const suggestions = React.useMemo(() => {
    if (!req) return [];
    const have = new Set(e.shortlist.map((s) => s.providerId));
    return rankProviders(req, providers, categories)
      .filter((m) => !have.has(m.providerId))
      .slice(0, 4);
  }, [req, providers, categories, e.shortlist]);

  const counts = PIPELINE.map((s) => ({ s, n: e.shortlist.filter((v) => v.status === s).length }));
  const active = e.shortlist.filter((v) => v.status !== "dropped");
  const dropped = e.shortlist.filter((v) => v.status === "dropped");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Shortlisted vendors</h3>
          <p className="text-[13px] text-ink-3">Vendors move from longlist through due diligence and RFP to a recommendation.</p>
        </div>
        {mode === "admin" && e.shortlist.length > 0 && (
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add vendor
          </Button>
        )}
      </div>

      {e.shortlist.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks />}
            title="No vendors on the list yet"
            description={
              mode === "admin"
                ? req
                  ? "Start from the matching engine's suggestions for the linked requirement, or add any marketplace provider."
                  : "Add marketplace providers to build the longlist."
                : "Elets will build a vendor longlist after the market scan. You'll see each vendor's progress here."
            }
            action={
              mode === "admin" && (
                <Button onClick={() => setOpen(true)}>
                  <Plus /> Build longlist
                </Button>
              )
            }
          />
          {mode === "admin" && suggestions.length > 0 && (
            <div className="border-t border-line px-5 py-4">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                <Sparkles className="size-3.5 text-flame-600" /> Suggested by the matching engine for {req?.code}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((m) => {
                  const p = L.provider(m.providerId)!;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        update(e.id, (x) => ({ ...x, shortlist: [...x.shortlist, { providerId: p.id, status: "longlist", diligence: "not_started", note: m.reasons[0] ?? "" }] }), actorId, "Added vendor to longlist");
                        toast.success("Added to longlist", { description: p.name });
                      }}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-raised"
                    >
                      <ProviderLogo provider={p} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                        <span className="block truncate text-xs text-ink-3">{m.label}</span>
                      </span>
                      <ScorePill score={m.score} />
                      <Plus className="size-4 text-ink-4 group-hover:text-brand-600" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="scrollbar-thin overflow-x-auto">
            <div className="flex min-w-[640px] gap-1.5">
              {counts.map(({ s, n }, i) => (
                <div key={s} className={cn("relative flex-1 rounded-xl border px-3 py-2.5", n ? "border-line bg-white shadow-xs" : "border-dashed border-line bg-subtle/50")}>
                  <p className="text-[11px] font-medium text-ink-3">
                    <span className="mr-1 text-ink-4">{i + 1}</span>
                    {VENDOR_STATUS[s].label}
                  </p>
                  <p className={cn("mt-0.5 text-lg font-semibold tabular-nums", n ? "text-ink" : "text-ink-4")}>{n}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {active.map((v) => {
              const p = L.provider(v.providerId);
              if (!p) return null;
              const match = req ? scoreMatch(req, toMatchable(p), categories) : null;
              return (
                <Card key={v.providerId} className={cn("p-4 transition", v.status === "recommended" && "border-accent-300 ring-4 ring-accent-50")}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <ProviderLogo provider={p} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={providerHref(role, p)} className="truncate text-sm font-semibold text-ink hover:text-brand-700">
                            {p.name}
                          </Link>
                          <VerificationBadge status={p.verification} compact />
                          {v.status === "recommended" && (
                            <Badge tone="green">
                              <Trophy /> Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-3">{p.tagline}</p>
                        {v.note && <p className="mt-2 rounded-lg bg-subtle px-2.5 py-1.5 text-xs leading-relaxed text-ink-2">{v.note}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      {match && (
                        <Tooltip content={`Matching engine: ${match.label}. Paid listings never influence this score.`}>
                          <span>
                            <ScoreRing score={match.score} size={44} stroke={4} />
                          </span>
                        </Tooltip>
                      )}
                      <div className="w-44 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-4">Status</p>
                        {mode === "admin" ? (
                          <Select
                            size="sm"
                            value={v.status}
                            ariaLabel="Vendor status"
                            onValueChange={(val) => setEntry(v.providerId, { status: val as ShortlistEntry["status"] }, `Vendor status: ${VENDOR_STATUS[val as ShortlistEntry["status"]].label}`)}
                            options={Object.entries(VENDOR_STATUS).map(([k, m]) => ({ value: k, label: m.label }))}
                          />
                        ) : (
                          <Badge tone={VENDOR_STATUS[v.status].tone} dot>
                            {VENDOR_STATUS[v.status].label}
                          </Badge>
                        )}
                      </div>
                      <div className="w-36 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-4">Due diligence</p>
                        {mode === "admin" ? (
                          <Select
                            size="sm"
                            value={v.diligence}
                            ariaLabel="Diligence status"
                            onValueChange={(val) => setEntry(v.providerId, { diligence: val as ShortlistEntry["diligence"] }, `Diligence: ${DILIGENCE[val as ShortlistEntry["diligence"]].label}`)}
                            options={Object.entries(DILIGENCE).map(([k, m]) => ({ value: k, label: m.label }))}
                          />
                        ) : (
                          <Badge tone={DILIGENCE[v.diligence].tone}>
                            <ShieldCheck /> {DILIGENCE[v.diligence].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {dropped.length > 0 && (
            <div className="rounded-2xl border border-dashed border-line p-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Dropped from consideration</p>
              <ul className="space-y-2">
                {dropped.map((v) => {
                  const p = L.provider(v.providerId);
                  if (!p) return null;
                  return (
                    <li key={v.providerId} className="flex items-center gap-3 text-[13px]">
                      <ProviderLogo provider={p} size="sm" className="opacity-60 grayscale" />
                      <span className="font-medium text-ink-3">{p.name}</span>
                      <span className="min-w-0 flex-1 truncate text-xs text-ink-4">{v.note}</span>
                      {mode === "admin" && (
                        <Button variant="ghost" size="xs" onClick={() => setEntry(v.providerId, { status: "longlist" }, "Restored vendor to longlist")}>
                          Restore
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      <AddVendorModal open={open} onOpenChange={setOpen} engagementId={e.id} existing={e.shortlist.map((s) => s.providerId)} requirementId={e.requirementId} actorId={actorId} />
    </div>
  );
}

function AddVendorModal({
  open,
  onOpenChange,
  engagementId,
  existing,
  requirementId,
  actorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  engagementId: string;
  existing: string[];
  requirementId: string | null;
  actorId: string;
}) {
  const update = useStore((s) => s.updateEngagement);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const L = useLookups();
  const req = requirementId ? L.requirement(requirementId) : undefined;
  const [pid, setPid] = React.useState("");
  const [status, setStatus] = React.useState<ShortlistEntry["status"]>("longlist");
  const [note, setNote] = React.useState("");
  const [err, setErr] = React.useState("");
  const available = providers.filter((p) => !existing.includes(p.id) && p.accountStatus === "active");
  const scored = React.useMemo(() => {
    const m = new Map<string, number>();
    if (req) available.forEach((p) => m.set(p.id, scoreMatch(req, toMatchable(p), categories).score));
    return m;
  }, [req, available, categories]);
  const sorted = [...available].sort((a, b) => (scored.get(b.id) ?? 0) - (scored.get(a.id) ?? 0) || a.name.localeCompare(b.name));

  React.useEffect(() => {
    if (open) {
      setPid("");
      setNote("");
      setStatus("longlist");
      setErr("");
    }
  }, [open]);

  const add = () => {
    if (!pid) return setErr("Choose a provider");
    update(engagementId, (x) => ({ ...x, shortlist: [...x.shortlist, { providerId: pid, status, diligence: "not_started", note: note.trim() }] }), actorId, "Added vendor to shortlist");
    toast.success("Vendor added", { description: L.provider(pid)?.name });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      icon={<ListChecks />}
      title="Add vendor"
      description={req ? `Providers are ordered by match score against ${req.code}. Listing packages do not affect this order.` : "Add a marketplace provider to this engagement."}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={add}>Add vendor</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Provider" error={err}>
          <Select
            value={pid}
            onValueChange={(v) => {
              setPid(v);
              setErr("");
            }}
            placeholder="Select a provider"
            options={sorted.map((p) => ({ value: p.id, label: scored.has(p.id) ? `${p.name} — ${scored.get(p.id)}% match` : p.name }))}
          />
        </Field>
        <Field label="Initial status">
          <Select value={status} onValueChange={(v) => setStatus(v as ShortlistEntry["status"])} options={PIPELINE.map((s) => ({ value: s, label: VENDOR_STATUS[s].label }))} />
        </Field>
        <Field label="Note" optional>
          <Textarea rows={3} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Why this vendor is being considered" />
        </Field>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ Documents

const DOC_CATEGORY: Record<ProDocument["category"], { label: string; tone: Tone }> = {
  brief: { label: "Brief & research", tone: "blue" },
  diligence: { label: "Due diligence", tone: "violet" },
  rfp: { label: "RFP & tender", tone: "teal" },
  evaluation: { label: "Evaluation", tone: "amber" },
  minutes: { label: "Minutes", tone: "neutral" },
  other: { label: "Other", tone: "neutral" },
};

export function DocumentsPanel({ engagement: e, mode, actorId }: PanelProps) {
  const update = useStore((s) => s.updateEngagement);
  const [filter, setFilter] = React.useState<"all" | ProDocument["category"]>("all");
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [cat, setCat] = React.useState<ProDocument["category"]>(mode === "admin" ? "diligence" : "brief");
  const [err, setErr] = React.useState("");
  const docs = [...e.documents].sort((a, b) => b.at.localeCompare(a.at)).filter((d) => filter === "all" || d.category === filter);
  const count = (c: ProDocument["category"]) => e.documents.filter((d) => d.category === c).length;

  const upload = () => {
    const n = name.trim();
    if (n.length < 3) return setErr("Enter a file name");
    const fileName = /\.[a-z0-9]{2,5}$/i.test(n) ? n : `${n}.pdf`;
    const size = `${(Math.round((0.2 + ((fileName.length * 37) % 40) / 10) * 10) / 10).toFixed(1)} MB`;
    const doc: ProDocument = { id: uid("doc"), name: fileName, category: cat, size, uploadedBy: actorId, at: new Date().toISOString().slice(0, 10) };
    update(e.id, (x) => ({ ...x, documents: [doc, ...x.documents] }), actorId, `Uploaded document: ${fileName}`);
    toast.success("Document added", { description: `${fileName} · simulated upload` });
    setOpen(false);
    setName("");
    setErr("");
  };

  return (
    <Card>
      <CardHeader
        icon={<FolderOpen />}
        title="Engagement documents"
        description="Requirement brief, due diligence evidence, RFP and tender documents, evaluation reports and minutes."
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Upload /> Upload
          </Button>
        }
      />
      <CardContent className="space-y-4">
        <div className="scrollbar-thin overflow-x-auto">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All (${e.documents.length})` },
              ...(["brief", "diligence", "rfp", "evaluation", "minutes"] as const).map((c) => ({ value: c, label: `${DOC_CATEGORY[c].label} (${count(c)})` })),
            ]}
          />
        </div>
        {docs.length === 0 ? (
          <EmptyState
            compact
            icon={<FileText />}
            title={filter === "all" ? "No documents yet" : `No ${DOC_CATEGORY[filter].label.toLowerCase()} documents`}
            description="Documents shared on this engagement are visible to the buyer and the Elets team."
            action={
              <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
                <Upload /> Upload document
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {docs.map((d) => {
              const ext = d.name.split(".").pop()?.toUpperCase() ?? "FILE";
              return (
                <li key={d.id} className="group flex items-center gap-3 bg-white px-4 py-3 transition hover:bg-subtle/60">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-[9px] font-bold", ext === "PDF" ? "bg-red-50 text-red-600" : ext === "XLSX" ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700")}>{ext}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-ink-3">
                      {d.size} · {person(d.uploadedBy).name} · {formatDate(d.at)}
                    </p>
                  </div>
                  <Badge tone={DOC_CATEGORY[d.category].tone} className="hidden sm:inline-flex">
                    {DOC_CATEGORY[d.category].label}
                  </Badge>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon-xs" aria-label="Preview" onClick={() => toast.info("Preview is simulated in this demo", { description: d.name })}>
                      <Eye />
                    </Button>
                    <Button variant="ghost" size="icon-xs" aria-label="Download" onClick={() => toast.info("Download is simulated in this demo", { description: d.name })}>
                      <Download />
                    </Button>
                    {mode === "admin" && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remove document"
                        onClick={() => {
                          update(e.id, (x) => ({ ...x, documents: x.documents.filter((y) => y.id !== d.id) }), actorId, `Removed document: ${d.name}`);
                          toast.success("Document removed");
                        }}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Modal
        open={open}
        onOpenChange={setOpen}
        icon={<Upload />}
        title="Upload document"
        description="Simulated upload — this demo records the document's details but does not store file contents."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={upload}>
              <Upload /> Add document
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid place-items-center rounded-xl border-2 border-dashed border-line bg-subtle/60 px-4 py-6 text-center">
            <Upload className="size-5 text-ink-4" />
            <p className="mt-2 text-[13px] font-medium text-ink-2">File storage connects to Supabase Storage in production</p>
            <p className="text-xs text-ink-3">For the demo, enter the document name below.</p>
          </div>
          <Field label="Document name" error={err}>
            <Input value={name} invalid={!!err} onChange={(ev) => setName(ev.target.value)} placeholder="e.g. Vendor reference checks.pdf" />
          </Field>
          <Field label="Category">
            <Select value={cat} onValueChange={(v) => setCat(v as ProDocument["category"])} options={Object.entries(DOC_CATEGORY).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Field>
        </div>
      </Modal>
    </Card>
  );
}

// ------------------------------------------------------------------ Evaluation matrix

export function EvaluationPanel({ engagement: e, mode, actorId }: PanelProps) {
  const setScore = useStore((s) => s.setScore);
  const update = useStore((s) => s.updateEngagement);
  const L = useLookups();
  const totals = evaluationTotals(e);
  const editable = mode === "admin";
  const [editWeights, setEditWeights] = React.useState(false);
  const [weights, setWeights] = React.useState<EvaluationCriterion[]>(e.criteria);
  const [newCriterion, setNewCriterion] = React.useState<{ name: string; group: EvaluationCriterion["group"] | null }>({ name: "", group: null });

  const vendorIds = Array.from(
    new Set([
      ...e.shortlist.filter((v) => !["dropped", "longlist"].includes(v.status)).map((v) => v.providerId),
      ...Object.keys(e.scores),
    ]),
  ).filter((id) => L.provider(id));
  const ranked = [...vendorIds].sort((a, b) => (totals[b]?.total ?? -1) - (totals[a]?.total ?? -1));
  const leader = ranked.find((id) => totals[id]?.scored);
  const groups: EvaluationCriterion["group"][] = ["technical", "commercial"];
  const weightSum = weights.reduce((s, c) => s + (Number.isFinite(c.weight) ? c.weight : 0), 0);

  const bestFor = (cid: string) => {
    const vals = vendorIds.map((v) => e.scores[v]?.[cid]).filter((x): x is number => typeof x === "number");
    return vals.length > 1 ? Math.max(...vals) : null;
  };

  const saveWeights = () => {
    if (weightSum !== 100) return toast.error("Weights must total 100", { description: `Currently ${weightSum}` });
    update(e.id, (x) => ({ ...x, criteria: weights.filter((c) => c.name.trim()) }), actorId, "Updated evaluation criteria");
    setEditWeights(false);
    toast.success("Evaluation criteria saved");
  };

  if (vendorIds.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Scale />}
          title="Evaluation not started"
          description={
            editable
              ? "Shortlist vendors and move them past the longlist to score their proposals against the weighted criteria."
              : "Once proposals are received, Elets will score them against agreed technical and commercial criteria and share the matrix here."
          }
        />
        <div className="border-t border-line px-5 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Agreed criteria ({e.criteria.length})</p>
          <div className="flex flex-wrap gap-2">
            {e.criteria.map((c) => (
              <span key={c.id} className="rounded-lg border border-line bg-subtle/60 px-2.5 py-1 text-xs text-ink-2">
                {c.name} <span className="ml-1 font-semibold text-ink">{c.weight}%</span>
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ranking strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ranked.map((pid, i) => {
          const p = L.provider(pid)!;
          const t = totals[pid];
          return (
            <Card key={pid} className={cn("relative p-4", pid === leader && "border-accent-300 ring-4 ring-accent-50")}>
              <div className="flex items-center gap-3">
                <ProviderLogo provider={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-3">{t ? `${t.scored}/${t.of} criteria scored` : "Not yet scored"}</p>
                </div>
                <span className={cn("grid size-7 place-items-center rounded-full text-xs font-bold", i === 0 && t?.scored ? "bg-accent-500 text-white" : "bg-navy-50 text-ink-3")}>#{i + 1}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
                  {t?.scored ? t.total : "—"}
                  <span className="text-sm text-ink-4">{t?.scored ? "/100" : ""}</span>
                </p>
                <div className="text-right text-[11px] text-ink-3">
                  <p>Technical {t?.technical ?? "—"}</p>
                  <p>Commercial {t?.commercial ?? "—"}</p>
                </div>
              </div>
              {t && t.coverage < 100 && t.scored > 0 && <p className="mt-2 text-[11px] font-medium text-amber-700">Provisional — {t.coverage}% of weight scored</p>}
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          icon={<Scale />}
          title="Evaluation matrix"
          description={editable ? "Score each criterion 0–10. Weighted totals update instantly." : "Scores recorded by the evaluation team. Weighted totals out of 100."}
          action={
            editable &&
            (editWeights ? (
              <>
                <span className={cn("text-xs font-semibold tabular-nums", weightSum === 100 ? "text-emerald-600" : "text-red-600")}>Total {weightSum}/100</span>
                <Button variant="secondary" size="sm" onClick={() => setEditWeights(false)}>
                  <X /> Cancel
                </Button>
                <Button size="sm" onClick={saveWeights}>
                  <Check /> Save weights
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setWeights(e.criteria);
                  setEditWeights(true);
                }}
              >
                Edit criteria & weights
              </Button>
            ))
          }
        />
        <div className="scrollbar-thin overflow-x-auto border-t border-line">
          <table className="w-full min-w-[720px] border-collapse text-[13px]">
            <thead>
              <tr className="bg-subtle/80">
                <th className="sticky left-0 z-10 w-[260px] bg-subtle px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-3">Criterion</th>
                <th className="w-20 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-3">Weight</th>
                {vendorIds.map((pid) => {
                  const p = L.provider(pid)!;
                  return (
                    <th key={pid} className="min-w-[140px] px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <ProviderLogo provider={p} size="sm" />
                        <span className="line-clamp-2 text-xs font-semibold leading-tight text-ink">{p.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const list = (editWeights ? weights : e.criteria).filter((c) => c.group === g);
                return (
                  <React.Fragment key={g}>
                    <tr className="border-y border-line bg-navy-50/50">
                      <td colSpan={2 + vendorIds.length} className="sticky left-0 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-navy-600">
                        {g === "technical" ? "Technical evaluation" : "Commercial evaluation"} · {list.reduce((s, c) => s + c.weight, 0)}%
                      </td>
                    </tr>
                    {list.map((c) => {
                      const best = bestFor(c.id);
                      return (
                        <tr key={c.id} className="border-b border-line/70">
                          <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-ink-2">
                            {editWeights ? (
                              <div className="flex items-center gap-1.5">
                                <Input value={c.name} onChange={(ev) => setWeights(weights.map((w) => (w.id === c.id ? { ...w, name: ev.target.value } : w)))} className="h-8" aria-label="Criterion name" />
                                <Button variant="ghost" size="icon-xs" aria-label="Remove criterion" onClick={() => setWeights(weights.filter((w) => w.id !== c.id))}>
                                  <Trash2 />
                                </Button>
                              </div>
                            ) : (
                              c.name
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-ink-3">
                            {editWeights ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={c.weight}
                                aria-label={`${c.name} weight`}
                                onChange={(ev) => setWeights(weights.map((w) => (w.id === c.id ? { ...w, weight: Math.max(0, Math.min(100, Number(ev.target.value) || 0)) } : w)))}
                                className="h-8 w-16 rounded-md border border-line px-2 text-right text-[13px] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                              />
                            ) : (
                              `${c.weight}%`
                            )}
                          </td>
                          {vendorIds.map((pid) => {
                            const v = e.scores[pid]?.[c.id];
                            const isBest = best !== null && v === best;
                            return (
                              <td key={pid} className="px-3 py-2 text-center">
                                {editable && !editWeights ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={v ?? ""}
                                    placeholder="–"
                                    aria-label={`${L.provider(pid)?.name} — ${c.name}`}
                                    onChange={(ev) => {
                                      if (ev.target.value === "") return;
                                      setScore(e.id, pid, c.id, Math.max(0, Math.min(10, Math.round(Number(ev.target.value)))));
                                    }}
                                    className={cn(
                                      "h-8 w-14 rounded-md border text-center text-[13px] font-semibold tabular-nums outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100",
                                      isBest ? "border-accent-300 bg-accent-50 text-accent-700" : "border-line bg-white text-ink",
                                    )}
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      "inline-grid h-8 w-12 place-items-center rounded-md text-[13px] font-semibold tabular-nums",
                                      v === undefined ? "text-ink-4" : isBest ? "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200" : "bg-subtle text-ink",
                                    )}
                                  >
                                    {v ?? "–"}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {editWeights && (
                      <tr className="border-b border-line/70">
                        <td colSpan={2 + vendorIds.length} className="px-4 py-2">
                          {newCriterion.group === g ? (
                            <div className="flex max-w-md items-center gap-2">
                              <Input value={newCriterion.name} placeholder="New criterion name" className="h-8" onChange={(ev) => setNewCriterion({ ...newCriterion, name: ev.target.value })} />
                              <Button
                                size="xs"
                                onClick={() => {
                                  if (!newCriterion.name.trim()) return;
                                  setWeights([...weights, { id: uid("k"), name: newCriterion.name.trim(), group: g, weight: 0 }]);
                                  setNewCriterion({ name: "", group: g });
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          ) : (
                            <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setNewCriterion({ name: "", group: g })}>
                              + Add {g} criterion
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              <tr className="bg-navy-900 text-white">
                <td className="sticky left-0 z-10 bg-navy-900 px-4 py-3 text-[13px] font-semibold">Weighted total</td>
                <td className="px-3 py-3 text-right text-xs text-navy-300">/100</td>
                {vendorIds.map((pid) => (
                  <td key={pid} className="px-3 py-3 text-center">
                    <span className={cn("inline-flex items-center gap-1 text-base font-semibold tabular-nums", pid === leader ? "text-accent-300" : "text-white")}>
                      {pid === leader && <Trophy className="size-3.5" />}
                      {totals[pid]?.scored ? totals[pid].total : "—"}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-line bg-subtle/60 px-5 py-2.5 text-xs text-ink-3">
          Highlighted cells mark the highest score per criterion. Totals are normalised over scored criteria; incomplete rows are shown as provisional.
        </p>
      </Card>
    </div>
  );
}
