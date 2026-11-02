"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Check,
  CloudUpload,
  FileText,
  Globe,
  Layers,
  Palette,
  Plus,
  Save,
  Send,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uid, useStore } from "@/lib/store";
import { profileCompletion } from "@/lib/hooks";
import type { CaseStudy, CompanySize, Deployment, Provider, ProviderDocument, Solution } from "@/lib/types";
import { COMPLIANCE_OPTIONS, DEPLOYMENT_LABELS, SIZE_LABELS } from "@/lib/data/taxonomy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Chip, Progress } from "@/components/ui/controls";
import { EmptyState, ProviderLogo, VerificationBadge } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { LOGO_PRESETS, TagInput, useCapabilityVocabulary, useCurrentProvider } from "./common";

type Errors = Record<string, string>;

const STEPS = [
  { key: "company", title: "Company details", desc: "Who you are and where you're based", icon: Building2 },
  { key: "brand", title: "Logo & brand", desc: "How your company appears on the marketplace", icon: Palette },
  { key: "expertise", title: "Industries & categories", desc: "Sectors you serve and technologies you deliver", icon: Layers },
  { key: "solutions", title: "Products & services", desc: "Solutions buyers can discover", icon: Wrench },
  { key: "capabilities", title: "Capabilities & coverage", desc: "What you can deliver, and where", icon: Globe },
  { key: "credentials", title: "Certifications & case studies", desc: "Evidence that builds buyer trust", icon: Award },
  { key: "contact", title: "Contact & documents", desc: "Primary contact and verification documents", icon: UserRound },
  { key: "review", title: "Review & submit", desc: "Confirm and send for Elets verification", icon: Send },
] as const;

function validate(step: number, d: Provider): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!d.name.trim()) e.name = "Company name is required";
    if (!d.website.trim()) e.website = "Website is required";
    else if (!/^[\w-]+(\.[\w-]+)+/.test(d.website.replace(/^https?:\/\//, ""))) e.website = "Enter a valid domain, e.g. company.in";
    if (!d.hq.trim()) e.hq = "Headquarters is required";
    if (!d.founded || d.founded < 1900 || d.founded > 2026) e.founded = "Enter a year between 1900 and 2026";
    if (d.description.trim().length < 80) e.description = `Add at least 80 characters (${d.description.trim().length}/80)`;
  }
  if (step === 1 && !d.logo.initials.trim()) e.initials = "Add 1–3 initials for your logo mark";
  if (step === 2) {
    if (!d.industries.length) e.industries = "Select at least one industry";
    if (!d.categories.length) e.categories = "Select at least one technology category";
  }
  if (step === 3) {
    if (!d.solutions.length) e.solutions = "Add at least one solution or service offering";
    d.solutions.forEach((s, i) => {
      if (!s.name.trim()) e[`sol-${i}-name`] = "Name is required";
      if (!s.summary.trim()) e[`sol-${i}-summary`] = "Add a short summary";
    });
  }
  if (step === 4) {
    if (d.capabilities.length < 3) e.capabilities = "Add at least three key capabilities";
    if (!d.regions.length) e.regions = "Select your delivery coverage";
  }
  if (step === 5) {
    d.caseStudies.forEach((c, i) => {
      if (!c.title.trim()) e[`cs-${i}-title`] = "Title is required";
    });
  }
  if (step === 6) {
    if (!d.contact.name.trim()) e.contactName = "Contact name is required";
    if (!/^\S+@\S+\.\S+$/.test(d.contact.email)) e.contactEmail = "Enter a valid email";
  }
  return e;
}

export function ProviderOnboarding() {
  const router = useRouter();
  const provider = useCurrentProvider();
  const update = useStore((s) => s.updateProvider);
  const requestVerification = useStore((s) => s.requestVerification);
  const key = provider ? `elets-onboarding-draft-${provider.id}` : "";
  // Portal pages render only after client hydration (see AppShell), so reading localStorage here is safe.
  const [initial] = React.useState<{ draft: Provider | null; restored: boolean }>(() => {
    if (!provider) return { draft: null, restored: false };
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { draft: JSON.parse(raw) as Provider, restored: true };
    } catch {}
    return { draft: provider, restored: false };
  });
  const [draft, setDraft] = React.useState<Provider | null>(initial.draft);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [visited, setVisited] = React.useState<Set<number>>(new Set([0]));

  React.useEffect(() => {
    if (initial.restored) toast.info("Restored your saved draft");
  }, [initial.restored]);

  // autosave draft
  React.useEffect(() => {
    if (!draft || !key) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(draft));
      } catch {}
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }));
    }, 600);
    return () => clearTimeout(t);
  }, [draft, key]);

  if (!provider) return <EmptyState icon={<Building2 />} title="Company profile not found" />;
  if (!draft) return null;

  const set = (patch: Partial<Provider>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const go = (n: number) => {
    if (n > step) {
      const e = validate(step, draft);
      setErrors(e);
      if (Object.keys(e).length) {
        toast.error("Please complete the highlighted fields");
        return;
      }
    }
    setErrors({});
    setStep(n);
    setVisited((v) => new Set(v).add(n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
  };
  const saveExit = () => {
    update(provider.id, draft);
    clearDraft();
    toast.success("Profile saved", { description: "Your changes are live on your profile." });
    router.push("/provider/profile");
  };
  const submit = () => {
    for (let i = 0; i < 7; i++) {
      const e = validate(i, draft);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(i);
        toast.error(`Complete “${STEPS[i].title}” before submitting`);
        return;
      }
    }
    update(provider.id, draft);
    clearDraft();
    if (provider.verification === "verified" || provider.verification === "pending") {
      toast.success("Changes saved", { description: provider.verification === "verified" ? "Your verified profile has been updated." : "Your profile is already under review." });
    } else {
      requestVerification(provider.id);
      toast.success("Submitted for verification", { description: "The Elets team will review your profile and documents." });
    }
    router.push("/provider");
  };

  const completion = profileCompletion(draft);
  const isVerified = provider.verification === "verified" || provider.verification === "pending";
  const S = STEPS[step];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[13px] font-medium text-brand-600">Company onboarding</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">Set up your marketplace profile</h1>
          <p className="mt-1 text-sm text-ink-3">A complete, accurate profile helps Elets match you to the right requirements. Drafts save automatically in this browser.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
              <Check className="size-3.5 text-emerald-600" /> Draft saved {savedAt}
            </span>
          )}
          <Button variant="secondary" onClick={saveExit}>
            <Save /> Save & exit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* progress rail */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="p-4">
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-ink-2">Profile completeness</span>
                <span className="font-semibold tabular-nums text-ink">{completion.percent}%</span>
              </div>
              <Progress value={completion.percent} tone={completion.percent === 100 ? "green" : "brand"} />
            </div>
            <ol className="scrollbar-thin flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
              {STEPS.map((s, i) => {
                const done = i < step || (visited.has(i) && i !== step && Object.keys(validate(i, draft)).length === 0);
                return (
                  <li key={s.key} className="shrink-0">
                    <button
                      onClick={() => go(i)}
                      className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition", i === step ? "bg-brand-50" : "hover:bg-subtle")}
                      aria-current={i === step ? "step" : undefined}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                          i === step ? "border-brand-600 bg-brand-600 text-white" : done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line-strong bg-white text-ink-4",
                        )}
                      >
                        {done && i !== step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="hidden min-w-0 lg:block">
                        <span className={cn("block truncate text-[13px] font-medium", i === step ? "text-brand-800" : "text-ink-2")}>{s.title}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>

        {/* step body */}
        <Card className="overflow-hidden">
          <div className="flex items-start gap-3 border-b border-line px-6 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <S.icon className="size-5" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-medium text-ink-4">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="text-base font-semibold tracking-tight text-ink">{S.title}</h2>
              <p className="text-[13px] text-ink-3">{S.desc}</p>
            </div>
          </div>
          <div key={step} className="animate-slide-up px-6 py-6">
            {step === 0 && <CompanyStep d={draft} set={set} e={errors} />}
            {step === 1 && <BrandStep d={draft} set={set} e={errors} />}
            {step === 2 && <ExpertiseStep d={draft} set={set} e={errors} />}
            {step === 3 && <SolutionsStep d={draft} set={set} e={errors} />}
            {step === 4 && <CapabilitiesStep d={draft} set={set} e={errors} />}
            {step === 5 && <CredentialsStep d={draft} set={set} e={errors} />}
            {step === 6 && <ContactStep d={draft} set={set} e={errors} />}
            {step === 7 && <ReviewStep d={draft} onEdit={go} />}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle/60 px-6 py-4">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => go(step + 1)}>
                Continue <ArrowRight />
              </Button>
            ) : (
              <Button onClick={submit}>
                {isVerified ? (
                  <>
                    <Save /> Save changes
                  </>
                ) : (
                  <>
                    <Send /> Submit for verification
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

type StepProps = { d: Provider; set: (p: Partial<Provider>) => void; e: Errors };

function CompanyStep({ d, set, e }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Company name" error={e.name} className="sm:col-span-2">
        <Input value={d.name} onChange={(x) => set({ name: x.target.value })} invalid={!!e.name} />
      </Field>
      <Field label="Tagline" hint="One line buyers see on search results" optional className="sm:col-span-2">
        <Input value={d.tagline} onChange={(x) => set({ tagline: x.target.value })} maxLength={90} />
      </Field>
      <Field label="Website" error={e.website}>
        <Input value={d.website} onChange={(x) => set({ website: x.target.value })} invalid={!!e.website} icon={<Globe />} placeholder="company.in" />
      </Field>
      <Field label="Headquarters" error={e.hq}>
        <Input value={d.hq} onChange={(x) => set({ hq: x.target.value })} invalid={!!e.hq} placeholder="City, State" />
      </Field>
      <Field label="Year established" error={e.founded}>
        <Input type="number" value={d.founded || ""} onChange={(x) => set({ founded: Number(x.target.value) })} invalid={!!e.founded} />
      </Field>
      <Field label="Company size">
        <Select value={d.size} onValueChange={(v) => set({ size: v as CompanySize })} options={Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))} />
      </Field>
      <Field label="Company description" error={e.description} hint={`${d.description.length} characters · describe what you do, who you serve and how you deliver`} className="sm:col-span-2">
        <Textarea rows={5} value={d.description} onChange={(x) => set({ description: x.target.value })} invalid={!!e.description} />
      </Field>
    </div>
  );
}

function BrandStep({ d, set, e }: StepProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_260px]">
      <div className="space-y-5">
        <Field label="Logo initials" error={e.initials} hint="Up to three characters shown in your logo mark">
          <Input value={d.logo.initials} maxLength={3} onChange={(x) => set({ logo: { ...d.logo, initials: x.target.value.toUpperCase() } })} invalid={!!e.initials} className="w-32 font-semibold" />
        </Field>
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-ink-2">Brand colours</p>
          <div className="flex flex-wrap gap-2">
            {LOGO_PRESETS.map((p) => {
              const on = p.from === d.logo.from && p.to === d.logo.to;
              return (
                <button
                  key={p.from + p.to}
                  type="button"
                  onClick={() => set({ logo: { ...d.logo, ...p } })}
                  className={cn("size-10 rounded-xl ring-offset-2 transition", on ? "ring-2 ring-brand-500" : "hover:scale-105")}
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  aria-label="Choose colour preset"
                  aria-pressed={on}
                />
              );
            })}
          </div>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line-strong bg-subtle/60 px-6 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40">
          <CloudUpload className="size-6 text-brand-600" />
          <span className="mt-2 text-[13px] font-medium text-ink">Upload logo image</span>
          <span className="mt-0.5 text-xs text-ink-3">PNG or SVG, square, up to 2 MB</span>
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            className="sr-only"
            onChange={(x) => {
              const f = x.target.files?.[0];
              if (f) toast.info(`“${f.name}” selected`, { description: "File storage is simulated in this demo — your initials mark is used as the logo." });
            }}
          />
        </label>
      </div>
      <div className="rounded-2xl border border-line bg-subtle/60 p-5">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Preview</p>
        <div className="rounded-xl border border-line bg-white p-4 shadow-card">
          <div className="flex items-center gap-3">
            <ProviderLogo provider={d} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{d.name || "Company name"}</p>
              <p className="line-clamp-2 text-xs text-ink-3">{d.tagline || "Your tagline"}</p>
            </div>
          </div>
          <div className="mt-3">
            <VerificationBadge status={d.verification} compact />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <ProviderLogo provider={d} size="md" />
          <ProviderLogo provider={d} size="sm" />
          <span className="text-xs text-ink-3">Small sizes</span>
        </div>
      </div>
    </div>
  );
}

function ExpertiseStep({ d, set, e }: StepProps) {
  const industries = useStore((s) => s.industries.filter((i) => i.active));
  const categories = useStore((s) => s.categories.filter((c) => c.active));
  const services = useStore((s) => s.serviceCategories.filter((c) => c.active));
  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="space-y-7">
      <Field label="Industry verticals" error={e.industries} hint="Sectors where you have delivered projects">
        <div className="flex flex-wrap gap-2">
          {industries.map((i) => (
            <Chip key={i.id} selected={d.industries.includes(i.id)} onClick={() => set({ industries: toggle(d.industries, i.id) })} icon={<DynIcon name={i.icon} />}>
              {i.name}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Technology categories" error={e.categories} hint="Your first selected category is treated as your primary expertise">
        <div className="grid gap-2 sm:grid-cols-2">
          {categories.map((c) => {
            const on = d.categories.includes(c.id);
            const primary = d.categories[0] === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => set({ categories: toggle(d.categories, c.id) })}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  on ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-100" : "border-line bg-white hover:border-line-strong",
                )}
                aria-pressed={on}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", on ? "bg-brand-600 text-white" : "bg-navy-50 text-navy-600")}>
                  <DynIcon name={c.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{c.name}</span>
                {primary && <Badge tone="blue">Primary</Badge>}
                {on && !primary && <Check className="size-4 text-brand-600" />}
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Service types" optional>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <Chip key={s.id} selected={d.services.includes(s.id)} onClick={() => set({ services: toggle(d.services, s.id) })}>
              {s.name}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function SolutionsStep({ d, set, e }: StepProps) {
  const categories = useStore((s) => s.categories);
  const opts = categories.filter((c) => d.categories.includes(c.id)).map((c) => ({ value: c.id, label: c.name }));
  const all = opts.length ? opts : categories.map((c) => ({ value: c.id, label: c.name }));
  const patch = (i: number, p: Partial<Solution>) => set({ solutions: d.solutions.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  return (
    <div className="space-y-4">
      {e.solutions && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{e.solutions}</p>}
      {d.solutions.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-line bg-subtle/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Solution {i + 1}</p>
            <Button variant="danger-ghost" size="xs" onClick={() => set({ solutions: d.solutions.filter((_, j) => j !== i) })}>
              <Trash2 /> Remove
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={e[`sol-${i}-name`]}>
              <Input value={s.name} onChange={(x) => patch(i, { name: x.target.value })} invalid={!!e[`sol-${i}-name`]} />
            </Field>
            <Field label="Category">
              <Select value={s.categoryId} onValueChange={(v) => patch(i, { categoryId: v })} options={all} />
            </Field>
            <Field label="Summary" error={e[`sol-${i}-summary`]} className="sm:col-span-2">
              <Textarea rows={2} className="min-h-16" value={s.summary} onChange={(x) => patch(i, { summary: x.target.value })} invalid={!!e[`sol-${i}-summary`]} />
            </Field>
            <Field label="Deployment options" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DEPLOYMENT_LABELS) as Deployment[]).map((k) => (
                  <Chip key={k} selected={s.deployment.includes(k)} onClick={() => patch(i, { deployment: s.deployment.includes(k) ? s.deployment.filter((x) => x !== k) : [...s.deployment, k] })}>
                    {DEPLOYMENT_LABELS[k]}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        className="w-full border-dashed"
        onClick={() => set({ solutions: [...d.solutions, { id: uid("s"), name: "", categoryId: d.categories[0] ?? "cloud", summary: "", deployment: ["cloud"], highlights: [] }] })}
      >
        <Plus /> Add a solution
      </Button>
    </div>
  );
}

function CapabilitiesStep({ d, set, e }: StepProps) {
  const vocab = useCapabilityVocabulary();
  const regions = useStore((s) => s.regions.filter((r) => r.active));
  const toggleRegion = (id: string) => {
    if (id === "pan-india") return set({ regions: d.regions.includes("pan-india") ? [] : ["pan-india"] });
    const next = d.regions.filter((r) => r !== "pan-india");
    set({ regions: next.includes(id) ? next.filter((r) => r !== id) : [...next, id] });
  };
  return (
    <div className="space-y-7">
      <Field label="Key capabilities" error={e.capabilities} hint="Used by the matching engine for functional capability alignment">
        <TagInput value={d.capabilities} onChange={(v) => set({ capabilities: v })} suggestions={vocab} invalid={!!e.capabilities} placeholder="e.g. Cloud migration" />
      </Field>
      <Field label="Geographic coverage" error={e.regions} hint="Where you have delivery teams or partners">
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Chip key={r.id} selected={d.regions.includes(r.id)} onClick={() => toggleRegion(r.id)}>
              {r.name}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Client segments" optional hint="The types of organisations you typically serve">
        <TagInput value={d.clientSegments} onChange={(v) => set({ clientSegments: v })} suggestions={["State governments", "Hospitals", "Universities", "PSUs", "Co-operative banks", "NBFCs", "Municipal corporations", "School networks"]} />
      </Field>
    </div>
  );
}

function CredentialsStep({ d, set, e }: StepProps) {
  const industries = useStore((s) => s.industries);
  const categories = useStore((s) => s.categories);
  const custom = d.certifications.filter((c) => !COMPLIANCE_OPTIONS.includes(c));
  const patch = (i: number, p: Partial<CaseStudy>) => set({ caseStudies: d.caseStudies.map((c, j) => (j === i ? { ...c, ...p } : c)) });
  return (
    <div className="space-y-8">
      <Field label="Certifications & empanelments" hint="Elets verifies certificates during review">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_OPTIONS.map((c) => (
              <Chip key={c} selected={d.certifications.includes(c)} onClick={() => set({ certifications: d.certifications.includes(c) ? d.certifications.filter((x) => x !== c) : [...d.certifications, c] })}>
                {c}
              </Chip>
            ))}
          </div>
          <TagInput value={custom} onChange={(v) => set({ certifications: [...d.certifications.filter((c) => COMPLIANCE_OPTIONS.includes(c)), ...v] })} placeholder="Add another certification and press Enter" />
        </div>
      </Field>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-ink-2">Case studies</p>
          <span className="text-xs text-ink-4">Two or more recommended</span>
        </div>
        <div className="space-y-4">
          {d.caseStudies.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-line bg-subtle/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-semibold text-ink">Case study {i + 1}</p>
                <Button variant="danger-ghost" size="xs" onClick={() => set({ caseStudies: d.caseStudies.filter((_, j) => j !== i) })}>
                  <Trash2 /> Remove
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Title" error={e[`cs-${i}-title`]} className="sm:col-span-3">
                  <Input value={c.title} onChange={(x) => patch(i, { title: x.target.value })} invalid={!!e[`cs-${i}-title`]} />
                </Field>
                <Field label="Industry">
                  <Select value={c.industryId} onValueChange={(v) => patch(i, { industryId: v })} options={industries.map((x) => ({ value: x.id, label: x.name }))} />
                </Field>
                <Field label="Category">
                  <Select value={c.categoryId} onValueChange={(v) => patch(i, { categoryId: v })} options={categories.map((x) => ({ value: x.id, label: x.name }))} />
                </Field>
                <Field label="Year">
                  <Input type="number" value={c.year} onChange={(x) => patch(i, { year: Number(x.target.value) })} />
                </Field>
                <Field label="Summary" className="sm:col-span-3">
                  <Textarea rows={2} className="min-h-16" value={c.summary} onChange={(x) => patch(i, { summary: x.target.value })} />
                </Field>
                <Field label="Outcome" className="sm:col-span-3" hint="Describe the result qualitatively — avoid unverifiable figures">
                  <Input value={c.outcome} onChange={(x) => patch(i, { outcome: x.target.value })} />
                </Field>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-full border-dashed"
            onClick={() =>
              set({ caseStudies: [...d.caseStudies, { id: uid("c"), title: "", industryId: d.industries[0] ?? "gov", categoryId: d.categories[0] ?? "cloud", summary: "", outcome: "", year: 2026 }] })
            }
          >
            <Plus /> Add a case study
          </Button>
        </div>
      </div>
    </div>
  );
}

const DOC_KINDS: { value: ProviderDocument["kind"]; label: string }[] = [
  { value: "incorporation", label: "Incorporation certificate" },
  { value: "gst", label: "GST registration" },
  { value: "certification", label: "Certification" },
  { value: "reference", label: "Client reference" },
  { value: "other", label: "Other" },
];

function ContactStep({ d, set, e }: StepProps) {
  const [newKind, setNewKind] = React.useState<ProviderDocument["kind"]>("certification");
  const c = d.contact;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" error={e.contactName}>
          <Input value={c.name} onChange={(x) => set({ contact: { ...c, name: x.target.value } })} invalid={!!e.contactName} />
        </Field>
        <Field label="Title / role" optional>
          <Input value={c.title} onChange={(x) => set({ contact: { ...c, title: x.target.value } })} />
        </Field>
        <Field label="Email" error={e.contactEmail}>
          <Input type="email" value={c.email} onChange={(x) => set({ contact: { ...c, email: x.target.value } })} invalid={!!e.contactEmail} />
        </Field>
        <Field label="Phone" optional>
          <Input value={c.phone} onChange={(x) => set({ contact: { ...c, phone: x.target.value } })} />
        </Field>
      </div>
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-ink-2">Supporting documents</p>
          <span className="text-xs text-ink-4">Uploads are simulated in this demo</span>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line">
          {d.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-4 shrink-0 text-ink-4" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{doc.name}</p>
                <p className="text-xs text-ink-3">{DOC_KINDS.find((k) => k.value === doc.kind)?.label}</p>
              </div>
              {doc.uploadedAt ? (
                <Badge tone={doc.status === "accepted" ? "green" : "amber"}>{doc.status === "accepted" ? "Accepted" : "Under review"}</Badge>
              ) : (
                <Button size="xs" variant="subtle" onClick={() => set({ documents: d.documents.map((x) => (x.id === doc.id ? { ...x, uploadedAt: today, status: "under_review" } : x)) })}>
                  <CloudUpload /> Upload
                </Button>
              )}
              <Button variant="ghost" size="icon-xs" aria-label={`Remove ${doc.name}`} onClick={() => set({ documents: d.documents.filter((x) => x.id !== doc.id) })}>
                <Trash2 />
              </Button>
            </li>
          ))}
          {d.documents.length === 0 && <li className="px-4 py-6 text-center text-xs text-ink-3">No documents yet.</li>}
        </ul>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="sm:w-60">
            <Select value={newKind} onValueChange={(v) => setNewKind(v as ProviderDocument["kind"])} options={DOC_KINDS} />
          </div>
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink shadow-xs transition hover:bg-subtle">
            <CloudUpload className="size-4" /> Choose file
            <input
              type="file"
              className="sr-only"
              onChange={(x) => {
                const f = x.target.files?.[0];
                if (!f) return;
                set({ documents: [...d.documents, { id: uid("d"), name: f.name, kind: newKind, status: "under_review", uploadedAt: today }] });
                toast.success("Document added", { description: `${f.name} — stored as metadata only in this demo.` });
                x.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ d, onEdit }: { d: Provider; onEdit: (n: number) => void }) {
  const L = {
    ind: useStore((s) => s.industries),
    cat: useStore((s) => s.categories),
    reg: useStore((s) => s.regions),
  };
  const completion = profileCompletion(d);
  const rows: { step: number; label: string; value: React.ReactNode }[] = [
    { step: 0, label: "Company", value: `${d.name} · ${d.hq} · est. ${d.founded} · ${SIZE_LABELS[d.size]}` },
    { step: 0, label: "Website", value: d.website },
    { step: 2, label: "Industries", value: d.industries.map((i) => L.ind.find((x) => x.id === i)?.name).join(", ") },
    { step: 2, label: "Categories", value: d.categories.map((i) => L.cat.find((x) => x.id === i)?.name).join(", ") },
    { step: 3, label: "Solutions", value: d.solutions.map((s) => s.name).join(", ") || "—" },
    { step: 4, label: "Capabilities", value: d.capabilities.join(", ") },
    { step: 4, label: "Coverage", value: d.regions.map((i) => L.reg.find((x) => x.id === i)?.name).join(", ") },
    { step: 5, label: "Certifications", value: d.certifications.join(", ") || "—" },
    { step: 5, label: "Case studies", value: `${d.caseStudies.length} added` },
    { step: 6, label: "Contact", value: `${d.contact.name} · ${d.contact.email}` },
    { step: 6, label: "Documents", value: `${d.documents.filter((x) => x.uploadedAt).length} of ${d.documents.length} uploaded` },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-gradient-to-br from-brand-50/60 to-white p-5 sm:flex-row sm:items-center">
        <ProviderLogo provider={d} size="lg" />
        <div className="flex-1">
          <p className="text-base font-semibold text-ink">{d.name}</p>
          <p className="text-[13px] text-ink-3">{d.tagline}</p>
        </div>
        <div className="sm:w-48">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-ink-3">Completeness</span>
            <span className="font-semibold text-ink">{completion.percent}%</span>
          </div>
          <Progress value={completion.percent} tone={completion.percent === 100 ? "green" : "brand"} />
        </div>
      </div>
      <dl className="divide-y divide-line rounded-xl border border-line">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-4">
            <dt className="text-xs font-medium text-ink-3">{r.label}</dt>
            <dd className="text-[13px] text-ink-2">{r.value}</dd>
            <button onClick={() => onEdit(r.step)} className="justify-self-start text-xs font-medium text-brand-600 hover:underline">
              Edit
            </button>
          </div>
        ))}
      </dl>
      <div className="rounded-xl border border-line bg-subtle/60 p-4 text-xs leading-relaxed text-ink-3">
        <p className="mb-1 font-semibold text-ink-2">What happens next</p>
        The Elets team reviews your company details, certifications and documents — usually within a few working days. Verification adds the Elets Verified badge. It does not change your
        listing package, and your matching eligibility is managed separately by Elets operations.
      </div>
    </div>
  );
}
