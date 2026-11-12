"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  FileText,
  IndianRupee,
  Layers,
  Lightbulb,
  MapPin,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import type { Attachment, BudgetBand, Deployment, ProjectScale, Timeline } from "@/lib/types";
import { BUDGET_LABELS, COMPLIANCE_OPTIONS, DEPLOYMENT_LABELS, SCALE_LABELS, TIMELINE_LABELS } from "@/lib/data/taxonomy";
import { updateOwnOrg } from "@/lib/actions/buyer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Chip, Progress, RadioCards, Switch } from "@/components/ui/controls";
import { DynIcon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

interface Form {
  orgName: string;
  contactName: string;
  contactEmail: string;
  city: string;
  state: string;
  industryId: string;
  categoryId: string;
  title: string;
  problem: string;
  objectives: string[];
  capabilities: string[];
  budget: BudgetBand;
  timeline: Timeline | "";
  scale: ProjectScale | "";
  location: string;
  regions: string[];
  deployment: Deployment[];
  compliance: string[];
  additionalNotes: string;
  attachments: Attachment[];
  proRequested: boolean;
}

const STEPS = [
  { key: "org", title: "Organisation", description: "Confirm who this requirement is for.", icon: Building2 },
  { key: "industry", title: "Industry", description: "The sector your organisation operates in.", icon: Building2 },
  { key: "category", title: "Technology", description: "The primary technology area.", icon: Layers },
  { key: "problem", title: "Requirement", description: "Describe the business problem.", icon: FileText },
  { key: "budget", title: "Budget", description: "An indicative range (optional).", icon: IndianRupee },
  { key: "timeline", title: "Timeline", description: "When you expect to implement.", icon: CalendarDays },
  { key: "location", title: "Location & deployment", description: "Where and how it will run.", icon: MapPin },
  { key: "additional", title: "Additional details", description: "Compliance, notes and documents.", icon: Paperclip },
  { key: "review", title: "Review & submit", description: "Check everything before submitting.", icon: ClipboardCheck },
] as const;

const OPTIONAL = new Set(["budget", "timeline", "location", "additional"]);
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function RequirementWizard() {
  const user = useUser();
  const L = useLookups();
  const orgId = user.orgId!;
  const buyer = useStore((s) => s.buyers.find((b) => b.id === orgId));
  const industries = useStore((s) => s.industries).filter((i) => i.active);
  const categories = useStore((s) => s.categories).filter((c) => c.active);
  const regions = useStore((s) => s.regions).filter((r) => r.active);
  const providers = useStore((s) => s.providers);
  const createRequirement = useStore((s) => s.createRequirement);
  const draftKey = `elets-requirement-draft:${orgId}`;

  const initial = React.useMemo<Form>(
    () => ({
      orgName: buyer?.name ?? "",
      contactName: buyer?.contactName ?? user.name,
      contactEmail: buyer?.contactEmail ?? user.email,
      city: buyer?.city ?? "",
      state: buyer?.state ?? "",
      industryId: buyer?.industryId ?? "",
      categoryId: "",
      title: "",
      problem: "",
      objectives: [],
      capabilities: [],
      budget: "undisclosed",
      timeline: "",
      scale: "",
      location: buyer ? [buyer.city, buyer.state].filter(Boolean).join(", ") : "",
      regions: [],
      deployment: [],
      compliance: [],
      additionalNotes: "",
      attachments: [],
      proRequested: false,
    }),
    [buyer, user.name, user.email],
  );

  const [form, setForm] = React.useState<Form>(initial);
  const [step, setStep] = React.useState(0);
  const [maxStep, setMaxStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState<{ id: string; code: string } | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  // restore draft
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw) as { form: Form; step: number; maxStep: number };
        setForm({ ...initial, ...d.form });
        setStep(Math.min(d.step, STEPS.length - 1));
        setMaxStep(Math.min(d.maxStep ?? d.step, STEPS.length - 1));
        toast.info("Draft restored", { description: "We picked up where you left off." });
      }
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // autosave
  React.useEffect(() => {
    if (!loaded || submitted) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, step, maxStep }));
        setSavedAt(Date.now());
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [form, step, maxStep, loaded, submitted, draftKey]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: "" }));
  };
  const toggleIn = <K extends "regions" | "deployment" | "compliance" | "capabilities">(k: K, v: Form[K][number]) =>
    set(k, ((form[k] as string[]).includes(v as string) ? (form[k] as string[]).filter((x) => x !== v) : [...(form[k] as string[]), v]) as Form[K]);

  const validate = (i: number): Record<string, string> => {
    const e: Record<string, string> = {};
    const k = STEPS[i].key;
    if (k === "org") {
      if (!form.orgName.trim()) e.orgName = "Organisation name is required";
      if (!emailOk(form.contactEmail)) e.contactEmail = "Enter a valid email address";
    }
    if (k === "industry" && !form.industryId) e.industryId = "Select an industry to continue";
    if (k === "category" && !form.categoryId) e.categoryId = "Select a technology category to continue";
    if (k === "problem") {
      if (form.title.trim().length < 8) e.title = "Give your requirement a short, descriptive title (at least 8 characters)";
      if (form.problem.trim().length < 30) e.problem = `Describe the problem in a little more detail (${form.problem.trim().length}/30 characters)`;
    }
    return e;
  };

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    setMaxStep((m) => Math.max(m, to));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    const e = validate(step);
    if (Object.values(e).some(Boolean)) {
      setErrors(e);
      return;
    }
    go(Math.min(step + 1, STEPS.length - 1));
  };

  const submit = () => {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const e = validate(i);
      if (Object.values(e).some(Boolean)) {
        go(i);
        setTimeout(() => setErrors(e), 0);
        toast.error("A few details are missing", { description: `Please complete “${STEPS[i].title}”.` });
        return;
      }
    }
    updateOwnOrg(orgId, { name: form.orgName.trim(), contactName: form.contactName.trim(), contactEmail: form.contactEmail.trim(), city: form.city.trim(), state: form.state.trim() });
    const id = createRequirement({
      buyerId: orgId,
      title: form.title.trim(),
      industryId: form.industryId,
      categoryId: form.categoryId,
      problem: form.problem.trim(),
      objectives: form.objectives.filter((o) => o.trim()),
      capabilities: form.capabilities,
      budget: form.budget,
      timeline: form.timeline || "exploratory",
      scale: form.scale || "organisation",
      location: form.location.trim(),
      regions: form.regions,
      deployment: form.deployment,
      compliance: form.compliance,
      additionalNotes: form.additionalNotes.trim(),
      attachments: form.attachments,
      proRequested: form.proRequested,
    });
    const code = useStore.getState().requirements.find((r) => r.id === id)?.code ?? "";
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setSubmitted({ id, code });
    toast.success("Requirement submitted", { description: code });
    window.scrollTo({ top: 0 });
  };

  const discard = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setForm(initial);
    setStep(0);
    setMaxStep(0);
    setErrors({});
    toast.success("Draft discarded");
  };

  if (submitted) return <SuccessScreen id={submitted.id} code={submitted.code} pro={form.proRequested} onAnother={() => { setSubmitted(null); setForm(initial); setStep(0); setMaxStep(0); }} />;

  const capVocab = (() => {
    const freq = new Map<string, number>();
    providers.forEach((p) => {
      const inCat = form.categoryId && p.categories.includes(form.categoryId);
      p.capabilities.forEach((c) => freq.set(c, (freq.get(c) ?? 0) + (inCat ? 10 : 1)));
    });
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  })();

  const S = STEPS[step];
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* progress rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Step {step + 1} of {STEPS.length}</p>
          <Progress value={pct} className="mx-1 mt-2 w-auto" />
          <ol className="mt-4 space-y-0.5">
            {STEPS.map((s, i) => {
              const done = i < step || (i <= maxStep && i !== step && !Object.values(validate(i)).some(Boolean) && i < maxStep);
              const current = i === step;
              const reachable = i <= maxStep;
              return (
                <li key={s.key}>
                  <button
                    disabled={!reachable}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
                      current ? "bg-brand-50" : reachable ? "hover:bg-subtle" : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-semibold",
                        current ? "border-brand-600 bg-brand-600 text-white" : done ? "border-accent-500 bg-accent-500 text-white" : "border-line-strong bg-white text-ink-4",
                      )}
                    >
                      {done && !current ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block truncate text-[13px] font-medium", current ? "text-brand-800" : "text-ink-2")}>{s.title}</span>
                      {OPTIONAL.has(s.key) && <span className="block text-[11px] text-ink-4">Optional</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 border-t border-line pt-3 text-[11px] text-ink-4">
            {savedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-accent-600" /> Draft saved automatically
              </span>
            ) : (
              "Your progress is saved automatically"
            )}
            {maxStep > 0 && (
              <button onClick={discard} className="mt-2 flex items-center gap-1 font-medium text-ink-3 hover:text-red-600">
                <RotateCcw className="size-3" /> Discard draft
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* mobile progress */}
        <div className="mb-4 rounded-xl border border-line bg-white p-3 shadow-card lg:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">{S.title}</span>
            <span className="text-ink-3">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <Progress value={pct} className="mt-2" />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-6 py-5 sm:px-8">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <S.icon className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">{S.title}</h2>
                  {OPTIONAL.has(S.key) && <Badge>Optional</Badge>}
                </div>
                <p className="text-[13px] text-ink-3">{S.description}</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[380px] overflow-hidden px-6 py-6 sm:px-8">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -28 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {S.key === "org" && (
                  <div className="space-y-5">
                    <Hint>We&apos;ve pre-filled this from your organisation profile. Changes here update your profile.</Hint>
                    <Field label="Organisation name" error={errors.orgName}>
                      <Input value={form.orgName} onChange={(e) => set("orgName", e.target.value)} invalid={!!errors.orgName} />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Organisation type">
                        <Input value={buyer?.type ?? ""} disabled />
                      </Field>
                      <Field label="Primary contact">
                        <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
                      </Field>
                      <Field label="Contact email" error={errors.contactEmail}>
                        <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} invalid={!!errors.contactEmail} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="City">
                          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                        </Field>
                        <Field label="State">
                          <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {S.key === "industry" && (
                  <div className="space-y-4">
                    <Hint>Industry helps Elets prioritise providers with relevant sector experience and case studies.</Hint>
                    <RadioCards
                      value={form.industryId || undefined}
                      onValueChange={(v) => set("industryId", v)}
                      columns={2}
                      options={industries.map((i) => ({ value: i.id, label: i.name, description: i.description, icon: <DynIcon name={i.icon} /> }))}
                    />
                    {errors.industryId && <ErrorText>{errors.industryId}</ErrorText>}
                  </div>
                )}

                {S.key === "category" && (
                  <div className="space-y-4">
                    <Hint>Choose the closest fit — Elets will refine it during review. Adjacent categories are considered automatically when matching.</Hint>
                    <RadioCards
                      value={form.categoryId || undefined}
                      onValueChange={(v) => set("categoryId", v)}
                      columns={3}
                      options={categories.map((c) => ({ value: c.id, label: c.name, description: c.description, icon: <DynIcon name={c.icon} /> }))}
                    />
                    {errors.categoryId && <ErrorText>{errors.categoryId}</ErrorText>}
                  </div>
                )}

                {S.key === "problem" && (
                  <div className="space-y-5">
                    <Field label="Requirement title" error={errors.title} hint="A short summary, e.g. “Telemedicine platform for rural clinics”.">
                      <Input value={form.title} onChange={(e) => set("title", e.target.value)} invalid={!!errors.title} placeholder="What do you need?" maxLength={120} />
                    </Field>
                    <Field
                      label="Describe the problem or business requirement"
                      error={errors.problem}
                      hint="Focus on the problem and outcomes rather than a specific product — this produces better matches."
                    >
                      <Textarea value={form.problem} onChange={(e) => set("problem", e.target.value)} invalid={!!errors.problem} rows={6} placeholder="What isn't working today, who is affected, and what would success look like?" />
                    </Field>
                    <ListEditor label="Key objectives" optional values={form.objectives} onChange={(v) => set("objectives", v)} placeholder="e.g. Single patient record across all sites" />
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <p className="text-[13px] font-medium text-ink-2">Capabilities needed</p>
                        <span className="text-xs text-ink-4">Optional · {form.capabilities.length} selected</span>
                      </div>
                      <p className="mb-2.5 text-xs text-ink-3">Used for functional alignment in matching. {form.categoryId && `Suggestions for ${L.categoryName(form.categoryId)} are shown first.`}</p>
                      <div className="flex flex-wrap gap-2">
                        {capVocab.slice(0, 18).map((c) => (
                          <Chip key={c} selected={form.capabilities.includes(c)} onClick={() => toggleIn("capabilities", c)}>
                            {c}
                          </Chip>
                        ))}
                        {form.capabilities
                          .filter((c) => !capVocab.slice(0, 18).includes(c))
                          .map((c) => (
                            <Chip key={c} selected onClick={() => toggleIn("capabilities", c)}>
                              {c}
                            </Chip>
                          ))}
                      </div>
                      <CustomTag onAdd={(c) => !form.capabilities.includes(c) && set("capabilities", [...form.capabilities, c])} />
                    </div>
                  </div>
                )}

                {S.key === "budget" && (
                  <div className="space-y-4">
                    <Hint>Budget is never shared publicly. It helps match providers whose typical engagement size fits — you can leave it undisclosed.</Hint>
                    <RadioCards
                      value={form.budget}
                      onValueChange={(v) => set("budget", v)}
                      columns={3}
                      options={(Object.keys(BUDGET_LABELS) as BudgetBand[]).map((b) => ({
                        value: b,
                        label: BUDGET_LABELS[b],
                        description: b === "undisclosed" ? "Elets will discuss this with you" : undefined,
                        icon: <IndianRupee />,
                      }))}
                    />
                  </div>
                )}

                {S.key === "timeline" && (
                  <div className="space-y-4">
                    <Hint>An indicative timeline helps Elets sequence introductions and evaluation.</Hint>
                    <RadioCards
                      value={form.timeline || undefined}
                      onValueChange={(v) => set("timeline", v)}
                      columns={2}
                      options={(Object.keys(TIMELINE_LABELS) as Timeline[]).map((t) => ({ value: t, label: TIMELINE_LABELS[t], icon: <CalendarDays /> }))}
                    />
                    <div className="pt-2">
                      <p className="mb-2.5 text-[13px] font-medium text-ink-2">Scale of implementation</p>
                      <RadioCards
                        value={form.scale || undefined}
                        onValueChange={(v) => set("scale", v)}
                        columns={2}
                        options={(Object.keys(SCALE_LABELS) as ProjectScale[]).map((s) => ({ value: s, label: SCALE_LABELS[s] }))}
                      />
                    </div>
                  </div>
                )}

                {S.key === "location" && (
                  <div className="space-y-6">
                    <Field label="Primary location" hint="City, district or “statewide”.">
                      <Input value={form.location} onChange={(e) => set("location", e.target.value)} icon={<MapPin />} />
                    </Field>
                    <div>
                      <p className="mb-2 text-[13px] font-medium text-ink-2">Delivery regions</p>
                      <div className="flex flex-wrap gap-2">
                        {regions.map((r) => (
                          <Chip key={r.id} selected={form.regions.includes(r.id)} onClick={() => toggleIn("regions", r.id)}>
                            {r.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[13px] font-medium text-ink-2">Deployment preference</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(DEPLOYMENT_LABELS) as Deployment[]).map((d) => (
                          <Chip key={d} selected={form.deployment.includes(d)} onClick={() => toggleIn("deployment", d)}>
                            {DEPLOYMENT_LABELS[d]}
                          </Chip>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-ink-3">Select all that are acceptable. Leave blank if you&apos;re open to recommendations.</p>
                    </div>
                  </div>
                )}

                {S.key === "additional" && (
                  <div className="space-y-6">
                    <div>
                      <p className="mb-2 text-[13px] font-medium text-ink-2">Certifications & compliance required</p>
                      <div className="flex flex-wrap gap-2">
                        {COMPLIANCE_OPTIONS.map((c) => (
                          <Chip key={c} selected={form.compliance.includes(c)} onClick={() => toggleIn("compliance", c)}>
                            {c}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <Field label="Additional notes" optional hint="Procurement constraints, integrations, evaluation preferences, etc.">
                      <Textarea value={form.additionalNotes} onChange={(e) => set("additionalNotes", e.target.value)} rows={4} />
                    </Field>
                    <Attachments value={form.attachments} onChange={(v) => set("attachments", v)} />
                  </div>
                )}

                {S.key === "review" && <Review form={form} go={go} L={L} set={set} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle/60 px-6 py-4 sm:px-8">
            <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            <div className="flex items-center gap-2">
              {OPTIONAL.has(S.key) && step < STEPS.length - 1 && (
                <Button variant="ghost" onClick={() => go(step + 1)} className="hidden sm:inline-flex">
                  Skip
                </Button>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={next}>
                  Continue <ArrowRight />
                </Button>
              ) : (
                <Button onClick={submit} size="lg">
                  Submit requirement <Check />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-brand-50/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-brand-800">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-brand-600" />
      <span>{children}</span>
    </p>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-red-600">{children}</p>;
}

function ListEditor({ label, values, onChange, placeholder, optional }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; optional?: boolean }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-ink-2">{label}</p>
        {optional && <span className="text-xs text-ink-4">Optional</span>}
      </div>
      {values.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {values.map((v, i) => (
            <li key={i} className="flex items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2 text-[13px] text-ink-2">
              <span className="grid size-5 place-items-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">{i + 1}</span>
              <span className="flex-1">{v}</span>
              <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-ink-4 hover:text-red-600" aria-label="Remove objective">
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button variant="secondary" onClick={add} disabled={!draft.trim()}>
          <Plus /> Add
        </Button>
      </div>
    </div>
  );
}

function CustomTag({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = React.useState("");
  return (
    <div className="mt-3 flex max-w-md gap-2">
      <Input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) {
            e.preventDefault();
            onAdd(v.trim());
            setV("");
          }
        }}
        placeholder="Add another capability"
        className="h-8 text-[13px]"
      />
      <Button variant="secondary" size="sm" disabled={!v.trim()} onClick={() => { onAdd(v.trim()); setV(""); }}>
        <Plus /> Add
      </Button>
    </div>
  );
}

function Attachments({ value, onChange }: { value: Attachment[]; onChange: (v: Attachment[]) => void }) {
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const now = new Date().toISOString().slice(0, 10);
    const next = Array.from(files).map((f, i) => ({ id: `att-${Date.now()}-${i}`, name: f.name, size: fmtSize(f.size), uploadedAt: now }));
    onChange([...value, ...next]);
    toast.success(`${next.length} file${next.length > 1 ? "s" : ""} attached`);
  };
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-2">Supporting documents</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
          over ? "border-brand-400 bg-brand-50" : "border-line-strong bg-subtle/60 hover:border-brand-300 hover:bg-brand-50/40",
        )}
      >
        <span className="grid size-11 place-items-center rounded-xl bg-white text-brand-600 shadow-card">
          <CloudUpload className="size-5" />
        </span>
        <p className="mt-3 text-[13px] font-medium text-ink">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-ink-3">Existing RFPs, system landscapes, specifications — PDF, DOCX, XLSX</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      </div>
      <p className="mt-2 text-[11px] text-ink-4">Demo mode: file names are recorded but files are not uploaded or stored.</p>
      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 shadow-xs">
              <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{a.name}</span>
                <span className="text-xs text-ink-3">{a.size}</span>
              </span>
              <button onClick={() => onChange(value.filter((x) => x.id !== a.id))} className="grid size-7 place-items-center rounded-md text-ink-4 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${a.name}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewSection({ go, step, title, children }: { go: (i: number) => void; step: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">{title}</p>
        <button onClick={() => go(step)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          <Pencil className="size-3" /> Edit
        </button>
      </div>
      <div className="text-[13px] text-ink-2">{children}</div>
    </div>
  );
}

function Review({ form, go, L, set }: { form: Form; go: (i: number) => void; L: ReturnType<typeof useLookups>; set: <K extends keyof Form>(k: K, v: Form[K]) => void }) {
  const none = <span className="text-ink-4">Not specified</span>;
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-subtle p-4 ring-1 ring-inset ring-line">
        <p className="text-base font-semibold tracking-tight text-ink">{form.title || "Untitled requirement"}</p>
        <p className="mt-1 text-[13px] text-ink-3">
          {L.industryName(form.industryId)} · {L.categoryName(form.categoryId)}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewSection go={go} step={0} title="Organisation">
          <p className="font-medium text-ink">{form.orgName}</p>
          <p className="text-xs text-ink-3">
            {form.contactName} · {form.contactEmail}
          </p>
        </ReviewSection>
        <ReviewSection go={go} step={4} title="Budget & timeline">
          <p>{BUDGET_LABELS[form.budget]}</p>
          <p className="text-xs text-ink-3">
            {form.timeline ? TIMELINE_LABELS[form.timeline] : "Timeline not specified"} · {form.scale ? SCALE_LABELS[form.scale] : "Scale not specified"}
          </p>
        </ReviewSection>
      </div>
      <ReviewSection go={go} step={3} title="Business requirement">
        <p className="whitespace-pre-line leading-relaxed">{form.problem || none}</p>
        {form.objectives.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-ink-3">
            {form.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        )}
        {form.capabilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {form.capabilities.map((c) => (
              <Badge key={c} tone="blue">{c}</Badge>
            ))}
          </div>
        )}
      </ReviewSection>
      <div className="grid gap-3 md:grid-cols-2">
        <ReviewSection go={go} step={6} title="Location & deployment">
          <p>{form.location || none}</p>
          <p className="text-xs text-ink-3">
            {form.regions.length ? form.regions.map(L.regionName).join(", ") : "Any region"} · {form.deployment.length ? form.deployment.map((d) => DEPLOYMENT_LABELS[d]).join(", ") : "Open to recommendation"}
          </p>
        </ReviewSection>
        <ReviewSection go={go} step={7} title="Compliance & documents">
          <p>{form.compliance.length ? form.compliance.join(", ") : "No specific certifications"}</p>
          <p className="text-xs text-ink-3">{form.attachments.length} document{form.attachments.length === 1 ? "" : "s"} attached</p>
        </ReviewSection>
      </div>
      <label className={cn("flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition", form.proRequested ? "border-accent-400 bg-accent-50/60 ring-4 ring-accent-100" : "border-line hover:border-line-strong")}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-accent-300">
          <Sparkles className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-ink">Request Elets Pro managed support</span>
          <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">
            A dedicated relationship manager runs requirement discovery, vendor shortlisting, due diligence, RFP support and evaluation with you.
          </span>
        </span>
        <Switch checked={form.proRequested} onCheckedChange={(v) => set("proRequested", v)} aria-label="Request Elets Pro" />
      </label>
    </div>
  );
}

function SuccessScreen({ id, code, pro, onAnother }: { id: string; code: string; pro: boolean; onAnother: () => void }) {
  const steps = [
    { t: "Review & structuring", d: "An Elets relationship manager reviews your requirement and may contact you to clarify scope." },
    { t: "Matching", d: "Eligible providers are scored across eight explainable dimensions, then reviewed by Elets." },
    { t: "Recommendations & introductions", d: "You'll see recommended providers, shortlist them and request introductions." },
  ];
  return (
    <div className="mx-auto max-w-2xl animate-slide-up">
      <Card className="overflow-hidden">
        <div className="relative overflow-hidden bg-navy-950 px-8 py-10 text-center text-white">
          <div className="grid-bg-dark absolute inset-0" />
          <div className="absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-accent-500/25 blur-3xl" />
          <div className="relative">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-500 text-white shadow-glow">
              <Check className="size-7" strokeWidth={3} />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">Requirement submitted</h2>
            <p className="mt-1.5 text-sm text-navy-200">
              Reference <span className="font-mono font-semibold text-white">{code}</span>
              {pro && " · Elets Pro support requested"}
            </p>
          </div>
        </div>
        <div className="px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-4">What happens next</p>
          <ol className="mt-3 space-y-4">
            {steps.map((s, i) => (
              <li key={s.t} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{i + 1}</span>
                <span>
                  <span className="block text-[13px] font-semibold text-ink">{s.t}</span>
                  <span className="block text-[13px] text-ink-3">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/buyer/requirements/${id}`}>
                View requirement <ArrowRight />
              </Link>
            </Button>
            <Button variant="secondary" onClick={onAnother}>
              <Plus /> Post another
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/buyer">Go to dashboard</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
