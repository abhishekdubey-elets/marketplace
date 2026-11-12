"use client";

import { useShallow } from "zustand/react/shallow";
import { useStore } from "./store";
import type { TeamMember } from "./types";

/**
 * The managed Elets team (shared "team" collection, edited at /admin/team).
 * Inactive members stay resolvable for history but aren't offered for new work.
 */

export const isActive = (t: TeamMember) => t.active !== false;

/** Active team members (or all, for history views). */
export function useTeam(includeInactive = false): TeamMember[] {
  return useStore(useShallow((s) => (includeInactive ? s.team : s.team.filter(isActive))));
}

/** Select options for assigning work. */
export function useTeamOptions() {
  return useTeam().map((t) => ({ value: t.id, label: t.name }));
}

/** Look up any team member by id, including inactive ones. */
export function teamMember(id: string | null | undefined): TeamMember | undefined {
  if (!id) return undefined;
  return useStore.getState().team.find((t) => t.id === id);
}

/** Suggest a relationship manager: someone covering one of these industries, else the first active member. */
export function suggestRm(team: TeamMember[], industryIds: string[]): TeamMember | undefined {
  const active = team.filter(isActive);
  return active.find((t) => t.focus.some((f) => industryIds.includes(f))) ?? active[0];
}
