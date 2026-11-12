"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  FileCheck,
  Gauge,
  GitCompareArrows,
  Globe,
  Handshake,
  Heart,
  Info,
  Layers,
  Lock,
  MapPin,
  Package,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Provider } from "@/lib/types";
import { useSession } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { DEPLOYMENT_LABELS, SIZE_LABELS } from "@/lib/data/taxonomy";
import { LISTING_LABEL } from "@/lib/labels";
import { requestIntroForProvider } from "@/lib/actions/buyer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { Avatar, EmptyState, ProviderLogo, ScorePill, VerificationBadge } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { suggestRm, useTeam } from "@/lib/team";
import { usePremiumGate } from "@/lib/use-plan";

export function ProviderProfileView({ provider, mode }: { provider: Provider; mode: "public" | "buyer" }) {
  const session = useSession();
  const L = useLookups();
  const buyer = mode === "buyer";
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const favourites = useStore((s) => s.favourites);
  const compare = useStore((s) => s.compare);
  const toggleFav = useStore((s) => s.toggleFavourite);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const categories = useStore((s) => s.categories);
  const team = useTeam();
  const serviceCategories = useStore((s) => s.serviceCategories);
  const industries = useStore((s) => s.industries);
  const [introOpen, setIntroOpen] = React.useState(false);
  const { gate } = usePremiumGate();
  const openIntro = () => gate("contact") && setIntroOpen(true);

  React.useEffect(() => {
    if (buyer) addRecentlyViewed(provider.id);
  }, [buyer, provider.id, addRecentlyViewed]);

  const fav = favourites.includes(provider.id);
  const inCompare = compare.includes(provider.id);
  const orgId = session?.orgId;
  const myReqs = buyer ? requirements.filter((r) => r.buyerId === orgId && r.stage !== "completed") : [];
  const fit = myReqs
    .map((r) => ({ r, m: scoreMatch(r, toMatchable(provider), categories) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 3);
  const existingIntros = matches.filter((m) => m.providerId === provider.id && myReqs.some((r) => r.id === m.requirementId) && ["intro_requested", "introduced"].includes(m.status));
  const rm = suggestRm(team, provider.industries);

  const facts = [
    { icon: MapPin, label: "Headquarters", value: provider.hq },
    { icon: CalendarDays, label: "Founded", value: String(provider.founded) },
    { icon: Users, label: "Company size", value: SIZE_LABELS[provider.size] },
    { icon: Globe, label: "Coverage", value: provider.regions.map(L.regionName).join(", ") },
  ];

  return (
    <div className="space-y-6">
      {/* cover */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="relative h-32 overflow-hidden bg-navy-950 sm:h-40">
          <div className="absolute inset-0 opacity-70" style={{ background: `linear-gradient(120deg, ${provider.logo.from}55, transparent 55%), linear-gradient(300deg, ${provider.logo.to}66, transparent 60%)` }} />
          <div className="grid-bg-dark absolute inset-0" />
          <div className="absolute -right-16 -top-20 size-72 rounded-full blur-3xl" style={{ background: `${provider.logo.to}40` }} />
          {provider.listing !== "standard" && (
            <Tooltip content="Paid listing package for visibility on the marketplace. It has no effect on verification, matching eligibility or match scores.">
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <Sparkles className="size-3" /> {LISTING_LABEL[provider.listing]} · disclosed
              </span>
            </Tooltip>
          )}
        </div>
        <div className="px-5 pb-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ProviderLogo provider={provider} size="xl" className="-mt-10 ring-4 ring-white sm:-mt-12" />
            <div className="min-w-0 flex-1 sm:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{provider.name}</h1>
                <VerificationBadge status={provider.verification} />
              </div>
              <p className="mt-1 text-sm text-ink-3">{provider.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-4">
              {buyer ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      toggleFav(provider.id);
                      toast.success(fav ? "Removed from saved providers" : "Saved to your shortlist", { description: provider.name });
                    }}
                    aria-pressed={fav}
                  >
                    <Heart className={cn(fav && "fill-rose-500 text-rose-500")} /> {fav ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const ok = toggleCompare(provider.id);
                      if (!ok) toast.error("You can compare up to 4 providers");
                      else toast.success(inCompare ? "Removed from comparison" : "Added to comparison");
                    }}
                    aria-pressed={inCompare}
                  >
                    <GitCompareArrows /> {inCompare ? "In comparison" : "Compare"}
                  </Button>
                  <Button onClick={openIntro}>
                    <Handshake /> Request introduction
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href={`/login?role=buyer&next=/buyer/providers/${provider.slug}`}>
                    <Handshake /> Request an introduction
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-ink-3 ring-1 ring-inset ring-line">
                  <f.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-4">{f.label}</p>
                  <p className="text-[13px] font-medium leading-snug text-ink">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* main */}
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="solutions" count={provider.solutions.length}>Products & solutions</TabsTrigger>
              <TabsTrigger value="cases" count={provider.caseStudies.length}>Case studies</TabsTrigger>
              <TabsTrigger value="credentials" count={provider.certifications.length}>Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-5">
              <Card>
                <CardHeader title="Company overview" icon={<Building2 />} />
                <CardContent>
                  <p className="text-sm leading-relaxed text-ink-2">{provider.description}</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Technology categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.categories.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            <DynIcon name={L.category(c)?.icon ?? "Layers"} className="size-3.5" />
                            {L.categoryName(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Services offered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.services.map((s) => (
                          <span key={s} className="rounded-lg bg-subtle px-2.5 py-1 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">
                            {serviceCategories.find((x) => x.id === s)?.name ?? s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Technology capabilities" description="Capabilities used by the Elets matching engine for functional alignment." icon={<Gauge />} />
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {provider.capabilities.map((c) => (
                      <div key={c} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13px] text-ink-2">
                        <span className="grid size-5 place-items-center rounded-full bg-accent-100 text-accent-700">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        {c}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Industry expertise" icon={<Layers />} />
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {provider.industries.map((i) => {
                    const n = provider.caseStudies.filter((c) => c.industryId === i).length;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-subtle p-3 ring-1 ring-inset ring-line">
                        <span className="grid size-9 place-items-center rounded-lg bg-white text-navy-600 shadow-xs">
                          <DynIcon name={industries.find((x) => x.id === i)?.icon ?? "Building2"} className="size-4" />
                        </span>
                        <div>
                          <p className="text-[13px] font-medium text-ink">{L.industryName(i)}</p>
                          <p className="text-xs text-ink-3">{n ? `${n} documented case ${n === 1 ? "study" : "studies"}` : "Serves this sector"}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="solutions" className="mt-5">
              {provider.solutions.length === 0 ? (
                <Card><EmptyState icon={<Package />} title="No solutions listed yet" /></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {provider.solutions.map((s) => (
                    <Card key={s.id} className="flex flex-col p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                          <DynIcon name={L.category(s.categoryId)?.icon ?? "Package"} className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold tracking-tight text-ink">{s.name}</p>
                          <p className="text-xs text-ink-3">{L.categoryName(s.categoryId)}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{s.summary}</p>
                      <ul className="mt-3 space-y-1.5">
                        {s.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-[13px] text-ink-2">
                            <Check className="size-3.5 text-accent-600" /> {h}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                        {s.deployment.map((d) => (
                          <Badge key={d} tone="neutral">{DEPLOYMENT_LABELS[d]}</Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cases" className="mt-5">
              {provider.caseStudies.length === 0 ? (
                <Card><EmptyState icon={<Quote />} title="No case studies published" description="This provider has not yet published case studies. Ask Elets for references during evaluation." /></Card>
              ) : (
                <div className="space-y-4">
                  {provider.caseStudies.map((c) => (
                    <Card key={c.id} className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="blue">{L.industryName(c.industryId)}</Badge>
                        <Badge tone="neutral">{L.categoryName(c.categoryId)}</Badge>
                        <span className="ml-auto text-xs text-ink-4">{c.year}</span>
                      </div>
                      <p className="mt-3 text-[15px] font-semibold tracking-tight text-ink">{c.title}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{c.summary}</p>
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-accent-50/70 p-3 text-[13px] text-accent-700">
                        <Award className="mt-0.5 size-4 shrink-0" />
                        <span><span className="font-semibold">Outcome:</span> {c.outcome}</span>
                      </div>
                    </Card>
                  ))}
                  <p className="text-xs text-ink-4">Case studies are provided by the company. Client names are withheld unless the client has consented.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="credentials" className="mt-5 space-y-4">
              {provider.certifications.length === 0 ? (
                <Card><EmptyState icon={<FileCheck />} title="No certifications listed" /></Card>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {provider.certifications.map((c) => (
                    <div key={c} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
                      <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <FileCheck className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{c}</p>
                        <p className="text-xs text-ink-3">{provider.verification === "verified" ? "Certificate reviewed by Elets" : "Self-declared — pending review"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Card className="p-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Client sectors served</p>
                <div className="flex flex-wrap gap-1.5">
                  {provider.clientSegments.map((c) => (
                    <span key={c} className="rounded-lg bg-subtle px-2.5 py-1 text-xs font-medium text-ink-2 ring-1 ring-inset ring-line">{c}</span>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* sidebar */}
        <div className="space-y-4">
          {buyer && fit.length > 0 && (
            <Card>
              <CardHeader title="Fit for your requirements" description="Explainable match score, not influenced by listings." icon={<Gauge />} />
              <CardContent className="space-y-2">
                {fit.map(({ r, m }) => (
                  <Link key={r.id} href={`/buyer/requirements/${r.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-line-strong hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-ink-4">{r.code}</p>
                      <p className="truncate text-[13px] font-medium text-ink">{r.title}</p>
                    </div>
                    <ScorePill score={m.score} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Verification" icon={<ShieldCheck />} />
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                <VerificationBadge status={provider.verification} />
                {provider.verifiedAt && <span className="text-xs text-ink-3">since {formatDate(provider.verifiedAt)}</span>}
              </div>
              <ul className="mt-4 space-y-2.5">
                {[
                  "Company registration and GST documents",
                  "Certifications and empanelments",
                  "Client references and case studies",
                  "Contact and leadership details",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2 text-[13px] text-ink-2">
                    {provider.verification === "verified" ? <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-400" />}
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-4">
                <Info className="mt-px size-3 shrink-0" /> Verification is performed by the Elets team and is independent of listing packages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Contact" icon={<Handshake />} />
            <CardContent>
              {buyer ? (
                <>
                  <p className="text-[13px] leading-relaxed text-ink-3">Introductions are facilitated by Elets so both sides have context before the first conversation.</p>
                  {rm && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-subtle p-3 ring-1 ring-inset ring-line">
                    <Avatar initials={rm.initials} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{rm.name}</p>
                      <p className="truncate text-xs text-ink-3">{rm.title}</p>
                    </div>
                  </div>
                  )}
                  <div className="mt-3 rounded-xl border border-line p-3 text-[13px]">
                    <p className="font-medium text-ink">{provider.contact.name}</p>
                    <p className="text-xs text-ink-3">{provider.contact.title}</p>
                    <p className="mt-2 text-xs text-ink-3">{provider.website}</p>
                  </div>
                  {existingIntros.length > 0 && (
                    <p className="mt-3 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
                      Introduction {existingIntros.some((m) => m.status === "introduced") ? "made" : "requested"} for {existingIntros.map((m) => L.requirement(m.requirementId)?.code).join(", ")}.
                    </p>
                  )}
                  <Button className="mt-4 w-full" onClick={openIntro}>
                    Request introduction <ArrowRight />
                  </Button>
                </>
              ) : (
                <PublicContactActions slug={provider.slug} role={session?.role ?? null} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {buyer && (
        <IntroModal open={introOpen} onOpenChange={setIntroOpen} provider={provider} requirements={myReqs} actorId={session?.id ?? "u-buyer"} />
      )}
    </div>
  );
}

function IntroModal({
  open,
  onOpenChange,
  provider,
  requirements,
  actorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  provider: Provider;
  requirements: { id: string; code: string; title: string }[];
  actorId: string;
}) {
  const [reqId, setReqId] = React.useState(requirements[0]?.id ?? "");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open) {
      setReqId(requirements[0]?.id ?? "");
      setNote("");
    }
  }, [open, requirements]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      icon={<Handshake />}
      title={`Request an introduction to ${provider.name}`}
      description="Elets reviews the request, shares your requirement brief with the provider and arranges the first conversation."
      footer={
        requirements.length ? (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              disabled={!reqId}
              onClick={() => {
                requestIntroForProvider(reqId, provider.id, actorId, note.trim() || undefined);
                onOpenChange(false);
                toast.success("Introduction requested", { description: "Your Elets relationship manager will follow up." });
              }}
            >
              Send request
            </Button>
          </>
        ) : (
          <Button asChild>
            <Link href="/buyer/requirements/new">Post a requirement first</Link>
          </Button>
        )
      }
    >
      {requirements.length ? (
        <div className="space-y-4">
          <Field label="For which requirement?">
            <Select value={reqId} onValueChange={setReqId} options={requirements.map((r) => ({ value: r.id, label: `${r.code} — ${r.title}` }))} />
          </Field>
          <Field label="Note for Elets" optional hint="Anything the provider should know before the first call.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Please include their implementation lead in the first call." />
          </Field>
        </div>
      ) : (
        <p className="text-sm text-ink-3">Introductions are linked to a requirement so the provider has context. Post a requirement to continue.</p>
      )}
    </Modal>
  );
}

/** Branded not-found state for unknown provider slugs. */
export function ProviderNotFound({ backHref }: { backHref: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <EmptyState
        icon={<Building2 />}
        title="Provider not found"
        description="This company profile doesn't exist or is no longer listed on the marketplace."
        action={
          <Button asChild variant="secondary">
            <Link href={backHref}>Browse providers</Link>
          </Button>
        }
      />
    </div>
  );
}

/** Contact card actions on the public profile, depending on who is looking. */
function PublicContactActions({ slug, role }: { slug: string; role: "buyer" | "provider" | "admin" | null }) {
  const next = encodeURIComponent(`/buyer/providers/${slug}`);
  if (role === "buyer") {
    return (
      <>
        <p className="text-[13px] leading-relaxed text-ink-3">Introductions are facilitated by Elets so both sides have context before the first conversation.</p>
        <Button className="mt-4 w-full" asChild>
          <Link href={`/buyer/providers/${slug}`}>
            Request an introduction <ArrowRight />
          </Link>
        </Button>
      </>
    );
  }
  if (role) {
    return (
      <>
        <div className="flex items-start gap-3 rounded-xl bg-subtle p-3 ring-1 ring-inset ring-line">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-4" />
          <p className="text-[13px] leading-relaxed text-ink-3">
            You&apos;re signed in as {role === "admin" ? "Elets operations" : "a solution provider"}. Introductions are requested by buyer organisations.
          </p>
        </div>
        <Button variant="secondary" className="mt-4 w-full" asChild>
          <Link href={`/login?role=buyer&next=${next}`}>Switch to a buyer account</Link>
        </Button>
      </>
    );
  }
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl bg-subtle p-3 ring-1 ring-inset ring-line">
        <Lock className="mt-0.5 size-4 shrink-0 text-ink-4" />
        <p className="text-[13px] leading-relaxed text-ink-3">Create a free buyer account to post a requirement and see your matches. Introductions to suppliers are arranged by Elets on the Premium plan.</p>
      </div>
      <Button className="mt-4 w-full" asChild>
        <Link href={`/login?role=buyer&next=${next}`}>Sign in to connect</Link>
      </Button>
      <Button variant="secondary" className="mt-2 w-full" asChild>
        <Link href={`/signup?role=buyer&next=${next}`}>Create a buyer account</Link>
      </Button>
      <Button variant="ghost" className="mt-2 w-full" asChild>
        <Link href="/pro">Get managed support with Elets Pro</Link>
      </Button>
    </>
  );
}
