"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, FileSearch, Heart, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { scoreMatch, toMatchable } from "@/lib/matching";
import { MATCH_STATUS_LABEL, MATCH_STATUS_TONE } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";
import { EmptyState, PageHeader, ProviderLogo, ScoreRing, VerificationBadge } from "@/components/ui/misc";
import { ProviderCard } from "@/components/shared/domain";

export default function ShortlistPage() {
  const user = useUser();
  const router = useRouter();
  const L = useLookups();
  const favourites = useStore((s) => s.favourites);
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const categories = useStore((s) => s.categories);
  const savedSearches = useStore((s) => s.savedSearches);
  const deleteSaved = useStore((s) => s.deleteSavedSearch);
  const shortlist = useStore((s) => s.shortlistMatch);

  const saved = favourites.map((id) => providers.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  const myReqIds = new Set(requirements.filter((r) => r.buyerId === user.orgId).map((r) => r.id));
  const shortlisted = matches
    .filter((m) => myReqIds.has(m.requirementId) && ["shortlisted", "intro_requested", "introduced"].includes(m.status))
    .map((m) => {
      const r = L.requirement(m.requirementId)!;
      const p = L.provider(m.providerId)!;
      return { m, r, p, score: scoreMatch(r, toMatchable(p), categories).score };
    })
    .filter((x) => x.r && x.p);

  const byReq = shortlisted.reduce<Record<string, typeof shortlisted>>((acc, x) => {
    (acc[x.r.id] ??= []).push(x);
    return acc;
  }, {});

  const searchUrl = (s: (typeof savedSearches)[number]) => {
    const sp = new URLSearchParams();
    if (s.query) sp.set("q", s.query);
    if (s.filters.categories[0]) sp.set("category", s.filters.categories[0]);
    if (s.filters.industries[0]) sp.set("industry", s.filters.industries[0]);
    return `/buyer/discover${sp.toString() ? `?${sp}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Shortlist & saved"
        description="Providers you've saved while browsing, providers shortlisted against your requirements, and your saved searches."
        actions={
          <Button variant="secondary" asChild>
            <Link href="/buyer/discover">
              <FileSearch /> Explore providers
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved" count={saved.length}>Saved providers</TabsTrigger>
          <TabsTrigger value="shortlisted" count={shortlisted.length}>Shortlisted from matches</TabsTrigger>
          <TabsTrigger value="searches" count={savedSearches.length}>Saved searches</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-5">
          {saved.length === 0 ? (
            <Card>
              <EmptyState icon={<Heart />} title="No saved providers yet" description="Tap “Save” on any provider card or profile to keep it here." action={<Button asChild size="sm"><Link href="/buyer/discover">Browse providers</Link></Button>} />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {saved.map((p) => (
                <ProviderCard key={p.id} provider={p} href={`/buyer/providers/${p.slug}`} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shortlisted" className="mt-5 space-y-5">
          {shortlisted.length === 0 ? (
            <Card>
              <EmptyState icon={<Star />} title="Nothing shortlisted yet" description="Open a requirement's matched providers and shortlist the ones you'd like to take forward." action={<Button asChild size="sm"><Link href="/buyer/requirements">View requirements</Link></Button>} />
            </Card>
          ) : (
            Object.values(byReq).map((group) => (
              <Card key={group[0].r.id} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-line bg-subtle/60 px-5 py-3">
                  <span className="font-mono text-xs text-ink-3">{group[0].r.code}</span>
                  <Link href={`/buyer/requirements/${group[0].r.id}?tab=matches`} className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink hover:text-brand-700">
                    {group[0].r.title}
                  </Link>
                </div>
                <div className="divide-y divide-line">
                  {group
                    .sort((a, b) => b.score - a.score)
                    .map(({ m, p, score }) => (
                      <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                        <ProviderLogo provider={p} />
                        <div className="min-w-0 flex-1">
                          <Link href={`/buyer/providers/${p.slug}`} className="block truncate text-[13px] font-semibold text-ink hover:text-brand-700">{p.name}</Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <VerificationBadge status={p.verification} compact />
                            <Badge tone={MATCH_STATUS_TONE[m.status]} dot>{MATCH_STATUS_LABEL[m.status]}</Badge>
                          </div>
                        </div>
                        <ScoreRing score={score} size={44} stroke={4} />
                        {m.status === "shortlisted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              shortlist(m.id, false);
                              toast.success("Removed from shortlist", { description: p.name });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="searches" className="mt-5">
          {savedSearches.length === 0 ? (
            <Card>
              <EmptyState icon={<Bookmark />} title="No saved searches" description="Use “Save” on the discovery page to keep a search with its filters." />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {savedSearches.map((s) => (
                <Card key={s.id} className="flex items-start gap-3 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Search className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{s.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {s.query && <Badge tone="blue">“{s.query}”</Badge>}
                      {s.filters.categories.map((c) => <Badge key={c}>{L.categoryName(c)}</Badge>)}
                      {s.filters.industries.map((c) => <Badge key={c}>{L.industryName(c)}</Badge>)}
                      {s.filters.regions.map((c) => <Badge key={c}>{L.regionName(c)}</Badge>)}
                      {s.filters.verifiedOnly && <Badge tone="green">Verified</Badge>}
                    </div>
                    <p className="mt-2 text-[11px] text-ink-4">Saved {formatDate(s.at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="secondary" onClick={() => router.push(searchUrl(s))}>Run</Button>
                    <Button
                      size="icon-sm"
                      variant="danger-ghost"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => {
                        deleteSaved(s.id);
                        toast.success("Saved search deleted");
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
