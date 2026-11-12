"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  ChevronDown,
  Clock,
  GitCompareArrows,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Search,
  SearchX,
  SlidersHorizontal,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { CompanySize, Provider } from "@/lib/types";
import { useSession } from "@/components/providers";
import { useLookups } from "@/lib/hooks";
import { COMPLIANCE_OPTIONS, SIZE_LABELS } from "@/lib/data/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Segmented, Switch } from "@/components/ui/controls";
import { Select } from "@/components/ui/select";
import { Modal, Popover, PopoverContent, PopoverTrigger, Sheet, Tooltip } from "@/components/ui/overlay";
import { EmptyState, ProviderLogo, VerificationBadge } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";
import { ProviderCard } from "./domain";

type Sort = "relevance" | "name" | "newest" | "cases";

interface Filters {
  categories: string[];
  industries: string[];
  regions: string[];
  certs: string[];
  sizes: CompanySize[];
  verifiedOnly: boolean;
}

const EMPTY: Filters = { categories: [], industries: [], regions: [], certs: [], sizes: [], verifiedOnly: false };
const SIZES: CompanySize[] = ["1-50", "51-200", "201-1000", "1000+"];

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/**
 * Marketplace discovery: category strip, instant search, filters, sort, grid/list.
 * `profileHref` is the base path for provider profiles, e.g. "/providers" or "/buyer/providers".
 * Ranking never uses the paid listing package.
 */
export function DiscoveryView({ basePath, profileHref }: { basePath: string; profileHref: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const isBuyer = session?.role === "buyer";
  const L = useLookups();

  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const regions = useStore((s) => s.regions);
  const savedSearches = useStore((s) => s.savedSearches);
  const saveSearch = useStore((s) => s.saveSearch);
  const deleteSavedSearch = useStore((s) => s.deleteSavedSearch);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const compare = useStore((s) => s.compare);
  const clearCompare = useStore((s) => s.clearCompare);

  const [q, setQ] = React.useState(params.get("q") ?? "");
  const [filters, setFilters] = React.useState<Filters>(() => ({
    ...EMPTY,
    categories: params.get("category") ? [params.get("category")!] : [],
    industries: params.get("industry") ? [params.get("industry")!] : [],
  }));
  const [sort, setSort] = React.useState<Sort>("relevance");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [focused, setFocused] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");
  // Radix Select renders an empty value when server-rendered; mount it client-side only.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Re-sync when the URL changes (e.g. global search navigates here with ?q=).
  const urlKey = params.toString();
  React.useEffect(() => {
    const sp = new URLSearchParams(urlKey);
    setQ(sp.get("q") ?? "");
    setFilters((f) => ({
      ...f,
      categories: sp.get("category") ? [sp.get("category")!] : f.categories,
      industries: sp.get("industry") ? [sp.get("industry")!] : f.industries,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  // new sign-ups stay out of the directory until their profile lists at least one technology category
  const listed = React.useMemo(() => providers.filter((p) => p.accountStatus === "active" && p.categories.length > 0), [providers]);

  const haystack = React.useCallback(
    (p: Provider) =>
      [
        p.name,
        p.tagline,
        p.description,
        p.hq,
        ...p.capabilities,
        ...p.solutions.flatMap((s) => [s.name, s.summary]),
        ...p.categories.map(L.categoryName),
        ...p.industries.map(L.industryName),
        ...p.clientSegments,
        ...p.certifications,
      ]
        .join(" ")
        .toLowerCase(),
    [L],
  );

  const relevance = React.useCallback(
    (p: Provider, needle: string) => {
      if (!needle) return (p.verification === "verified" ? 100 : 0) + p.caseStudies.length * 5 + p.capabilities.length;
      let s = 0;
      if (p.name.toLowerCase().includes(needle)) s += 50;
      if (p.capabilities.some((c) => c.toLowerCase().includes(needle))) s += 30;
      if (p.solutions.some((x) => x.name.toLowerCase().includes(needle))) s += 25;
      if (p.tagline.toLowerCase().includes(needle)) s += 15;
      if (haystack(p).includes(needle)) s += 10;
      return s + (p.verification === "verified" ? 5 : 0);
    },
    [haystack],
  );

  const results = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = filters;
    const out = listed.filter(
      (p) =>
        (!needle || haystack(p).includes(needle)) &&
        (!f.categories.length || f.categories.some((c) => p.categories.includes(c))) &&
        (!f.industries.length || f.industries.some((c) => p.industries.includes(c))) &&
        (!f.regions.length || p.regions.includes("pan-india") || f.regions.some((r) => p.regions.includes(r))) &&
        (!f.certs.length || f.certs.every((c) => p.certifications.includes(c))) &&
        (!f.sizes.length || f.sizes.includes(p.size)) &&
        (!f.verifiedOnly || p.verification === "verified"),
    );
    const sorted = [...out];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "newest") sorted.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    else if (sort === "cases") sorted.sort((a, b) => b.caseStudies.length - a.caseStudies.length || a.name.localeCompare(b.name));
    else sorted.sort((a, b) => relevance(b, needle) - relevance(a, needle) || a.name.localeCompare(b.name));
    return sorted;
  }, [listed, q, filters, sort, haystack, relevance]);

  // instant suggestions
  const suggestions = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 1) return null;
    const companies = listed.filter((p) => p.name.toLowerCase().includes(needle) || p.tagline.toLowerCase().includes(needle)).slice(0, 4);
    const caps = Array.from(new Set(listed.flatMap((p) => p.capabilities)))
      .filter((c) => c.toLowerCase().includes(needle))
      .slice(0, 4);
    const sols = listed
      .flatMap((p) => p.solutions.map((s) => ({ s, p })))
      .filter(({ s }) => s.name.toLowerCase().includes(needle) || s.summary.toLowerCase().includes(needle))
      .slice(0, 3);
    if (!companies.length && !caps.length && !sols.length) return null;
    return { companies, caps, sols };
  }, [q, listed]);

  const syncUrl = (nextQ: string, cat?: string) => {
    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    if (cat) sp.set("category", cat);
    router.replace(`${basePath}${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
  };

  const activeCount =
    filters.categories.length + filters.industries.length + filters.regions.length + filters.certs.length + filters.sizes.length + (filters.verifiedOnly ? 1 : 0);
  const hasCriteria = activeCount > 0 || q.trim().length > 0;

  const pills: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((c) => ({ key: "c" + c, label: L.categoryName(c), remove: () => setFilters((f) => ({ ...f, categories: f.categories.filter((x) => x !== c) })) })),
    ...filters.industries.map((c) => ({ key: "i" + c, label: L.industryName(c), remove: () => setFilters((f) => ({ ...f, industries: f.industries.filter((x) => x !== c) })) })),
    ...filters.regions.map((c) => ({ key: "r" + c, label: L.regionName(c), remove: () => setFilters((f) => ({ ...f, regions: f.regions.filter((x) => x !== c) })) })),
    ...filters.certs.map((c) => ({ key: "x" + c, label: c, remove: () => setFilters((f) => ({ ...f, certs: f.certs.filter((x) => x !== c) })) })),
    ...filters.sizes.map((c) => ({ key: "s" + c, label: SIZE_LABELS[c], remove: () => setFilters((f) => ({ ...f, sizes: f.sizes.filter((x) => x !== c) })) })),
    ...(filters.verifiedOnly ? [{ key: "v", label: "Verified only", remove: () => setFilters((f) => ({ ...f, verifiedOnly: false })) }] : []),
  ];

  const clearAll = () => {
    setFilters(EMPTY);
    setQ("");
    syncUrl("");
  };

  const applySaved = (id: string) => {
    const s = savedSearches.find((x) => x.id === id);
    if (!s) return;
    setQ(s.query);
    setFilters({ ...EMPTY, ...s.filters, certs: [], sizes: [] });
    toast.success(`Applied “${s.name}”`);
  };

  const recent = recentlyViewed.map((id) => providers.find((p) => p.id === id)).filter((p): p is Provider => !!p);
  const href = (p: Provider) => `${profileHref}/${p.slug}`;
  const compareProviders = compare.map((id) => providers.find((p) => p.id === id)).filter((p): p is Provider => !!p);

  const filterPanel = (
    <FilterPanel
      filters={filters}
      setFilters={setFilters}
      categories={categories.filter((c) => c.active)}
      industries={industries.filter((i) => i.active)}
      regions={regions.filter((r) => r.active && r.id !== "pan-india")}
      counts={(pred) => listed.filter(pred).length}
    />
  );

  return (
    <div className="pb-24">
      {/* category strip */}
      <div className="scrollbar-thin -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          onClick={() => {
            setFilters((f) => ({ ...f, categories: [] }));
            syncUrl(q);
          }}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition",
            filters.categories.length === 0 ? "border-navy-900 bg-navy-900 text-white shadow-raised" : "border-line bg-white text-ink-2 hover:border-line-strong",
          )}
        >
          <LayoutGrid className="size-4" /> All categories
        </button>
        {categories
          .filter((c) => c.active)
          .map((c) => {
            const on = filters.categories.length === 1 && filters.categories[0] === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setFilters((f) => ({ ...f, categories: on ? [] : [c.id] }));
                  syncUrl(q, on ? undefined : c.id);
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-medium transition",
                  on ? "border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-100" : "border-line bg-white text-ink-2 hover:border-line-strong hover:bg-subtle",
                )}
              >
                <DynIcon name={c.icon} className={cn("size-4", on ? "text-brand-600" : "text-ink-4")} />
                {c.name}
              </button>
            );
          })}
      </div>

      {/* search + toolbar */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Input
            icon={<Search />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                syncUrl(q.trim(), filters.categories.length === 1 ? filters.categories[0] : undefined);
                setFocused(false);
              }
              if (e.key === "Escape") setFocused(false);
            }}
            placeholder="Search companies, solutions, capabilities, industries…"
            className="h-11 rounded-xl pr-10 text-[15px]"
            aria-label="Search providers"
          />
          {q && (
            <button onClick={() => { setQ(""); syncUrl(""); }} className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-ink-4 hover:bg-navy-50 hover:text-ink" aria-label="Clear search">
              <X className="size-4" />
            </button>
          )}
          {focused && suggestions && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-overlay animate-fade-in">
              {suggestions.companies.length > 0 && <SuggestHead>Companies</SuggestHead>}
              {suggestions.companies.map((p) => (
                <Link key={p.id} href={href(p)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-navy-50">
                  <ProviderLogo provider={p} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                    <span className="block truncate text-xs text-ink-3">{p.tagline}</span>
                  </span>
                  <VerificationBadge status={p.verification} compact />
                </Link>
              ))}
              {suggestions.caps.length > 0 && <SuggestHead>Capabilities</SuggestHead>}
              {suggestions.caps.map((c) => (
                <button key={c} onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(c); syncUrl(c); setFocused(false); }} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink-2 hover:bg-navy-50">
                  <Wrench className="size-4 text-ink-4" />
                  <span className="flex-1">{c}</span>
                  <span className="text-xs text-ink-4">{listed.filter((p) => p.capabilities.includes(c)).length} providers</span>
                </button>
              ))}
              {suggestions.sols.length > 0 && <SuggestHead>Solutions</SuggestHead>}
              {suggestions.sols.map(({ s, p }) => (
                <Link key={p.id + s.id} href={href(p)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-navy-50">
                  <Package className="size-4 text-ink-4" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">
                    {s.name} <span className="text-ink-4">· {p.name}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal /> Filters {activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{activeCount}</span>}
          </Button>
          <div className="w-44">
            {!mounted ? (
              <div className="h-9 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-xs">Sort: Relevance</div>
            ) : (
            <Select
              ariaLabel="Sort results"
              value={sort}
              onValueChange={(v) => setSort(v as Sort)}
              options={[
                { value: "relevance", label: "Sort: Relevance" },
                { value: "name", label: "Sort: Name (A–Z)" },
                { value: "newest", label: "Sort: Newest" },
                { value: "cases", label: "Sort: Most case studies" },
              ]}
            />
            )}
          </div>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: <><LayoutGrid /> <span className="sr-only sm:not-sr-only">Grid</span></> },
              { value: "list", label: <><List /> <span className="sr-only sm:not-sr-only">List</span></> },
            ]}
          />
          {isBuyer && (
            <>
              <Tooltip content={hasCriteria ? "Save this search" : "Add a search term or filter to save"}>
                <span>
                  <Button variant="secondary" disabled={!hasCriteria} onClick={() => { setSaveName(q || pills.map((p) => p.label).slice(0, 2).join(", ")); setSaveOpen(true); }}>
                    <Bookmark /> Save
                  </Button>
                </span>
              </Tooltip>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">
                    <BookmarkCheck /> Saved <span className="rounded-full bg-navy-100 px-1.5 text-[10px] text-ink-2">{savedSearches.length}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2">
                  <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-4">Saved searches</p>
                  {savedSearches.length === 0 && <p className="px-2 py-4 text-center text-xs text-ink-3">No saved searches yet.</p>}
                  {savedSearches.map((s) => (
                    <div key={s.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-50">
                      <button className="min-w-0 flex-1 text-left" onClick={() => applySaved(s.id)}>
                        <span className="block truncate text-[13px] font-medium text-ink">{s.name}</span>
                        <span className="block truncate text-[11px] text-ink-3">
                          {[s.query && `“${s.query}”`, ...s.filters.categories.map(L.categoryName), ...s.filters.regions.map(L.regionName), s.filters.verifiedOnly && "Verified"].filter(Boolean).join(" · ") || "All providers"}
                        </span>
                      </button>
                      <button
                        className="grid size-7 place-items-center rounded-md text-ink-4 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        onClick={() => { deleteSavedSearch(s.id); toast.success("Saved search deleted"); }}
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {pills.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 animate-fade-in">
          {pills.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-brand-700">
              {p.label}
              <button onClick={p.remove} className="grid size-5 place-items-center rounded-full hover:bg-brand-100" aria-label={`Remove ${p.label}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs font-medium text-ink-3 hover:text-ink">
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[256px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-line bg-white p-4 shadow-card">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          {isBuyer && !hasCriteria && recent.length > 0 && (
            <div className="mb-6">
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-4">
                <Clock className="size-3.5" /> Recently viewed
              </p>
              <div className="scrollbar-thin -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                {recent.slice(0, 6).map((p) => (
                  <Link key={p.id} href={href(p)} className="flex w-60 shrink-0 items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-xs transition hover:border-line-strong hover:shadow-raised">
                    <ProviderLogo provider={p} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                      <span className="block truncate text-xs text-ink-3">{L.categoryName(p.categories[0])}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-[13px] text-ink-3">
              <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "provider" : "providers"}
              {q.trim() && <> matching “{q.trim()}”</>}
            </p>
            <p className="hidden text-xs text-ink-4 sm:block">Ranking is never influenced by paid listings</p>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-white">
              <EmptyState
                icon={<SearchX />}
                title="No providers match these criteria"
                description="Try removing a filter or searching for a broader capability. Elets can also source providers for you through a requirement."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="secondary" onClick={clearAll}>Clear filters</Button>
                    <Button asChild>
                      <Link href={isBuyer ? "/buyer/requirements/new" : "/login?role=buyer"}>Post a requirement</Link>
                    </Button>
                  </div>
                }
              />
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {results.map((p) => (
                <ProviderCard key={p.id} provider={p} href={href(p)} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              {results.map((p) => (
                <Link key={p.id} href={href(p)} className="flex items-center gap-4 border-b border-line/70 px-4 py-3.5 transition last:border-0 hover:bg-brand-50/30">
                  <ProviderLogo provider={p} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{p.name}</span>
                      <VerificationBadge status={p.verification} compact />
                    </div>
                    <p className="truncate text-xs text-ink-3">{p.tagline}</p>
                  </div>
                  <div className="hidden min-w-0 flex-wrap gap-1 md:flex md:max-w-[260px]">
                    {p.categories.slice(0, 2).map((c) => (
                      <span key={c} className="truncate rounded-md bg-subtle px-2 py-0.5 text-[11px] font-medium text-ink-2 ring-1 ring-inset ring-line">{L.categoryName(c)}</span>
                    ))}
                  </div>
                  <span className="hidden w-32 items-center gap-1 text-xs text-ink-3 lg:inline-flex">
                    <MapPin className="size-3.5" /> {p.hq.split(",")[0]}
                  </span>
                  <span className="hidden w-24 items-center gap-1 text-xs text-ink-3 xl:inline-flex">
                    <Building2 className="size-3.5" /> {p.size}
                  </span>
                  <ArrowRight className="size-4 text-ink-4" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Filters" description={`${results.length} providers match`} width="sm"
        footer={<><Button variant="secondary" onClick={() => setFilters(EMPTY)}>Reset</Button><Button onClick={() => setSheetOpen(false)}>Show {results.length} results</Button></>}>
        {filterPanel}
      </Sheet>

      <Modal
        open={saveOpen}
        onOpenChange={setSaveOpen}
        title="Save this search"
        description="Saved searches appear in your workspace so you can re-run them later."
        icon={<Bookmark />}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button
              disabled={!saveName.trim()}
              onClick={() => {
                saveSearch({ name: saveName.trim(), query: q.trim(), filters: { categories: filters.categories, industries: filters.industries, regions: filters.regions, verifiedOnly: filters.verifiedOnly } });
                setSaveOpen(false);
                toast.success("Search saved", { description: saveName.trim() });
              }}
            >
              Save search
            </Button>
          </>
        }
      >
        <Input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="e.g. Verified SOC providers" aria-label="Search name" autoFocus />
      </Modal>

      {compareProviders.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 animate-slide-up">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-2xl border border-navy-800 bg-navy-900 p-2.5 pl-4 text-white shadow-overlay">
            <GitCompareArrows className="size-4 shrink-0 text-accent-300" />
            <div className="flex -space-x-2">
              {compareProviders.map((p) => (
                <ProviderLogo key={p.id} provider={p} size="sm" className="ring-2 ring-navy-900" />
              ))}
            </div>
            <p className="min-w-0 flex-1 truncate text-[13px]">
              <span className="font-semibold">{compareProviders.length}</span> of 4 selected
            </p>
            <button onClick={clearCompare} className="text-xs font-medium text-navy-300 hover:text-white">Clear</button>
            <Button size="sm" variant="white" asChild>
              <Link href={isBuyer ? "/buyer/compare" : "/login?role=buyer&next=/buyer/compare"}>Compare</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestHead({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">{children}</p>;
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-line py-3 first:pt-0 last:border-0 last:pb-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-[13px] font-semibold text-ink" aria-expanded={open}>
        {title}
        <ChevronDown className={cn("size-4 text-ink-4 transition", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2.5 space-y-2">{children}</div>}
    </div>
  );
}

function CheckRow({ label, checked, onChange, count }: { label: string; checked: boolean; onChange: () => void; count?: number }) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="flex-1 cursor-pointer truncate text-[13px] text-ink-2">
        {label}
      </label>
      {count !== undefined && <span className="text-xs tabular-nums text-ink-4">{count}</span>}
    </div>
  );
}

function FilterPanel({
  filters,
  setFilters,
  categories,
  industries,
  regions,
  counts,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  categories: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  counts: (pred: (p: Provider) => boolean) => number;
}) {
  const [showAllCats, setShowAllCats] = React.useState(false);
  const cats = showAllCats ? categories : categories.slice(0, 6);
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <label htmlFor="verified-only" className="text-[13px] font-semibold text-ink">
          Elets verified only
        </label>
        <Switch id="verified-only" checked={filters.verifiedOnly} onCheckedChange={(v) => setFilters((f) => ({ ...f, verifiedOnly: v }))} />
      </div>
      <div className="pt-3">
        <FilterGroup title="Technology category">
          {cats.map((c) => (
            <CheckRow key={c.id} label={c.name} checked={filters.categories.includes(c.id)} onChange={() => setFilters((f) => ({ ...f, categories: toggle(f.categories, c.id) }))} count={counts((p) => p.categories.includes(c.id))} />
          ))}
          {categories.length > 6 && (
            <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setShowAllCats(!showAllCats)}>
              {showAllCats ? "Show fewer" : `Show all ${categories.length}`}
            </button>
          )}
        </FilterGroup>
        <FilterGroup title="Industry">
          {industries.map((c) => (
            <CheckRow key={c.id} label={c.name} checked={filters.industries.includes(c.id)} onChange={() => setFilters((f) => ({ ...f, industries: toggle(f.industries, c.id) }))} count={counts((p) => p.industries.includes(c.id))} />
          ))}
        </FilterGroup>
        <FilterGroup title="Delivery region">
          {regions.map((c) => (
            <CheckRow key={c.id} label={c.name} checked={filters.regions.includes(c.id)} onChange={() => setFilters((f) => ({ ...f, regions: toggle(f.regions, c.id) }))} />
          ))}
          <p className="text-[11px] leading-relaxed text-ink-4">Providers with pan-India coverage are always included.</p>
        </FilterGroup>
        <FilterGroup title="Certifications" defaultOpen={false}>
          {COMPLIANCE_OPTIONS.map((c) => (
            <CheckRow key={c} label={c} checked={filters.certs.includes(c)} onChange={() => setFilters((f) => ({ ...f, certs: toggle(f.certs, c) }))} count={counts((p) => p.certifications.includes(c))} />
          ))}
        </FilterGroup>
        <FilterGroup title="Company size" defaultOpen={false}>
          {SIZES.map((s) => (
            <CheckRow key={s} label={SIZE_LABELS[s]} checked={filters.sizes.includes(s)} onChange={() => setFilters((f) => ({ ...f, sizes: toggle(f.sizes, s) }))} count={counts((p) => p.size === s)} />
          ))}
        </FilterGroup>
      </div>
    </div>
  );
}
