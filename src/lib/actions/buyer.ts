"use client";

import { actorId, uid, useStore } from "../store";
import type { BuyerOrg } from "../types";

/**
 * Buyer-side mutations that are not part of the core store.
 * Same integration boundary as store.ts: each maps to a single table write.
 */

/** Buyer asks Elets for an introduction to a provider for one of their requirements. */
export function requestIntroForProvider(requirementId: string, providerId: string, actorId: string, note?: string) {
  const s = useStore.getState();
  const req = s.requirements.find((r) => r.id === requirementId);
  const prov = s.providers.find((p) => p.id === providerId);
  if (!req || !prov) return;
  const existing = s.matches.find((m) => m.requirementId === requirementId && m.providerId === providerId);
  const at = new Date().toISOString();
  if (existing) {
    if (existing.status === "introduced" || existing.status === "intro_requested") return;
    useStore.setState({ matches: s.matches.map((m) => (m.id === existing.id ? { ...m, status: "intro_requested", updatedAt: at } : m)) });
  } else {
    useStore.setState({
      matches: [
        ...s.matches,
        { id: uid("m"), requirementId, providerId, status: "intro_requested", providerInterest: "none", reviewedBy: null, createdAt: at, updatedAt: at },
      ],
    });
  }
  s.notify({
    audience: "admin",
    userId: null,
    type: "intro_requested",
    title: "Introduction requested",
    body: `Buyer requested an introduction to ${prov.name} for ${req.code}.${note ? ` Note: ${note}` : ""}`,
    href: `/admin/requirements/${requirementId}`,
  });
  s.log(actorId, "Requested introduction", "match", requirementId, `${prov.name} for ${req.code}`);
}

/** Buyer updates their own organisation details (from the requirement wizard). */
export function updateOwnOrg(orgId: string, patch: Partial<Pick<BuyerOrg, "name" | "contactName" | "contactEmail" | "city" | "state">>) {
  const s = useStore.getState();
  const b = s.buyers.find((x) => x.id === orgId);
  if (!b) return;
  const changed = (Object.keys(patch) as (keyof typeof patch)[]).filter((k) => patch[k] !== undefined && patch[k] !== b[k]);
  if (!changed.length) return;
  useStore.setState({ buyers: s.buyers.map((x) => (x.id === orgId ? { ...x, ...patch } : x)) });
  s.log(actorId("u-buyer"), "Updated organisation details", "buyer", orgId, changed.join(", "));
}

export function cancelMeeting(id: string) {
  const s = useStore.getState();
  s.updateMeeting(id, { status: "cancelled" });
  const m = s.meetings.find((x) => x.id === id);
  s.notify({ audience: "admin", userId: null, type: "meeting_scheduled", title: "Meeting cancelled by buyer", body: m?.title ?? "", href: "/admin/opportunities" });
}
