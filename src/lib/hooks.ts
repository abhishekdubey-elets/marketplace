"use client";

import * as React from "react";
import { useStore } from "./store";
import type { Provider, Role } from "./types";
import { rankProviders, scoreMatch, toMatchable } from "./matching";

/** Common lookups over the store. */
export function useLookups() {
  const providers = useStore((s) => s.providers);
  const buyers = useStore((s) => s.buyers);
  const requirements = useStore((s) => s.requirements);
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const regions = useStore((s) => s.regions);
  const engagements = useStore((s) => s.engagements);
  return React.useMemo(() => {
    const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));
    const P = byId(providers);
    const B = byId(buyers);
    const R = byId(requirements);
    const C = byId(categories);
    const I = byId(industries);
    const G = byId(regions);
    const E = byId(engagements);
    return {
      provider: (id: string) => P.get(id),
      providerBySlug: (slug: string) => providers.find((p) => p.slug === slug),
      buyer: (id: string) => B.get(id),
      requirement: (id: string) => R.get(id),
      engagement: (id: string) => E.get(id),
      category: (id: string) => C.get(id),
      categoryName: (id: string) => C.get(id)?.name ?? id,
      industryName: (id: string) => I.get(id)?.name ?? id,
      regionName: (id: string) => G.get(id)?.name ?? id,
    };
  }, [providers, buyers, requirements, categories, industries, regions, engagements]);
}

/** Score a single provider against a requirement (memoised). */
export function useMatchScore(requirementId: string | null | undefined, providerId: string) {
  const req = useStore((s) => s.requirements.find((r) => r.id === requirementId));
  const prov = useStore((s) => s.providers.find((p) => p.id === providerId));
  const categories = useStore((s) => s.categories);
  return React.useMemo(() => (req && prov ? scoreMatch(req, toMatchable(prov), categories) : null), [req, prov, categories]);
}

export function useRankedProviders(requirementId: string) {
  const req = useStore((s) => s.requirements.find((r) => r.id === requirementId));
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  return React.useMemo(() => (req ? rankProviders(req, providers, categories) : []), [req, providers, categories]);
}

/** Where a provider profile lives for each role. */
export function providerHref(role: Role | null | undefined, p: Pick<Provider, "slug" | "id">) {
  if (role === "buyer") return `/buyer/providers/${p.slug}`;
  if (role === "admin") return `/admin/providers/${p.id}`;
  return `/providers/${p.slug}`;
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [v, setV] = React.useState<T>(initial);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setV(JSON.parse(raw));
    } catch {}
  }, [key]);
  const set = React.useCallback(
    (next: T) => {
      setV(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    },
    [key],
  );
  return [v, set] as const;
}

export function profileCompletion(p: Provider) {
  const checks: [string, boolean][] = [
    ["Company description", p.description.length > 80],
    ["Logo & branding", !!p.logo],
    ["Website", !!p.website],
    ["Industry verticals", p.industries.length > 0],
    ["Technology categories", p.categories.length > 0],
    ["Key capabilities (5+)", p.capabilities.length >= 5],
    ["Solutions listed", p.solutions.length > 0],
    ["Case studies (2+)", p.caseStudies.length >= 2],
    ["Certifications", p.certifications.length > 0],
    ["Geographic coverage", p.regions.length > 0],
    ["Contact details", !!p.contact.email],
    ["Supporting documents", p.documents.length >= 3 && p.documents.every((d) => d.uploadedAt)],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { percent: Math.round((done / checks.length) * 100), checks };
}
