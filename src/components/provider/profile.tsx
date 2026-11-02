"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  ExternalLink,
  Globe,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Scale,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wand2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { useUser } from "@/components/providers";
import { profileCompletion, useLookups } from "@/lib/hooks";
import type { CompanySize, Provider } from "@/lib/types";
import { COMPLIANCE_OPTIONS, SIZE_LABELS } from "@/lib/data/taxonomy";
import { LISTING_LABEL, VERIFICATION_LABEL } from "@/lib/labels";
import { requestListingChange } from "@/lib/actions/provider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Chip, Progress } from "@/components/ui/controls";
import { Sheet } from "@/components/ui/overlay";
import { EmptyState, PageHeader, ProviderLogo, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { TagInput, useCapabilityVocabulary, useCurrentProvider } from "./common";

type Section = "overview" | "expertise" | "capabilities" | "coverage" | "certifications" | "contact";

const SECTION_TITLE: Record<Section, string> = {
  overview: "Company overview",
  expertise: "Industries & technology categories",
  capabilities: "Key capabilities",
  coverage: "Coverage & client segments",
  certifications: "Certifications",
  contact: "Contact details",
};

export function ProviderProfile() {
  const user = useUser();
  const provider = useCurrentProvider();
  const L = useLookups();
  const update = useStore((s) => s.updateProvider);
  const [editing, setEditing] = React.useState<Section | null>(null);

  if (!provider) return <EmptyState icon={<Building2 />} title="Company profile not found" />;
  const completion = profileCompletion(provider);

  const editBtn = (s: Section) => (
    <Button variant="ghost" size="xs" onClick={() => setEditing(s)}>
      <Pencil /> Edit
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company profile"
        description="This is how buyers and the Elets team see your company. Keep it accurate — matching uses these details."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/provider/onboarding">
                <Wand2 /> Guided setup
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/providers/${provider.slug}`}>
                <ExternalLink /> View public profile
              </Link>
            </Button>
          </>
        }
      />

      {/* header preview */}
      <Card className="overflow-hidden">
        <div className="relative h-24 overflow-hidden bg-navy-950">
          <div className="grid-bg-dark absolute inset-0" />
          <div className="absolute -right-10 -top-16 size-56 rounded-full opacity-50 blur-3xl" style={{ background: provider.logo.from }} />
          <div className="absolute left-1/3 top-0 size-40 rounded-full opacity-30 blur-3xl" style={{ background: provider.logo.to }} />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end">
            <ProviderLogo provider={provider} size="xl" className="ring-4 ring-white" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-ink">{provider.name}</h2>
                <VerificationBadge status={provider.verification} />
              </div>
              <p className="mt-0.5 text-[13px] text-ink-3">{provider.tagline}</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle/60 px-4 py-3">
              <ScoreRing score={completion.percent} size={48} stroke={4} />
              <div>
                <p className="text-[13px] font-semibold text-ink">Profile {completion.percent}% complete</p>
                <p className="text-xs text-ink-3">{completion.checks.filter(([, ok]) => !ok).length || "No"} items remaining</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-ink-4" />
              {provider.hq}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-ink-4" />
              Est. {provider.founded}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4 text-ink-4" />
              {SIZE_LABELS[provider.size]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4 text-ink-4" />
              {provider.website}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader icon={<Building2 />} title={SECTION_TITLE.overview} action={editBtn("overview")} />
            <CardContent>
              <p className="text-[13px] leading-relaxed text-ink-2">{provider.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Layers />} title={SECTION_TITLE.expertise} action={editBtn("expertise")} />
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Technology categories</p>
                <ul className="space-y-1.5">
                  {provider.categories.map((c, i) => (
                    <li key={c} className="flex items-center gap-2.5 text-[13px] text-ink-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <DynIcon name={L.category(c)?.icon ?? "Layers"} className="size-3.5" />
                      </span>
                      {L.categoryName(c)}
                      {i === 0 && <Badge tone="blue">Primary</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Industry verticals</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.industries.map((i) => (
                    <Badge key={i} tone="neutral">
                      {L.industryName(i)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Workflow />} title={SECTION_TITLE.capabilities} description="Compared against buyer requirements for functional alignment" action={editBtn("capabilities")} />
            <CardContent className="flex flex-wrap gap-1.5">
              {provider.capabilities.map((c) => (
                <span key={c} className="rounded-md bg-subtle px-2.5 py-1 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">
                  {c}
                </span>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader icon={<Target />} title={SECTION_TITLE.coverage} action={editBtn("coverage")} />
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Geographic coverage</p>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.regions.map((r) => (
                      <Badge key={r} tone="teal">
                        {L.regionName(r)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Client segments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.clientSegments.map((r) => (
                      <Badge key={r} tone="neutral">
                        {r}
                      </Badge>
                    ))}
                    {provider.clientSegments.length === 0 && <p className="text-xs text-ink-4">None added</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader icon={<Award />} title={SECTION_TITLE.certifications} action={editBtn("certifications")} />
              <CardContent>
                {provider.certifications.length === 0 ? (
                  <p className="text-[13px] text-ink-3">No certifications added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {provider.certifications.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-[13px] text-ink-2">
                        <BadgeCheck className="size-4 text-accent-600" />
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader icon={<UserRound />} title={SECTION_TITLE.contact} description="Shared with buyers once Elets makes an introduction" action={editBtn("contact")} />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-ink">{provider.contact.name}</p>
                <p className="text-xs text-ink-3">{provider.contact.title}</p>
              </div>
              <div className="space-y-1 text-[13px] text-ink-2">
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-ink-4" />
                  {provider.contact.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-ink-4" />
                  {provider.contact.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Completion checklist" />
            <CardContent>
              <Progress value={completion.percent} tone={completion.percent === 100 ? "green" : "brand"} />
              <ul className="mt-4 space-y-2">
                {completion.checks.map(([label, ok]) => (
                  <li key={label} className="flex items-center gap-2.5 text-[13px]">
                    <span className={cn("grid size-4 place-items-center rounded-full", ok ? "bg-emerald-500 text-white" : "border-2 border-dashed border-line-strong")}>{ok && <Check className="size-2.5" strokeWidth={3} />}</span>
                    <span className={ok ? "text-ink-3" : "font-medium text-ink"}>{label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={<Scale />} title="Three separate controls" description="How Elets keeps the marketplace fair" />
            <CardContent className="space-y-3">
              <ControlRow
                icon={<BadgeCheck />}
                title="Verification"
                value={VERIFICATION_LABEL[provider.verification]}
                tone={provider.verification === "verified" ? "green" : "amber"}
                body={provider.verifiedAt ? `Verified ${formatDate(provider.verifiedAt)}. Confirms company details and documents.` : "Confirms company details and documents."}
                href="/provider/verification"
              />
              <ControlRow
                icon={<Target />}
                title="Matching eligibility"
                value={provider.matchingEligible ? "Eligible" : "Not yet eligible"}
                tone={provider.matchingEligible ? "green" : "neutral"}
                body="Set by Elets operations. Determines whether the engine considers you for buyer requirements."
              />
              <ControlRow
                icon={<Sparkles />}
                title="Listing package"
                value={LISTING_LABEL[provider.listing]}
                tone="blue"
                body="Paid visibility on the marketplace only. It never changes match scores or rankings."
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  requestListingChange(provider.id, user.id, provider.listing === "premium" ? "Premium" : "Featured");
                  toast.success("Enquiry sent to Elets", { description: "Neha Sharma will follow up in Messages." });
                }}
              >
                Enquire about listing packages
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {editing && <EditSheet section={editing} provider={provider} onClose={() => setEditing(null)} onSave={(p) => update(provider.id, p)} />}
    </div>
  );
}

function ControlRow({ icon, title, value, tone, body, href }: { icon: React.ReactNode; title: string; value: string; tone: "green" | "amber" | "neutral" | "blue"; body: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-line p-3 transition hover:border-line-strong">
      <div className="flex items-center gap-2">
        <span className="text-ink-4 [&_svg]:size-4">{icon}</span>
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <Badge tone={tone} className="ml-auto">
          {value}
        </Badge>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{body}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function EditSheet({ section, provider, onClose, onSave }: { section: Section; provider: Provider; onClose: () => void; onSave: (p: Partial<Provider>) => void }) {
  const [d, setD] = React.useState<Provider>(provider);
  const [err, setErr] = React.useState<Record<string, string>>({});
  const industries = useStore(useShallow((s) => s.industries.filter((i) => i.active)));
  const categories = useStore(useShallow((s) => s.categories.filter((c) => c.active)));
  const regions = useStore(useShallow((s) => s.regions.filter((r) => r.active)));
  const vocab = useCapabilityVocabulary();
  const set = (p: Partial<Provider>) => setD((x) => ({ ...x, ...p }));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = () => {
    const e: Record<string, string> = {};
    if (section === "overview") {
      if (!d.name.trim()) e.name = "Required";
      if (d.description.trim().length < 80) e.description = "Add at least 80 characters";
    }
    if (section === "expertise") {
      if (!d.industries.length) e.industries = "Select at least one";
      if (!d.categories.length) e.categories = "Select at least one";
    }
    if (section === "capabilities" && d.capabilities.length < 3) e.capabilities = "Add at least three";
    if (section === "coverage" && !d.regions.length) e.regions = "Select at least one region";
    if (section === "contact" && !/^\S+@\S+\.\S+$/.test(d.contact.email)) e.email = "Enter a valid email";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave(d);
    toast.success(`${SECTION_TITLE[section]} updated`);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={`Edit ${SECTION_TITLE[section].toLowerCase()}`}
      description="Changes are visible on your public profile immediately."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-5">
        {section === "overview" && (
          <>
            <Field label="Company name" error={err.name}>
              <Input value={d.name} onChange={(x) => set({ name: x.target.value })} invalid={!!err.name} />
            </Field>
            <Field label="Tagline">
              <Input value={d.tagline} onChange={(x) => set({ tagline: x.target.value })} maxLength={90} />
            </Field>
            <Field label="Description" error={err.description} hint={`${d.description.length} characters`}>
              <Textarea rows={6} value={d.description} onChange={(x) => set({ description: x.target.value })} invalid={!!err.description} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Website">
                <Input value={d.website} onChange={(x) => set({ website: x.target.value })} />
              </Field>
              <Field label="Headquarters">
                <Input value={d.hq} onChange={(x) => set({ hq: x.target.value })} />
              </Field>
              <Field label="Year established">
                <Input type="number" value={d.founded} onChange={(x) => set({ founded: Number(x.target.value) })} />
              </Field>
              <Field label="Company size">
                <Select value={d.size} onValueChange={(v) => set({ size: v as CompanySize })} options={Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))} />
              </Field>
            </div>
          </>
        )}
        {section === "expertise" && (
          <>
            <Field label="Industry verticals" error={err.industries}>
              <div className="flex flex-wrap gap-2">
                {industries.map((i) => (
                  <Chip key={i.id} selected={d.industries.includes(i.id)} onClick={() => set({ industries: toggle(d.industries, i.id) })}>
                    {i.name}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Technology categories" error={err.categories} hint="The first selected category is your primary expertise">
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Chip key={c.id} selected={d.categories.includes(c.id)} onClick={() => set({ categories: toggle(d.categories, c.id) })}>
                    {c.name}
                  </Chip>
                ))}
              </div>
            </Field>
          </>
        )}
        {section === "capabilities" && (
          <Field label="Key capabilities" error={err.capabilities}>
            <TagInput value={d.capabilities} onChange={(v) => set({ capabilities: v })} suggestions={vocab} invalid={!!err.capabilities} />
          </Field>
        )}
        {section === "coverage" && (
          <>
            <Field label="Geographic coverage" error={err.regions}>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <Chip key={r.id} selected={d.regions.includes(r.id)} onClick={() => set({ regions: toggle(d.regions, r.id) })}>
                    {r.name}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Client segments">
              <TagInput value={d.clientSegments} onChange={(v) => set({ clientSegments: v })} suggestions={["State governments", "Hospitals", "Universities", "PSUs", "Co-operative banks", "NBFCs", "Municipal corporations"]} />
            </Field>
          </>
        )}
        {section === "certifications" && (
          <Field label="Certifications & empanelments" hint="Certificates are checked during verification">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {COMPLIANCE_OPTIONS.map((c) => (
                  <Chip key={c} selected={d.certifications.includes(c)} onClick={() => set({ certifications: toggle(d.certifications, c) })}>
                    {c}
                  </Chip>
                ))}
              </div>
              <TagInput
                value={d.certifications.filter((c) => !COMPLIANCE_OPTIONS.includes(c))}
                onChange={(v) => set({ certifications: [...d.certifications.filter((c) => COMPLIANCE_OPTIONS.includes(c)), ...v] })}
                placeholder="Add another certification"
              />
            </div>
          </Field>
        )}
        {section === "contact" && (
          <div className="grid gap-4">
            <Field label="Name">
              <Input value={d.contact.name} onChange={(x) => set({ contact: { ...d.contact, name: x.target.value } })} />
            </Field>
            <Field label="Title">
              <Input value={d.contact.title} onChange={(x) => set({ contact: { ...d.contact, title: x.target.value } })} />
            </Field>
            <Field label="Email" error={err.email}>
              <Input type="email" value={d.contact.email} onChange={(x) => set({ contact: { ...d.contact, email: x.target.value } })} invalid={!!err.email} />
            </Field>
            <Field label="Phone">
              <Input value={d.contact.phone} onChange={(x) => set({ contact: { ...d.contact, phone: x.target.value } })} />
            </Field>
          </div>
        )}
      </div>
    </Sheet>
  );
}
