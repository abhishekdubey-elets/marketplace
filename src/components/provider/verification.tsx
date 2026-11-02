"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, Check, CloudUpload, FileCheck, FileText, Info, Plus, Scale, ShieldCheck, Sparkles, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { profileCompletion } from "@/lib/hooks";
import type { ProviderDocument } from "@/lib/types";
import { LISTING_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { addProviderDocument, removeProviderDocument, uploadProviderDocument } from "@/lib/actions/provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/overlay";
import { EmptyState, PageHeader, VerificationBadge } from "@/components/ui/misc";
import type { Tone } from "@/lib/labels";
import { useCurrentProvider } from "./common";

const DOC_STATUS: Record<ProviderDocument["status"], { label: string; tone: Tone }> = {
  accepted: { label: "Accepted", tone: "green" },
  under_review: { label: "Under review", tone: "amber" },
  requested: { label: "Requested by Elets", tone: "red" },
};

const KIND_LABEL: Record<ProviderDocument["kind"], string> = {
  incorporation: "Incorporation",
  gst: "GST registration",
  certification: "Certification",
  reference: "Client reference",
  other: "Other",
};

export function ProviderVerification() {
  const provider = useCurrentProvider();
  const requestVerification = useStore((s) => s.requestVerification);
  const [addOpen, setAddOpen] = React.useState(false);
  const [docName, setDocName] = React.useState("");
  const [docKind, setDocKind] = React.useState<ProviderDocument["kind"]>("certification");
  const [nameErr, setNameErr] = React.useState("");

  if (!provider) return <EmptyState icon={<ShieldCheck />} title="Company profile not found" />;

  const completion = profileCompletion(provider);
  const docsReady = provider.documents.length > 0 && provider.documents.every((d) => d.uploadedAt);
  const v = provider.verification;
  const steps = [
    { title: "Profile complete", desc: `${completion.percent}% complete`, done: completion.percent >= 75 },
    { title: "Documents submitted", desc: `${provider.documents.filter((d) => d.uploadedAt).length} of ${provider.documents.length} uploaded`, done: docsReady },
    { title: "Elets review", desc: v === "pending" ? "In progress" : v === "verified" ? "Completed" : v === "docs_requested" ? "Additional documents requested" : "Not started", done: v === "verified" },
    { title: "Verified", desc: provider.verifiedAt ? formatDate(provider.verifiedAt) : "Badge shown on profile", done: v === "verified" },
  ];
  const current = steps.findIndex((s) => !s.done);
  const canRequest = v === "unverified" || v === "rejected" || v === "docs_requested";

  const fileInput = (doc: ProviderDocument) => (
    <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-brand-50 px-2.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100">
      <CloudUpload className="size-3.5" /> Upload
      <input
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          uploadProviderDocument(provider.id, doc.id, f.name);
          toast.success("Document uploaded", { description: `${f.name} — file storage is simulated; Elets has been notified.` });
          e.target.value = "";
        }}
      />
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verification"
        description="Elets verifies company details, certifications and references before a profile carries the Elets Verified badge."
        actions={
          canRequest ? (
            <Button
              onClick={() => {
                if (!docsReady) return toast.error("Upload all requested documents first");
                requestVerification(provider.id);
                toast.success("Verification requested", { description: "The Elets team will review your submission." });
              }}
            >
              <ShieldCheck /> Request verification
            </Button>
          ) : (
            <VerificationBadge status={v} />
          )
        }
      />

      <Card className="overflow-hidden">
        <div className={cn("flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center", v === "verified" ? "bg-gradient-to-r from-emerald-50 to-white" : "bg-gradient-to-r from-amber-50 to-white")}>
          <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", v === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
            <BadgeCheck className="size-6" />
          </span>
          <div className="flex-1">
            <p className="text-base font-semibold text-ink">{VERIFICATION_LABEL[v]}</p>
            <p className="text-[13px] text-ink-3">
              {v === "verified"
                ? `${provider.name} was verified on ${formatDate(provider.verifiedAt!)}. Keep documents current to retain the badge.`
                : v === "pending"
                  ? "Your submission is with the Elets team. You'll be notified when the review is complete."
                  : v === "docs_requested"
                    ? "Elets has requested additional documents. Upload them below, then request verification again."
                    : "Complete your profile and upload documents to request verification."}
            </p>
          </div>
        </div>
        <CardContent className="pt-6">
          <ol className="grid gap-4 sm:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-3 sm:flex-col sm:gap-2">
                {i > 0 && <span className={cn("absolute right-1/2 top-[15px] hidden h-0.5 w-full sm:block", steps[i - 1].done ? "bg-brand-500" : "bg-line")} />}
                <span
                  className={cn(
                    "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold sm:mx-auto",
                    s.done ? "border-brand-600 bg-brand-600 text-white" : i === current ? "border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100" : "border-line-strong bg-white text-ink-4",
                  )}
                >
                  {s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <div className="sm:text-center">
                  <p className={cn("text-[13px] font-medium", s.done || i === current ? "text-ink" : "text-ink-4")}>{s.title}</p>
                  <p className="text-xs text-ink-3">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            icon={<FileText />}
            title="Supporting documents"
            description="Documents are reviewed by Elets and are not shown publicly. File storage is simulated in this demo."
            action={
              <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                <Plus /> Add document
              </Button>
            }
          />
          <CardContent className="p-0">
            {provider.documents.length === 0 ? (
              <EmptyState compact icon={<FileText />} title="No documents yet" description="Add your incorporation certificate, GST registration, certifications and client references." />
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {provider.documents.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span className={cn("grid size-9 place-items-center rounded-lg", d.status === "accepted" ? "bg-emerald-50 text-emerald-600" : d.status === "requested" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>
                      {d.status === "accepted" ? <FileCheck className="size-4" /> : <FileText className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{d.name}</p>
                      <p className="text-xs text-ink-3">
                        {KIND_LABEL[d.kind]} · {d.uploadedAt ? `Uploaded ${formatDate(d.uploadedAt)}` : "Not uploaded"}
                      </p>
                    </div>
                    <Badge tone={DOC_STATUS[d.status].tone} dot>
                      {DOC_STATUS[d.status].label}
                    </Badge>
                    {(d.status === "requested" || !d.uploadedAt) && fileInput(d)}
                    {d.status !== "accepted" && d.uploadedAt && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${d.name}`}
                        onClick={() => {
                          removeProviderDocument(provider.id, d.id);
                          toast.success("Document removed");
                        }}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Info />} title="What verification covers" />
            <CardContent>
              <ul className="space-y-2.5">
                {[
                  "Legal entity, registration and GST details",
                  "Certifications and empanelments you list",
                  "Client references for published case studies",
                  "Named contacts and company website",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-600" />
                    {x}
                  </li>
                ))}
              </ul>
              {completion.percent < 100 && (
                <Button variant="link" size="sm" className="mt-3" asChild>
                  <Link href="/provider/onboarding">Complete your profile →</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Scale />} title="Three independent controls" description="Each is managed separately by Elets" />
            <CardContent className="space-y-3">
              {[
                { icon: BadgeCheck, title: "Verification", value: VERIFICATION_LABEL[v], body: "Trust signal shown to buyers. Based only on documents and checks." },
                { icon: Target, title: "Matching eligibility", value: provider.matchingEligible ? "Eligible" : "Not eligible", body: "Whether the matching engine considers your profile. Set by Elets operations." },
                { icon: Sparkles, title: "Listing package", value: LISTING_LABEL[provider.listing], body: "Paid visibility only. Never read by the matching engine." },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2">
                    <c.icon className="size-4 text-ink-4" />
                    <p className="text-[13px] font-medium text-ink">{c.title}</p>
                    <span className="ml-auto text-xs font-medium text-ink-2">{c.value}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-3">{c.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add supporting document"
        description="Choose a file and document type. In this demo only the file name is stored."
        icon={<CloudUpload />}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!docName.trim()) return setNameErr("Choose a file or enter a document name");
                addProviderDocument(provider.id, docName.trim(), docKind);
                toast.success("Document added", { description: "Sent to Elets for review." });
                setDocName("");
                setNameErr("");
                setAddOpen(false);
              }}
            >
              Add document
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Document type">
            <Select value={docKind} onValueChange={(x) => setDocKind(x as ProviderDocument["kind"])} options={Object.entries(KIND_LABEL).map(([value, label]) => ({ value, label }))} />
          </Field>
          <Field label="File" error={nameErr}>
            <div className="flex gap-2">
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. CMMI Level 3 appraisal.pdf" invalid={!!nameErr} />
              <label className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink shadow-xs hover:bg-subtle">
                <CloudUpload className="size-4" /> Browse
                <input type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && setDocName(e.target.files[0].name)} />
              </label>
            </div>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
