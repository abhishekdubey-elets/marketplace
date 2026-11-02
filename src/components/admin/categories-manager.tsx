"use client";

import * as React from "react";
import { Globe2, Layers, Pencil, Plus, Star, Tags } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import type { Industry, Region, ServiceCategory, TechCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip, Switch } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { DynIcon, ICON_NAMES } from "@/components/ui/icon";

type Kind = "category" | "industry" | "service" | "region";
type Editing = { kind: Kind; item: Partial<TechCategory & Industry & ServiceCategory & Region> & { id?: string } } | null;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function CategoriesManager() {
  const user = useUser();
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const services = useStore((s) => s.serviceCategories);
  const regions = useStore((s) => s.regions);
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const upsertCategory = useStore((s) => s.upsertCategory);
  const upsertIndustry = useStore((s) => s.upsertIndustry);
  const upsertService = useStore((s) => s.upsertServiceCategory);
  const upsertRegion = useStore((s) => s.upsertRegion);
  const [editing, setEditing] = React.useState<Editing>(null);

  const toggle = (kind: Kind, id: string, active: boolean) => {
    if (kind === "category") upsertCategory({ ...categories.find((c) => c.id === id)!, active }, user.id);
    if (kind === "industry") upsertIndustry({ ...industries.find((c) => c.id === id)!, active }, user.id);
    if (kind === "service") upsertService({ ...services.find((c) => c.id === id)!, active }, user.id);
    if (kind === "region") upsertRegion({ ...regions.find((c) => c.id === id)!, active }, user.id);
    toast.success(active ? "Activated" : "Deactivated", { description: "Discovery and forms update immediately." });
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Configure the taxonomy used across discovery, requirement forms, provider onboarding and matching. Inactive items are hidden from buyers and providers."
      />
      <Tabs defaultValue="tech">
        <TabsList className="mb-5">
          <TabsTrigger value="tech" count={categories.length}>
            Technology categories
          </TabsTrigger>
          <TabsTrigger value="industries" count={industries.length}>
            Industries
          </TabsTrigger>
          <TabsTrigger value="services" count={services.length}>
            Service categories
          </TabsTrigger>
          <TabsTrigger value="regions" count={regions.length}>
            Geographic coverage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tech">
          <ListCard
            onAdd={() => setEditing({ kind: "category", item: { icon: "Layers", featured: false, active: true, related: [] } })}
            addLabel="Add category"
            rows={categories.map((c) => ({
              id: c.id,
              icon: c.icon,
              name: c.name,
              sub: c.description,
              active: c.active,
              meta: (
                <>
                  {c.featured && (
                    <Badge tone="blue">
                      <Star /> Featured
                    </Badge>
                  )}
                  <span className="text-xs text-ink-3">{providers.filter((p) => p.categories.includes(c.id)).length} providers</span>
                  <span className="hidden text-xs text-ink-3 sm:inline">· {requirements.filter((r) => r.categoryId === c.id).length} requirements</span>
                </>
              ),
              onEdit: () => setEditing({ kind: "category", item: c }),
              onToggle: (v: boolean) => toggle("category", c.id, v),
            }))}
          />
        </TabsContent>
        <TabsContent value="industries">
          <ListCard
            onAdd={() => setEditing({ kind: "industry", item: { icon: "Building2", active: true } })}
            addLabel="Add industry"
            rows={industries.map((c) => ({
              id: c.id,
              icon: c.icon,
              name: c.name,
              sub: c.description,
              active: c.active,
              meta: <span className="text-xs text-ink-3">{providers.filter((p) => p.industries.includes(c.id)).length} providers</span>,
              onEdit: () => setEditing({ kind: "industry", item: c }),
              onToggle: (v: boolean) => toggle("industry", c.id, v),
            }))}
          />
        </TabsContent>
        <TabsContent value="services">
          <ListCard
            onAdd={() => setEditing({ kind: "service", item: { active: true } })}
            addLabel="Add service category"
            rows={services.map((c) => ({
              id: c.id,
              icon: "Layers",
              name: c.name,
              active: c.active,
              meta: <span className="text-xs text-ink-3">{providers.filter((p) => p.services.includes(c.id)).length} providers</span>,
              onEdit: () => setEditing({ kind: "service", item: c }),
              onToggle: (v: boolean) => toggle("service", c.id, v),
            }))}
          />
        </TabsContent>
        <TabsContent value="regions">
          <ListCard
            onAdd={() => setEditing({ kind: "region", item: { active: true } })}
            addLabel="Add region"
            iconOverride={<Globe2 className="size-4" />}
            rows={regions.map((c) => ({
              id: c.id,
              icon: "Layers",
              name: c.name,
              active: c.active,
              meta: <span className="text-xs text-ink-3">{providers.filter((p) => p.regions.includes(c.id)).length} providers</span>,
              onEdit: () => setEditing({ kind: "region", item: c }),
              onToggle: (v: boolean) => toggle("region", c.id, v),
            }))}
          />
        </TabsContent>
      </Tabs>

      <EditModal
        editing={editing}
        onClose={() => setEditing(null)}
        categories={categories}
        onSave={(kind, item) => {
          const exists = !!item.id;
          const id = item.id || slugify(item.name ?? "") || `item-${Date.now()}`;
          if (kind === "category") upsertCategory({ id, slug: item.slug || slugify(item.name!), name: item.name!, icon: item.icon || "Layers", description: item.description ?? "", featured: !!item.featured, active: item.active ?? true, related: item.related ?? [] }, user.id);
          if (kind === "industry") upsertIndustry({ id, name: item.name!, icon: item.icon || "Building2", description: item.description ?? "", active: item.active ?? true }, user.id);
          if (kind === "service") upsertService({ id, name: item.name!, active: item.active ?? true }, user.id);
          if (kind === "region") upsertRegion({ id, name: item.name!, active: item.active ?? true }, user.id);
          toast.success(exists ? "Changes saved" : "Created", { description: item.name });
        }}
      />
    </div>
  );
}

function ListCard({
  rows,
  onAdd,
  addLabel,
  iconOverride,
}: {
  rows: { id: string; icon: string; name: string; sub?: string; active: boolean; meta?: React.ReactNode; onEdit: () => void; onToggle: (v: boolean) => void }[];
  onAdd: () => void;
  addLabel: string;
  iconOverride?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <p className="text-xs text-ink-3">
          {rows.filter((r) => r.active).length} active · {rows.filter((r) => !r.active).length} inactive
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className={cn("flex items-center gap-3.5 px-5 py-3 transition hover:bg-subtle/60", !r.active && "opacity-60")}>
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{iconOverride ?? <DynIcon name={r.icon} className="size-4" />}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{r.name}</p>
              {r.sub && <p className="truncate text-xs text-ink-3">{r.sub}</p>}
            </div>
            <div className="hidden items-center gap-2 md:flex">{r.meta}</div>
            <Tooltip content="Edit">
              <Button size="icon-sm" variant="ghost" onClick={r.onEdit} aria-label={`Edit ${r.name}`}>
                <Pencil />
              </Button>
            </Tooltip>
            <Switch checked={r.active} onCheckedChange={r.onToggle} aria-label={`${r.name} active`} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EditModal({
  editing,
  onClose,
  onSave,
  categories,
}: {
  editing: Editing;
  onClose: () => void;
  onSave: (kind: Kind, item: NonNullable<Editing>["item"]) => void;
  categories: TechCategory[];
}) {
  const [item, setItem] = React.useState<NonNullable<Editing>["item"]>({});
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    setItem(editing?.item ?? {});
    setErr("");
  }, [editing]);
  const kind = editing?.kind;
  const titles: Record<Kind, string> = { category: "technology category", industry: "industry", service: "service category", region: "region" };
  const hasIcon = kind === "category" || kind === "industry";
  return (
    <Modal
      open={!!editing}
      onOpenChange={(v) => !v && onClose()}
      title={`${item.id ? "Edit" : "New"} ${kind ? titles[kind] : ""}`}
      description="Changes apply across the marketplace immediately and are recorded in the audit log."
      icon={kind === "region" ? <Globe2 /> : kind === "service" ? <Layers /> : <Tags />}
      size={kind === "category" ? "lg" : "md"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!item.name?.trim()) return setErr("Name is required");
              onSave(kind!, { ...item, name: item.name.trim() });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" error={err}>
          <Input value={item.name ?? ""} onChange={(e) => setItem({ ...item, name: e.target.value })} invalid={!!err} autoFocus />
        </Field>
        {hasIcon && (
          <Field label="Description">
            <Textarea value={item.description ?? ""} onChange={(e) => setItem({ ...item, description: e.target.value })} rows={2} />
          </Field>
        )}
        {hasIcon && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-2">Icon</p>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setItem({ ...item, icon: n })}
                  aria-label={n}
                  aria-pressed={item.icon === n}
                  className={cn("grid aspect-square place-items-center rounded-lg border transition", item.icon === n ? "border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-100" : "border-line text-ink-3 hover:bg-subtle")}
                >
                  <DynIcon name={n} className="size-4" />
                </button>
              ))}
            </div>
          </div>
        )}
        {kind === "category" && (
          <>
            <div className="flex items-center justify-between rounded-xl border border-line p-3">
              <div>
                <p className="text-[13px] font-medium text-ink">Featured on homepage</p>
                <p className="text-xs text-ink-3">Shown in the &ldquo;Explore technology categories&rdquo; section</p>
              </div>
              <Switch checked={!!item.featured} onCheckedChange={(v) => setItem({ ...item, featured: v })} aria-label="Featured" />
            </div>
            <div>
              <p className="mb-1 text-[13px] font-medium text-ink-2">Related categories</p>
              <p className="mb-2 text-xs text-ink-3">Providers in related categories receive partial technology-alignment credit in matching.</p>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.id !== item.id)
                  .map((c) => {
                    const on = (item.related ?? []).includes(c.id);
                    return (
                      <Chip key={c.id} selected={on} onClick={() => setItem({ ...item, related: on ? (item.related ?? []).filter((x) => x !== c.id) : [...(item.related ?? []), c.id] })}>
                        {c.name}
                      </Chip>
                    );
                  })}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
