"use client";

import * as React from "react";
import { BookOpen, Check, Package, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uid, useStore } from "@/lib/store";
import { useLookups } from "@/lib/hooks";
import type { CaseStudy, Deployment, Solution } from "@/lib/types";
import { DEPLOYMENT_LABELS } from "@/lib/data/taxonomy";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Chip, Switch } from "@/components/ui/controls";
import { Modal, Sheet, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { TagInput, useCurrentProvider } from "./common";

export function ProviderSolutions() {
  const provider = useCurrentProvider();
  const L = useLookups();
  const serviceCategories = useStore((s) => s.serviceCategories.filter((c) => c.active));
  const upsertSolution = useStore((s) => s.upsertSolution);
  const removeSolution = useStore((s) => s.removeSolution);
  const upsertCase = useStore((s) => s.upsertCaseStudy);
  const removeCase = useStore((s) => s.removeCaseStudy);
  const updateProvider = useStore((s) => s.updateProvider);
  const [tab, setTab] = React.useState("solutions");
  const [editSol, setEditSol] = React.useState<Solution | null>(null);
  const [editCase, setEditCase] = React.useState<CaseStudy | null>(null);
  const [confirm, setConfirm] = React.useState<{ kind: "solution" | "case"; id: string; name: string } | null>(null);

  if (!provider) return <EmptyState icon={<Package />} title="Company profile not found" />;

  const newSolution = (): Solution => ({ id: uid("s"), name: "", categoryId: provider.categories[0] ?? "cloud", summary: "", deployment: ["cloud"], highlights: [] });
  const newCase = (): CaseStudy => ({ id: uid("c"), title: "", industryId: provider.industries[0] ?? "gov", categoryId: provider.categories[0] ?? "cloud", summary: "", outcome: "", year: 2026 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solutions & services"
        description="Products, service lines and case studies buyers see on your profile. Case studies also strengthen your implementation-experience match score."
        actions={
          tab === "solutions" ? (
            <Button onClick={() => setEditSol(newSolution())}>
              <Plus /> Add solution
            </Button>
          ) : tab === "cases" ? (
            <Button onClick={() => setEditCase(newCase())}>
              <Plus /> Add case study
            </Button>
          ) : undefined
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="solutions" count={provider.solutions.length}>
            <Package /> Solutions
          </TabsTrigger>
          <TabsTrigger value="services" count={provider.services.length}>
            <Wrench /> Services
          </TabsTrigger>
          <TabsTrigger value="cases" count={provider.caseStudies.length}>
            <BookOpen /> Case studies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solutions" className="pt-5">
          {provider.solutions.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Package />}
                title="No solutions listed"
                description="Add the products or platforms you offer so buyers can discover them in search."
                action={
                  <Button onClick={() => setEditSol(newSolution())}>
                    <Plus /> Add your first solution
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {provider.solutions.map((s) => (
                <Card key={s.id} className="flex flex-col p-5 transition hover:border-line-strong hover:shadow-raised">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <DynIcon name={L.category(s.categoryId)?.icon ?? "Layers"} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold tracking-tight text-ink">{s.name}</p>
                      <p className="text-xs text-ink-3">{L.categoryName(s.categoryId)}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-ink-2">{s.summary}</p>
                  {s.highlights.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {s.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-ink-2">
                          <Check className="size-3.5 text-accent-600" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.deployment.map((d) => (
                      <Badge key={d} tone="neutral">
                        {DEPLOYMENT_LABELS[d]}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-line pt-3">
                    <Button variant="ghost" size="xs" onClick={() => setEditSol(s)}>
                      <Pencil /> Edit
                    </Button>
                    <Button variant="danger-ghost" size="xs" className="ml-auto" onClick={() => setConfirm({ kind: "solution", id: s.id, name: s.name })}>
                      <Trash2 /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
              <button
                onClick={() => setEditSol(newSolution())}
                className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong text-ink-3 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
              >
                <Plus className="size-5" />
                <span className="mt-2 text-[13px] font-medium">Add another solution</span>
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="pt-5">
          <Card className="divide-y divide-line">
            {serviceCategories.map((sc) => {
              const on = provider.services.includes(sc.id);
              return (
                <label key={sc.id} className="flex cursor-pointer items-center gap-4 px-5 py-4 transition hover:bg-subtle/60">
                  <span className={cn("grid size-9 place-items-center rounded-lg", on ? "bg-accent-50 text-accent-600" : "bg-navy-50 text-ink-4")}>
                    <Wrench className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-ink">{sc.name}</p>
                    <p className="text-xs text-ink-3">{on ? "Offered — shown on your profile" : "Not offered"}</p>
                  </div>
                  <Switch
                    checked={on}
                    aria-label={sc.name}
                    onCheckedChange={(v) => {
                      updateProvider(provider.id, { services: v ? [...provider.services, sc.id] : provider.services.filter((x) => x !== sc.id) });
                      toast.success(v ? `${sc.name} added` : `${sc.name} removed`);
                    }}
                  />
                </label>
              );
            })}
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="pt-5">
          {provider.caseStudies.length === 0 ? (
            <Card>
              <EmptyState
                icon={<BookOpen />}
                title="No case studies yet"
                description="Case studies are the strongest evidence for buyers and improve your implementation-experience score."
                action={
                  <Button onClick={() => setEditCase(newCase())}>
                    <Plus /> Add case study
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {provider.caseStudies.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="teal">{L.industryName(c.industryId)}</Badge>
                    <Badge tone="neutral">{L.categoryName(c.categoryId)}</Badge>
                    <span className="ml-auto text-xs text-ink-4">{c.year}</span>
                  </div>
                  <p className="mt-3 text-[15px] font-semibold tracking-tight text-ink">{c.title}</p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{c.summary}</p>
                  {c.outcome && (
                    <p className="mt-3 rounded-lg border border-accent-100 bg-accent-50/60 px-3 py-2 text-xs text-accent-700">
                      <span className="font-semibold">Outcome: </span>
                      {c.outcome}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2 border-t border-line pt-3">
                    <Button variant="ghost" size="xs" onClick={() => setEditCase(c)}>
                      <Pencil /> Edit
                    </Button>
                    <Button variant="danger-ghost" size="xs" className="ml-auto" onClick={() => setConfirm({ kind: "case", id: c.id, name: c.title })}>
                      <Trash2 /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editSol && (
        <SolutionSheet
          initial={editSol}
          isNew={!provider.solutions.some((s) => s.id === editSol.id)}
          onClose={() => setEditSol(null)}
          onSave={(s) => {
            upsertSolution(provider.id, s);
            toast.success("Solution saved", { description: s.name });
          }}
        />
      )}
      {editCase && (
        <CaseSheet
          initial={editCase}
          isNew={!provider.caseStudies.some((c) => c.id === editCase.id)}
          onClose={() => setEditCase(null)}
          onSave={(c) => {
            upsertCase(provider.id, c);
            toast.success("Case study saved", { description: c.title });
          }}
        />
      )}
      <Modal
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`Delete ${confirm?.kind === "case" ? "case study" : "solution"}?`}
        description={`“${confirm?.name}” will be removed from your public profile. This cannot be undone.`}
        icon={<Trash2 />}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!confirm) return;
                if (confirm.kind === "solution") removeSolution(provider.id, confirm.id);
                else removeCase(provider.id, confirm.id);
                toast.success("Deleted", { description: confirm.name });
                setConfirm(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function SolutionSheet({ initial, isNew, onClose, onSave }: { initial: Solution; isNew: boolean; onClose: () => void; onSave: (s: Solution) => void }) {
  const categories = useStore((s) => s.categories.filter((c) => c.active));
  const [s, setS] = React.useState(initial);
  const [err, setErr] = React.useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (!s.name.trim()) e.name = "Name is required";
    if (s.summary.trim().length < 20) e.summary = "Add a summary of at least 20 characters";
    if (!s.deployment.length) e.deployment = "Choose at least one deployment option";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ ...s, name: s.name.trim(), summary: s.summary.trim() });
    onClose();
  };
  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Add solution" : "Edit solution"}
      description="Solutions appear on your profile and in marketplace search."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isNew ? "Add solution" : "Save changes"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Solution name" error={err.name}>
          <Input value={s.name} onChange={(x) => setS({ ...s, name: x.target.value })} invalid={!!err.name} placeholder="e.g. GovCloud Landing Zone" />
        </Field>
        <Field label="Technology category">
          <Select value={s.categoryId} onValueChange={(v) => setS({ ...s, categoryId: v })} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Summary" error={err.summary}>
          <Textarea rows={4} value={s.summary} onChange={(x) => setS({ ...s, summary: x.target.value })} invalid={!!err.summary} />
        </Field>
        <Field label="Deployment options" error={err.deployment}>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DEPLOYMENT_LABELS) as Deployment[]).map((k) => (
              <Chip key={k} selected={s.deployment.includes(k)} onClick={() => setS({ ...s, deployment: s.deployment.includes(k) ? s.deployment.filter((x) => x !== k) : [...s.deployment, k] })}>
                {DEPLOYMENT_LABELS[k]}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Highlights" optional hint="Up to five short feature highlights">
          <TagInput value={s.highlights} onChange={(v) => setS({ ...s, highlights: v.slice(0, 5) })} placeholder="e.g. Audit-ready logging" />
        </Field>
      </div>
    </Sheet>
  );
}

function CaseSheet({ initial, isNew, onClose, onSave }: { initial: CaseStudy; isNew: boolean; onClose: () => void; onSave: (c: CaseStudy) => void }) {
  const industries = useStore((s) => s.industries);
  const categories = useStore((s) => s.categories);
  const [c, setC] = React.useState(initial);
  const [err, setErr] = React.useState<Record<string, string>>({});
  const save = () => {
    const e: Record<string, string> = {};
    if (!c.title.trim()) e.title = "Title is required";
    if (c.summary.trim().length < 20) e.summary = "Describe the project in at least 20 characters";
    if (!c.year || c.year < 2000 || c.year > 2026) e.year = "Enter a year between 2000 and 2026";
    setErr(e);
    if (Object.keys(e).length) return;
    onSave(c);
    onClose();
  };
  return (
    <Sheet
      open
      onOpenChange={(v) => !v && onClose()}
      title={isNew ? "Add case study" : "Edit case study"}
      description="Describe the client sector, what you delivered and the outcome. Do not include confidential client names without consent."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isNew ? "Add case study" : "Save changes"}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Title" error={err.title}>
          <Input value={c.title} onChange={(x) => setC({ ...c, title: x.target.value })} invalid={!!err.title} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Industry" className="sm:col-span-1">
            <Select value={c.industryId} onValueChange={(v) => setC({ ...c, industryId: v })} options={industries.map((x) => ({ value: x.id, label: x.name }))} />
          </Field>
          <Field label="Category" className="sm:col-span-1">
            <Select value={c.categoryId} onValueChange={(v) => setC({ ...c, categoryId: v })} options={categories.map((x) => ({ value: x.id, label: x.name }))} />
          </Field>
          <Field label="Year" error={err.year}>
            <Input type="number" value={c.year} onChange={(x) => setC({ ...c, year: Number(x.target.value) })} invalid={!!err.year} />
          </Field>
        </div>
        <Field label="Summary" error={err.summary}>
          <Textarea rows={4} value={c.summary} onChange={(x) => setC({ ...c, summary: x.target.value })} invalid={!!err.summary} />
        </Field>
        <Field label="Outcome" optional hint="Qualitative outcomes are preferred over unverified figures">
          <Textarea rows={2} className="min-h-16" value={c.outcome} onChange={(x) => setC({ ...c, outcome: x.target.value })} />
        </Field>
      </div>
    </Sheet>
  );
}
