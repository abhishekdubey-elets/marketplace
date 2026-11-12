"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Eye, Megaphone, Pencil, Plus, RotateCcw, Save, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import type { Announcement, SiteContent, PricingContent, PricingPlan } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, ProviderLogo, SectionLabel } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip, Switch } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { DynIcon } from "@/components/ui/icon";
import { LogoMark } from "@/components/brand";
import { pricingOf } from "@/lib/pricing";

const SECTION_LABELS: Record<string, string> = {
  ecosystem: "Trusted industry ecosystem",
  howItWorks: "How the marketplace works",
  categories: "Explore technology categories",
  providers: "Discover verified providers",
  postRequirement: "Post your technology requirement",
  pro: "Introducing Elets Pro",
  whyElets: "Why choose Elets",
  verticals: "Industry verticals",
};

export function ContentManager() {
  const user = useUser();
  const content = useStore((s) => s.content);
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const announcements = useStore((s) => s.announcements);
  const updateContent = useStore((s) => s.updateContent);
  const upsertAnnouncement = useStore((s) => s.upsertAnnouncement);
  const [d, setD] = React.useState<SiteContent>(content);
  const [annEdit, setAnnEdit] = React.useState<Partial<Announcement> | null>(null);
  React.useEffect(() => setD(content), [content]);
  const dirty = JSON.stringify(d) !== JSON.stringify(content);

  const featuredProviders = d.featuredProviderIds.map((id) => providers.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const addable = providers.filter((p) => !d.featuredProviderIds.includes(p.id) && p.accountStatus === "active");
  const moveProvider = (i: number, dir: -1 | 1) => {
    const arr = [...d.featuredProviderIds];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setD({ ...d, featuredProviderIds: arr });
  };

  return (
    <div>
      <PageHeader
        title="Content"
        description="Manage homepage sections, featured providers and categories, Elets Pro messaging and announcements."
        actions={
          <>
            <Button variant="secondary" asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <Eye /> View site
              </a>
            </Button>
            <Button variant="secondary" disabled={!dirty} onClick={() => setD(content)}>
              <RotateCcw /> Discard
            </Button>
            <Button
              disabled={!dirty}
              onClick={() => {
                if (!d.heroHeadline.trim()) return toast.error("Hero headline cannot be empty");
                // drop blank "what's included" lines before saving
                const next = d.pricing ? { ...d, pricing: { ...d.pricing, plans: d.pricing.plans.map((p) => ({ ...p, features: p.features.map((x) => x.trim()).filter(Boolean) })) } } : d;
                const patch = Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(content[k as keyof SiteContent]))) as Partial<SiteContent>;
                updateContent(patch, user.id);
                toast.success("Content published", { description: "Changes are live on the public site." });
              }}
            >
              <Save /> Publish changes
            </Button>
          </>
        }
      />
      {dirty && <p className="-mt-3 mb-4 text-xs font-medium text-amber-700">You have unpublished changes.</p>}

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Tabs defaultValue="home">
          <TabsList className="mb-5">
            <TabsTrigger value="home">Homepage</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="pro">Elets Pro</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="ann" count={announcements.filter((a) => a.active).length}>
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-5">
            <Card>
              <CardHeader title="Hero" description="The first thing visitors read" />
              <CardContent className="space-y-4">
                <Field label="Headline" hint={`${d.heroHeadline.length}/90 characters`}>
                  <Input value={d.heroHeadline} maxLength={90} onChange={(e) => setD({ ...d, heroHeadline: e.target.value })} />
                </Field>
                <Field label="Supporting text" hint={`${d.heroSubtext.length}/240 characters`}>
                  <Textarea value={d.heroSubtext} maxLength={240} rows={3} onChange={(e) => setD({ ...d, heroSubtext: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Homepage sections" description="Toggle sections on or off" />
              <ul className="divide-y divide-line border-t border-line">
                {Object.keys(SECTION_LABELS).map((k) => (
                  <li key={k} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="text-[13px] text-ink">{SECTION_LABELS[k]}</span>
                    <Switch checked={d.sections[k] !== false} onCheckedChange={(v) => setD({ ...d, sections: { ...d.sections, [k]: v } })} aria-label={SECTION_LABELS[k]} />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="featured" className="space-y-5">
            <Card>
              <CardHeader title="Featured providers" description="Editorial selection for the homepage. Independent of paid listings and of match ranking." />
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    key={d.featuredProviderIds.join(",")}
                    placeholder="Add a provider…"
                    value={undefined}
                    onValueChange={(v) => setD({ ...d, featuredProviderIds: [...d.featuredProviderIds, v] })}
                    options={addable.map((p) => ({ value: p.id, label: `${p.name}${p.verification === "verified" ? "" : " (not verified)"}` }))}
                  />
                </div>
                {featuredProviders.length === 0 ? (
                  <EmptyState compact icon={<Sparkles />} title="No featured providers" description="Add providers to highlight them on the homepage." />
                ) : (
                  <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                    {featuredProviders.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="w-5 text-center text-xs tabular-nums text-ink-4">{i + 1}</span>
                        <ProviderLogo provider={p} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{p.name}</span>
                        {p.verification !== "verified" && <Badge tone="amber">Not verified</Badge>}
                        <Button size="icon-xs" variant="ghost" disabled={i === 0} onClick={() => moveProvider(i, -1)} aria-label="Move up">
                          <ArrowUp />
                        </Button>
                        <Button size="icon-xs" variant="ghost" disabled={i === featuredProviders.length - 1} onClick={() => moveProvider(i, 1)} aria-label="Move down">
                          <ArrowDown />
                        </Button>
                        <Button size="icon-xs" variant="ghost" onClick={() => setD({ ...d, featuredProviderIds: d.featuredProviderIds.filter((x) => x !== p.id) })} aria-label={`Remove ${p.name}`}>
                          <X />
                        </Button>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Featured categories" description="Shown in the category explorer, in the order selected" />
              <CardContent className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.active)
                  .map((c) => {
                    const idx = d.featuredCategoryIds.indexOf(c.id);
                    return (
                      <Chip
                        key={c.id}
                        selected={idx >= 0}
                        onClick={() => setD({ ...d, featuredCategoryIds: idx >= 0 ? d.featuredCategoryIds.filter((x) => x !== c.id) : [...d.featuredCategoryIds, c.id] })}
                      >
                        {c.name}
                        {idx >= 0 && <span className="ml-0.5 rounded bg-brand-100 px-1 text-[10px] tabular-nums">{idx + 1}</span>}
                      </Chip>
                    );
                  })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pro">
            <Card>
              <CardHeader title="Elets Pro messaging" description="Used on the homepage Pro section and the Elets Pro page" />
              <CardContent className="space-y-4">
                <Field label="Headline">
                  <Input value={d.proHeadline} onChange={(e) => setD({ ...d, proHeadline: e.target.value })} />
                </Field>
                <Field label="Supporting text">
                  <Textarea value={d.proSubtext} rows={3} onChange={(e) => setD({ ...d, proSubtext: e.target.value })} />
                </Field>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-5">
            <PricingEditor value={pricingOf(d)} onChange={(pricing) => setD({ ...d, pricing })} />
          </TabsContent>

          <TabsContent value="ann">
            <Card>
              <CardHeader
                title="Announcements"
                description="Shown to buyers, providers or everyone. Changes save immediately."
                icon={<Megaphone />}
                action={
                  <Button size="sm" onClick={() => setAnnEdit({ audience: "all", active: true })}>
                    <Plus /> New announcement
                  </Button>
                }
              />
              <ul className="divide-y divide-line border-t border-line">
                {announcements.length === 0 && <EmptyState compact icon={<Megaphone />} title="No announcements" />}
                {announcements.map((a) => (
                  <li key={a.id} className={cn("flex items-start gap-3 px-5 py-3.5", !a.active && "opacity-60")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium text-ink">{a.title}</p>
                        <Badge tone="neutral">{a.audience === "all" ? "Everyone" : a.audience === "admin" ? "Operations" : a.audience[0].toUpperCase() + a.audience.slice(1) + "s"}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{a.body}</p>
                      <p className="mt-1 text-[11px] text-ink-4">{formatDate(a.at)}</p>
                    </div>
                    <Button size="icon-sm" variant="ghost" onClick={() => setAnnEdit(a)} aria-label="Edit announcement">
                      <Pencil />
                    </Button>
                    <Switch
                      checked={a.active}
                      aria-label="Announcement active"
                      onCheckedChange={(v) => {
                        upsertAnnouncement({ ...a, active: v }, user.id);
                        toast.success(v ? "Announcement published" : "Announcement hidden");
                      }}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        </Tabs>

        {/* live preview */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <SectionLabel className="mb-2">Live preview</SectionLabel>
          <div className="overflow-hidden rounded-2xl border border-line bg-navy-950 shadow-raised">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="ml-2 truncate rounded bg-white/5 px-2 py-0.5 text-[10px] text-navy-300">elets marketplace · home</span>
            </div>
            <div className="relative p-5">
              <div className="grid-bg-dark absolute inset-0" />
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-brand-600/40 blur-3xl" />
              <div className="relative">
                <LogoMark size={26} variant="plain" inverted />
                <p className="mt-4 text-lg font-semibold leading-snug tracking-tight text-white text-balance">{d.heroHeadline || "Headline"}</p>
                <p className="mt-2 text-xs leading-relaxed text-navy-200">{d.heroSubtext}</p>
                <div className="mt-4 flex gap-2">
                  <span className="rounded-md bg-brand-600 px-2.5 py-1 text-[10px] font-medium text-white">Explore Solutions</span>
                  <span className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-medium text-white">List Your Company</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 bg-white p-4">
              {d.sections.categories !== false && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-4">Categories</p>
                  <div className="flex flex-wrap gap-1">
                    {d.featuredCategoryIds.slice(0, 6).map((id) => {
                      const c = categories.find((x) => x.id === id);
                      return c ? (
                        <span key={id} className="inline-flex items-center gap-1 rounded-md bg-subtle px-1.5 py-0.5 text-[10px] text-ink-2 ring-1 ring-line">
                          <DynIcon name={c.icon} className="size-3" /> {c.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {d.sections.providers !== false && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-4">Featured providers</p>
                  <div className="flex -space-x-1.5">
                    {featuredProviders.slice(0, 8).map((p) => (
                      <ProviderLogo key={p.id} provider={p} size="sm" className="ring-2 ring-white" />
                    ))}
                  </div>
                </div>
              )}
              {d.sections.pro !== false && (
                <div className="rounded-lg bg-navy-900 p-3">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-flame-300">
                    <Sparkles className="size-3" /> Elets Pro
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-white">{d.proHeadline}</p>
                </div>
              )}
              <p className="text-[10px] text-ink-4">{Object.values(d.sections).filter((v) => v !== false).length} of {Object.keys(SECTION_LABELS).length} sections visible</p>
            </div>
          </div>
        </div>
      </div>

      <AnnouncementModal
        value={annEdit}
        onClose={() => setAnnEdit(null)}
        onSave={(a) => {
          upsertAnnouncement(a, user.id);
          toast.success(annEdit?.id ? "Announcement updated" : "Announcement published");
        }}
      />
    </div>
  );
}

function AnnouncementModal({ value, onClose, onSave }: { value: Partial<Announcement> | null; onClose: () => void; onSave: (a: Announcement) => void }) {
  const [a, setA] = React.useState<Partial<Announcement>>({});
  const [err, setErr] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setA(value ?? {});
    setErr({});
  }, [value]);
  return (
    <Modal
      open={!!value}
      onOpenChange={(v) => !v && onClose()}
      title={a.id ? "Edit announcement" : "New announcement"}
      icon={<Megaphone />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const e: Record<string, string> = {};
              if (!a.title?.trim()) e.title = "Title is required";
              if (!a.body?.trim()) e.body = "Message is required";
              setErr(e);
              if (Object.keys(e).length) return;
              onSave({ id: a.id ?? `an-${Date.now().toString(36)}`, title: a.title!.trim(), body: a.body!.trim(), audience: a.audience ?? "all", active: a.active ?? true, at: a.at ?? new Date().toISOString().slice(0, 10) });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" error={err.title}>
          <Input value={a.title ?? ""} onChange={(e) => setA({ ...a, title: e.target.value })} invalid={!!err.title} />
        </Field>
        <Field label="Message" error={err.body}>
          <Textarea value={a.body ?? ""} onChange={(e) => setA({ ...a, body: e.target.value })} rows={3} invalid={!!err.body} />
        </Field>
        <Field label="Audience">
          <Select
            value={a.audience ?? "all"}
            onValueChange={(v) => setA({ ...a, audience: v as Announcement["audience"] })}
            options={[
              { value: "all", label: "Everyone" },
              { value: "buyer", label: "Buyers" },
              { value: "provider", label: "Providers" },
              { value: "admin", label: "Operations team" },
            ]}
          />
        </Field>
      </div>
    </Modal>
  );
}

/** Pricing page editor: copy, prices and plan details. Saved with "Publish changes". */
function PricingEditor({ value, onChange }: { value: PricingContent; onChange: (v: PricingContent) => void }) {
  const setPlan = (id: string, patch: Partial<PricingPlan>) => onChange({ ...value, plans: value.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const GROUP_LABEL: Record<PricingPlan["group"], string> = { buyers: "For organisations", pro: "For organisations", providers: "For technology providers" };
  return (
    <>
      <Card>
        <CardHeader
          title="Pricing page"
          description="Shown at /pricing. Leave a price blank to show “Contact us”."
          action={
            <Button size="sm" variant="secondary" asChild>
              <a href="/pricing" target="_blank" rel="noreferrer">
                <Eye /> View page
              </a>
            </Button>
          }
        />
        <CardContent className="space-y-4">
          <Field label="Headline">
            <Input value={value.headline} onChange={(e) => onChange({ ...value, headline: e.target.value })} />
          </Field>
          <Field label="Supporting text">
            <Textarea value={value.subtext} rows={3} onChange={(e) => onChange({ ...value, subtext: e.target.value })} />
          </Field>
          <Field label="Note under provider plans" optional>
            <Textarea value={value.note} rows={2} onChange={(e) => onChange({ ...value, note: e.target.value })} />
          </Field>
        </CardContent>
      </Card>
      {value.plans.map((p) => (
        <Card key={p.id}>
          <CardHeader
            title={p.name || "Untitled plan"}
            description={GROUP_LABEL[p.group]}
            action={
              <label className="flex items-center gap-2 text-xs text-ink-3">
                Highlight
                <Switch checked={!!p.highlight} onCheckedChange={(v) => setPlan(p.id, { highlight: v })} aria-label={`Highlight ${p.name}`} />
              </label>
            }
          />
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Plan name">
              <Input value={p.name} onChange={(e) => setPlan(p.id, { name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" hint="e.g. Free, ₹25,000">
                <Input value={p.price} placeholder="Contact us" onChange={(e) => setPlan(p.id, { price: e.target.value })} />
              </Field>
              <Field label="Period" optional hint="e.g. per year">
                <Input value={p.period} onChange={(e) => setPlan(p.id, { period: e.target.value })} />
              </Field>
            </div>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={p.description} rows={2} onChange={(e) => setPlan(p.id, { description: e.target.value })} />
            </Field>
            <Field label="What's included" hint="One item per line" className="sm:col-span-2">
              <Textarea value={p.features.join("\n")} rows={Math.max(3, p.features.length)} onChange={(e) => setPlan(p.id, { features: e.target.value.split("\n") })} />
            </Field>
            <Field label="Button label">
              <Input value={p.ctaLabel} onChange={(e) => setPlan(p.id, { ctaLabel: e.target.value })} />
            </Field>
            <Field label="Button link" hint="A page like /signup, or mailto:, tel:, https://">
              <Input value={p.ctaHref} onChange={(e) => setPlan(p.id, { ctaHref: e.target.value })} />
            </Field>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
