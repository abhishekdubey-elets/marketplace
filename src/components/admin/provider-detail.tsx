"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  BadgeCheck,
  Briefcase,
  Check,
  ExternalLink,
  FileCheck2,
  FileText,
  FileWarning,
  Globe,
  History,
  Info,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Tags,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { profileCompletion, useLookups } from "@/lib/hooks";
import { person } from "@/lib/people";
import type { ProviderDocument } from "@/lib/types";
import { LISTING_LABEL, MATCH_STATUS_LABEL, MATCH_STATUS_TONE, OPP_STAGE_LABEL, OPP_STAGE_TONE, VERIFICATION_LABEL } from "@/lib/labels";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { SIZE_LABELS } from "@/lib/data/taxonomy";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, ProviderLogo, ScorePill, SectionLabel, VerificationBadge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Chip, Progress, Switch } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Field, Textarea } from "@/components/ui/input";
import { Modal, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { EligibilityBadge } from "./common";

const DOC_KIND: Record<ProviderDocument["kind"], string> = {
  incorporation: "Incorporation",
  gst: "GST registration",
  certification: "Certification",
  reference: "Client references",
  other: "Other",
};

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useUser();
  const L = useLookups();
  const provider = useStore((s) => s.providers.find((p) => p.id === id));
  const categories = useStore((s) => s.categories);
  const requirements = useStore((s) => s.requirements);
  const allMatches = useStore((s) => s.matches);
  const allOpps = useStore((s) => s.opportunities);
  const audit = useStore((s) => s.audit);
  const setVerification = useStore((s) => s.setVerification);
  const setEligible = useStore((s) => s.setMatchingEligible);
  const setListing = useStore((s) => s.setListing);
  const setAccount = useStore((s) => s.setAccountStatus);
  const updateProvider = useStore((s) => s.updateProvider);
  const log = useStore((s) => s.log);

  const [docsOpen, setDocsOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [suspendOpen, setSuspendOpen] = React.useState(false);

  if (!provider)
    return (
      <EmptyState
        icon={<Briefcase />}
        title="Provider not found"
        description="It may have been removed, or the link is incorrect."
        action={
          <Button variant="secondary" asChild>
            <Link href="/admin/providers">Back to providers</Link>
          </Button>
        }
      />
    );

  const p = provider;
  const completion = profileCompletion(p);
  const matches = allMatches.filter((m) => m.providerId === p.id);
  const opps = allOpps.filter((o) => o.providerId === p.id);
  const activity = audit.filter((a) => a.entityId === p.id || a.detail.includes(p.name));

  const setDoc = (docId: string, status: ProviderDocument["status"]) => {
    updateProvider(p.id, (x) => ({ ...x, documents: x.documents.map((d) => (d.id === docId ? { ...d, status } : d)) }));
    const d = p.documents.find((x) => x.id === docId);
    log(user.id, status === "accepted" ? "Accepted document" : "Requested document", "provider", p.id, `${d?.name} (${p.name})`);
    toast.success(status === "accepted" ? "Document accepted" : "Document re-requested", { description: d?.name });
  };

  const toggleCategory = (cid: string) => {
    const on = p.categories.includes(cid);
    if (on && p.categories.length === 1) return toast.error("A provider needs at least one category");
    updateProvider(p.id, (x) => ({ ...x, categories: on ? x.categories.filter((c) => c !== cid) : [...x.categories, cid] }));
    log(user.id, on ? "Removed category" : "Assigned category", "provider", p.id, `${L.categoryName(cid)} — ${p.name}`);
  };

  return (
    <div>
      <button onClick={() => router.push("/admin/providers")} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> All providers
      </button>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ProviderLogo provider={p} size="lg" />
            <span className="min-w-0">
              <span className="block truncate">{p.name}</span>
              <span className="mt-0.5 block text-sm font-normal text-ink-3">{p.tagline}</span>
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href={`/providers/${p.slug}`} target="_blank">
                <ExternalLink /> Public profile
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/admin/messages">
                <Mail /> Message
              </Link>
            </Button>
          </>
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <VerificationBadge status={p.verification} />
          <EligibilityBadge provider={p} />
          <Badge tone="neutral">{LISTING_LABEL[p.listing]}</Badge>
        </div>
      </PageHeader>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="mb-5">
              <TabsTrigger value="overview">Profile</TabsTrigger>
              <TabsTrigger value="documents" count={p.documents.length}>
                Documents
              </TabsTrigger>
              <TabsTrigger value="matches" count={matches.length + opps.length}>
                Matches & opportunities
              </TabsTrigger>
              <TabsTrigger value="activity" count={activity.length}>
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5">
              <Card>
                <CardHeader title="Company overview" />
                <CardContent className="space-y-4">
                  <p className="text-[13px] leading-relaxed text-ink-2">{p.description}</p>
                  <div className="grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
                    <Meta icon={<MapPin />} label="Headquarters" value={p.hq} />
                    <Meta icon={<Users />} label="Company size" value={SIZE_LABELS[p.size]} />
                    <Meta icon={<History />} label="Established" value={String(p.founded)} />
                    <Meta icon={<Globe />} label="Website" value={p.website} />
                    <Meta icon={<Mail />} label="Contact" value={`${p.contact.name}, ${p.contact.title}`} />
                    <Meta icon={<Phone />} label="Phone" value={p.contact.phone} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Category assignment" description="Categories determine technology alignment in matching. Click to toggle." icon={<Tags />} />
                <CardContent className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Chip key={c.id} selected={p.categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Capabilities" />
                  <CardContent className="flex flex-wrap gap-1.5">
                    {p.capabilities.map((c) => (
                      <span key={c} className="rounded-md bg-subtle px-2 py-1 text-xs text-ink-2 ring-1 ring-inset ring-line">
                        {c}
                      </span>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Coverage & compliance" />
                  <CardContent className="space-y-3">
                    <div>
                      <SectionLabel className="mb-1.5">Industries</SectionLabel>
                      <p className="text-[13px] text-ink-2">{p.industries.map(L.industryName).join(", ")}</p>
                    </div>
                    <div>
                      <SectionLabel className="mb-1.5">Regions</SectionLabel>
                      <p className="text-[13px] text-ink-2">{p.regions.map(L.regionName).join(", ")}</p>
                    </div>
                    <div>
                      <SectionLabel className="mb-1.5">Certifications</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {p.certifications.length ? p.certifications.map((c) => <Badge key={c} tone="teal">{c}</Badge>) : <span className="text-[13px] text-ink-3">None declared</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader title="Solutions & case studies" description={`${p.solutions.length} solutions · ${p.caseStudies.length} case studies`} />
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {p.solutions.map((s) => (
                    <div key={s.id} className="rounded-xl border border-line p-3.5">
                      <p className="text-[13px] font-semibold text-ink">{s.name}</p>
                      <p className="mt-0.5 text-xs text-ink-3">{L.categoryName(s.categoryId)}</p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-2">{s.summary}</p>
                    </div>
                  ))}
                  {p.caseStudies.map((c) => (
                    <div key={c.id} className="rounded-xl border border-dashed border-line-strong bg-subtle/50 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-700">Case study · {c.year}</p>
                      <p className="mt-1 text-[13px] font-semibold text-ink">{c.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-3">{c.outcome}</p>
                    </div>
                  ))}
                  {p.solutions.length + p.caseStudies.length === 0 && <p className="text-[13px] text-ink-3">No solutions or case studies yet.</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader title="Supporting documents" description="Accept documents individually or request a fresh upload." icon={<FileText />} />
                <div className="divide-y divide-line border-t border-line">
                  {p.documents.length === 0 && <EmptyState compact icon={<FileText />} title="No documents uploaded" />}
                  {p.documents.map((d) => (
                    <div key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <span className="grid size-9 place-items-center rounded-lg bg-navy-50 text-navy-600">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                        <p className="text-xs text-ink-3">
                          {DOC_KIND[d.kind]} · {d.uploadedAt ? `Uploaded ${formatDate(d.uploadedAt)}` : "Not uploaded"}
                        </p>
                      </div>
                      <Badge tone={d.status === "accepted" ? "green" : d.status === "under_review" ? "amber" : "red"} dot>
                        {d.status === "accepted" ? "Accepted" : d.status === "under_review" ? "Under review" : "Requested"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="xs" variant="secondary" disabled={d.status === "accepted" || !d.uploadedAt} onClick={() => setDoc(d.id, "accepted")}>
                          <Check /> Accept
                        </Button>
                        <Button size="xs" variant="ghost" disabled={d.status === "requested"} onClick={() => setDoc(d.id, "requested")}>
                          <RotateCcw /> Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="matches" className="space-y-5">
              <Card>
                <CardHeader title="Requirement matches" description="Scores computed live by the matching engine" />
                <div className="divide-y divide-line border-t border-line">
                  {matches.length === 0 && <EmptyState compact icon={<Briefcase />} title="No matches yet" description="This provider has not been matched to any requirement." />}
                  {matches.map((m) => {
                    const r = requirements.find((x) => x.id === m.requirementId);
                    if (!r) return null;
                    const res = scoreMatch(r, toMatchable(p), categories);
                    return (
                      <Link key={m.id} href={`/admin/requirements/${r.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-subtle">
                        <span className="w-28 shrink-0 font-mono text-xs text-ink-3">{r.code}</span>
                        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.title}</span>
                        <ScorePill score={res.score} />
                        <Badge tone={MATCH_STATUS_TONE[m.status]}>{MATCH_STATUS_LABEL[m.status]}</Badge>
                        {m.providerInterest === "interested" && <Badge tone="teal">Interested</Badge>}
                      </Link>
                    );
                  })}
                </div>
              </Card>
              <Card>
                <CardHeader title="Opportunities" />
                <div className="divide-y divide-line border-t border-line">
                  {opps.length === 0 && <EmptyState compact icon={<Briefcase />} title="No opportunities yet" />}
                  {opps.map((o) => (
                    <Link key={o.id} href="/admin/opportunities" className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-subtle">
                      <span className="w-28 shrink-0 font-mono text-xs text-ink-3">{o.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{L.buyer(o.buyerId)?.name}</span>
                      <Badge tone={OPP_STAGE_TONE[o.stage]} dot>
                        {OPP_STAGE_LABEL[o.stage]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader title="Audit trail" description="Every administrative action on this provider" icon={<History />} />
                <CardContent>
                  {activity.length === 0 ? (
                    <EmptyState compact icon={<History />} title="No recorded actions yet" />
                  ) : (
                    <ol className="relative space-y-4 border-l border-line pl-5">
                      {activity.map((a) => (
                        <li key={a.id} className="relative">
                          <span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-brand-500 ring-4 ring-white" />
                          <p className="text-[13px] text-ink">
                            <span className="font-medium">{person(a.actorId).name}</span> · {a.action}
                          </p>
                          <p className="text-xs text-ink-3">{a.detail}</p>
                          <p className="text-[11px] text-ink-4">
                            {formatDate(a.at)} · {timeAgo(a.at)}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* control panel */}
        <div className="space-y-4">
          <Card className={cn(p.verification !== "verified" && "border-amber-200 ring-4 ring-amber-50")}>
            <CardHeader title="Verification decision" description={`Current status: ${VERIFICATION_LABEL[p.verification]}`} icon={<ShieldCheck />} />
            <CardContent className="space-y-2">
              {p.verifiedAt && <p className="text-xs text-ink-3">Verified on {formatDate(p.verifiedAt)}</p>}
              <Button
                className="w-full"
                disabled={p.verification === "verified"}
                onClick={() => {
                  setVerification(p.id, "verified", user.id, `All documents accepted — ${p.name}`);
                  toast.success("Provider verified", { description: `${p.name} now carries the Elets Verified badge.` });
                }}
              >
                <BadgeCheck /> Approve verification
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => setDocsOpen(true)}>
                <FileWarning /> Request additional documents
              </Button>
              <Button className="w-full" variant="danger-ghost" disabled={p.verification === "rejected"} onClick={() => setRejectOpen(true)}>
                <XCircle /> Reject application
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Matching eligibility" description="Independent of verification status" />
            <CardContent>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">{p.matchingEligible ? "Eligible for matching" : "Excluded from matching"}</p>
                  <p className="text-xs text-ink-3">{p.accountStatus === "suspended" ? "Suspended accounts are never matched" : "Controls appearance in match results"}</p>
                </div>
                <Switch
                  aria-label="Matching eligibility"
                  checked={p.matchingEligible}
                  disabled={p.accountStatus === "suspended"}
                  onCheckedChange={(v) => {
                    setEligible(p.id, v, user.id);
                    toast.success(v ? "Matching enabled" : "Matching disabled");
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Listing package" description="Commercial package — display only" />
            <CardContent className="space-y-3">
              <Select
                value={p.listing}
                onValueChange={(v) => {
                  setListing(p.id, v as typeof p.listing, user.id);
                  toast.success("Listing package updated", { description: "Match scores are unaffected." });
                }}
                options={(["standard", "featured", "premium"] as const).map((v) => ({ value: v, label: LISTING_LABEL[v] }))}
              />
              <p className="flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
                <Info className="mt-px size-3.5 shrink-0" />
                Listing package has no effect on match scores. The matching engine never receives this field.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Profile completeness" action={<span className="text-sm font-semibold tabular-nums text-ink">{completion.percent}%</span>} />
            <CardContent className="space-y-3">
              <Progress value={completion.percent} tone={completion.percent >= 80 ? "accent" : "amber"} />
              <ul className="grid grid-cols-1 gap-1.5 text-xs">
                {completion.checks.map(([label, ok]) => (
                  <li key={label} className={cn("flex items-center gap-2", ok ? "text-ink-2" : "text-ink-4")}>
                    {ok ? <FileCheck2 className="size-3.5 text-accent-600" /> : <span className="ml-1 mr-0.5 size-1.5 rounded-full bg-ink-4" />}
                    {label}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Account" description={p.accountStatus === "active" ? "Account is active" : "Account is suspended"} />
            <CardContent>
              {p.accountStatus === "active" ? (
                <Button variant="danger-ghost" className="w-full" onClick={() => setSuspendOpen(true)}>
                  <Ban /> Suspend account
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setAccount(p.id, "active", user.id);
                    toast.success("Account reactivated");
                  }}
                >
                  <RotateCcw /> Reactivate account
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RequestDocsModal
        open={docsOpen}
        onOpenChange={setDocsOpen}
        docs={p.documents}
        onSubmit={(ids, note) => {
          updateProvider(p.id, (x) => ({ ...x, documents: x.documents.map((d) => (ids.includes(d.id) ? { ...d, status: "requested" } : d)) }));
          setVerification(p.id, "docs_requested", user.id, `${ids.length} documents requested${note ? ` — ${note}` : ""}`);
          toast.success("Document request sent", { description: `${p.contact.name} has been notified.` });
        }}
      />
      <ReasonModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={`Reject ${p.name}?`}
        description="The provider will be notified with your reason. You can re-open verification later."
        confirm="Reject application"
        onConfirm={(reason) => {
          setVerification(p.id, "rejected", user.id, reason);
          toast.success("Application rejected", { description: p.name });
        }}
      />
      <ReasonModal
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={`Suspend ${p.name}?`}
        description="Suspended providers are hidden from discovery and excluded from all matching until reactivated."
        confirm="Suspend account"
        onConfirm={(reason) => {
          setAccount(p.id, "suspended", user.id);
          log(user.id, "Suspension reason", "provider", p.id, reason);
          toast.success("Account suspended", { description: p.name });
        }}
      />
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-ink-4 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink-4">{label}</p>
        <p className="truncate text-ink-2">{value}</p>
      </div>
    </div>
  );
}

function RequestDocsModal({
  open,
  onOpenChange,
  docs,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  docs: ProviderDocument[];
  onSubmit: (ids: string[], note: string) => void;
}) {
  const [sel, setSel] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setSel(docs.filter((d) => d.status !== "accepted").map((d) => d.id));
      setNote("");
    }
  }, [open, docs]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Request additional documents"
      description="Select the documents the provider must upload or replace."
      icon={<FileWarning />}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!sel.length}
            onClick={() => {
              onSubmit(sel, note.trim());
              onOpenChange(false);
            }}
          >
            Send request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          {docs.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 hover:bg-subtle">
              <Checkbox checked={sel.includes(d.id)} onCheckedChange={(v) => setSel((s) => (v ? [...s, d.id] : s.filter((x) => x !== d.id)))} />
              <span className="flex-1 text-[13px] text-ink">{d.name}</span>
              <span className="text-xs text-ink-3">{DOC_KIND[d.kind]}</span>
            </label>
          ))}
        </div>
        <Field label="Note to provider" optional>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Please upload the current ISO 27001 certificate with scope statement." />
        </Field>
      </div>
    </Modal>
  );
}

export function ReasonModal({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirm: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState("");
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setReason("");
      setErr("");
    }
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (reason.trim().length < 5) return setErr("Add a short reason (recorded in the audit log)");
              onConfirm(reason.trim());
              onOpenChange(false);
            }}
          >
            {confirm}
          </Button>
        </>
      }
    >
      <Field label="Reason" error={err}>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} invalid={!!err} rows={3} />
      </Field>
    </Modal>
  );
}
