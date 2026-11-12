"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, ClipboardList, MapPin, Save, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import type { BuyerOrg, BuyerType, BuyerPlan } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState, OrgAvatar, PageHeader, SectionLabel, StatCard } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/overlay";
import { StageBadge } from "@/components/shared/domain";
import { person } from "@/lib/people";
import { FilterSelect } from "./common";
import { PLAN_LABEL, isPremium, planOf } from "@/lib/plans";

const TYPES: BuyerType[] = ["Government Department", "Public Sector Undertaking", "Hospital / Health System", "University / Institute", "School Network", "Bank / NBFC", "Insurance", "Urban Local Body"];

export function BuyersList() {
  const L = useLookups();
  const buyers = useStore((s) => s.buyers);
  const requirements = useStore((s) => s.requirements);
  const opportunities = useStore((s) => s.opportunities);
  const industries = useStore((s) => s.industries);
  const [sector, setSector] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [plan, setPlan] = React.useState("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const rows = buyers.filter((b) => (sector === "all" || b.industryId === sector) && (status === "all" || b.status === status) && (plan === "all" || planOf(b) === plan));
  const reqCount = (id: string) => requirements.filter((r) => r.buyerId === id).length;
  const oppCount = (id: string) => opportunities.filter((o) => o.buyerId === id && o.stage !== "won" && o.stage !== "lost").length;

  const columns: Column<BuyerOrg>[] = [
    {
      key: "name",
      header: "Organisation",
      sortValue: (b) => b.name,
      cell: (b) => (
        <div className="flex items-center gap-3">
          <OrgAvatar initials={b.initials} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{b.name}</p>
            <p className="truncate text-xs text-ink-3">{b.contactName}</p>
          </div>
        </div>
      ),
    },
    { key: "type", header: "Type", sortValue: (b) => b.type, cell: (b) => <span className="text-xs">{b.type}</span>, hideOnMobile: true },
    { key: "sector", header: "Sector", sortValue: (b) => L.industryName(b.industryId), cell: (b) => <Badge tone="neutral">{L.industryName(b.industryId)}</Badge> },
    { key: "loc", header: "Location", sortValue: (b) => b.city, cell: (b) => <span className="whitespace-nowrap text-xs">{[b.city, b.state].filter(Boolean).join(", ") || "—"}</span>, hideOnMobile: true },
    {
      key: "plan",
      header: "Plan",
      sortValue: (b) => planOf(b),
      cell: (b) => <Badge tone={isPremium(b) ? "violet" : "neutral"}>{PLAN_LABEL[planOf(b)]}</Badge>,
    },
    { key: "reqs", header: "Requirements", align: "right", sortValue: (b) => reqCount(b.id), cell: (b) => <span className="tabular-nums font-medium text-ink">{reqCount(b.id)}</span> },
    { key: "opps", header: "Active opps", align: "right", sortValue: (b) => oppCount(b.id), cell: (b) => <span className="tabular-nums">{oppCount(b.id)}</span>, hideOnMobile: true },
    { key: "joined", header: "Joined", align: "right", sortValue: (b) => b.joinedAt, cell: (b) => <span className="whitespace-nowrap text-xs text-ink-3">{formatDate(b.joinedAt)}</span>, hideOnMobile: true },
    {
      key: "status",
      header: "Status",
      sortValue: (b) => b.status,
      cell: (b) => (
        <Badge tone={b.status === "active" ? "green" : b.status === "invited" ? "blue" : "neutral"} dot>
          {b.status[0].toUpperCase() + b.status.slice(1)}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Buyers" description="Registered buyer organisations, their requirements and activity across the marketplace." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Organisations" value={buyers.length} icon={<Building2 />} />
        <StatCard label="Premium" value={buyers.filter(isPremium).length} icon={<Users />} accent="accent" />
        <StatCard label="Requirements posted" value={requirements.length} icon={<ClipboardList />} accent="navy" />
        <StatCard label="Active opportunities" value={opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost").length} icon={<Target />} accent="violet" />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        searchText={(b) => `${b.name} ${b.city} ${b.state} ${b.contactName} ${b.type}`}
        searchPlaceholder="Search organisations…"
        onRowClick={(b) => setOpenId(b.id)}
        initialSort={{ key: "joined", dir: "desc" }}
        toolbar={
          <>
            <FilterSelect label="Sectors" value={sector} onChange={setSector} options={industries.map((i) => ({ value: i.id, label: i.name }))} />
            <FilterSelect label="Plans" value={plan} onChange={setPlan} options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} />
            <FilterSelect label="Statuses" value={status} onChange={setStatus} options={[{ value: "active", label: "Active" }, { value: "invited", label: "Invited" }, { value: "inactive", label: "Inactive" }]} />
          </>
        }
      />
      <BuyerSheet id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function BuyerSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const user = useUser();
  const L = useLookups();
  const buyer = useStore((s) => s.buyers.find((b) => b.id === id));
  const requirements = useStore((s) => s.requirements);
  const audit = useStore((s) => s.audit);
  const industries = useStore((s) => s.industries);
  const updateBuyer = useStore((s) => s.updateBuyer);
  const [draft, setDraft] = React.useState<BuyerOrg | null>(null);

  React.useEffect(() => setDraft(buyer ?? null), [buyer]);

  const reqs = requirements.filter((r) => r.buyerId === id);
  const activity = audit.filter((a) => reqs.some((r) => r.id === a.entityId) || a.entityId === id).slice(0, 6);
  const dirty = buyer && draft && JSON.stringify(buyer) !== JSON.stringify(draft);

  return (
    <Sheet
      open={!!id}
      onOpenChange={(v) => !v && onClose()}
      title={buyer?.name ?? ""}
      description={buyer ? `${buyer.type} · joined ${formatDate(buyer.joinedAt)}` : ""}
      width="lg"
      header={buyer && <OrgAvatar initials={buyer.initials} className="mb-3" />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!dirty}
            onClick={() => {
              if (!draft || !buyer) return;
              const patch = Object.fromEntries(Object.entries(draft).filter(([k, v]) => buyer[k as keyof BuyerOrg] !== v)) as Partial<BuyerOrg>;
              updateBuyer(buyer.id, patch, user.id);
              toast.success("Organisation updated", { description: buyer.name });
            }}
          >
            <Save /> Save changes
          </Button>
        </>
      }
    >
      {draft && (
        <div className="space-y-6">
          <section className="space-y-3">
            <SectionLabel>Organisation profile</SectionLabel>
            <Field label="Organisation name">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as BuyerType })} options={TYPES.map((t) => ({ value: t, label: t }))} />
              </Field>
              <Field label="Sector">
                <Select value={draft.industryId} onValueChange={(v) => setDraft({ ...draft, industryId: v })} options={industries.map((i) => ({ value: i.id, label: i.name }))} />
              </Field>
              <Field label="City">
                <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              </Field>
              <Field label="State">
                <Input value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
              </Field>
              <Field label="Primary contact">
                <Input value={draft.contactName} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} />
              </Field>
              <Field label="Contact email">
                <Input type="email" value={draft.contactEmail} onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })} />
              </Field>
              <Field label="Plan" hint={draft.plan === "premium" ? "Elets runs matching; introductions and meetings are open." : "Matching runs automatically; contacting suppliers needs Premium."}>
                <Select value={planOf(draft)} onValueChange={(v) => setDraft({ ...draft, plan: v as BuyerPlan })} options={[{ value: "free", label: "Free" }, { value: "premium", label: "Premium" }]} />
              </Field>
              <Field label="Status">
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as BuyerOrg["status"] })} options={[{ value: "active", label: "Active" }, { value: "invited", label: "Invited" }, { value: "inactive", label: "Inactive" }]} />
              </Field>
            </div>
          </section>

          <section>
            <SectionLabel className="mb-2">Requirements ({reqs.length})</SectionLabel>
            {reqs.length === 0 ? (
              <EmptyState compact icon={<ClipboardList />} title="No requirements yet" description="This organisation has not posted a requirement." />
            ) : (
              <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {reqs.map((r) => (
                  <Link key={r.id} href={`/admin/requirements/${r.id}`} className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{r.title}</p>
                      <p className="text-xs text-ink-3">
                        {r.code} · {L.categoryName(r.categoryId)}
                      </p>
                    </div>
                    <StageBadge stage={r.stage} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionLabel className="mb-2">Recent activity</SectionLabel>
            {activity.length === 0 ? (
              <p className="text-[13px] text-ink-3">No recorded activity.</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-[13px]">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
                    <span className="min-w-0 flex-1 text-ink-2">
                      <span className="font-medium text-ink">{person(a.actorId).name}</span> {a.action.toLowerCase()} — <span className="text-ink-3">{a.detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-4">{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Sheet>
  );
}
