import { TEAM, USERS } from "./data/taxonomy";

export interface Person {
  id: string;
  name: string;
  title: string;
  initials: string;
  kind: "team" | "buyer" | "provider" | "system";
}

/** Resolves any actor id used in history, notes, messages and the audit log. */
export function person(id: string | null | undefined): Person {
  if (!id) return { id: "unassigned", name: "Unassigned", title: "", initials: "–", kind: "system" };
  const t = TEAM.find((x) => x.id === id);
  if (t) return { id, name: t.name, title: t.title, initials: t.initials, kind: "team" };
  const u = USERS.find((x) => x.id === id);
  if (u) return { id, name: u.name, title: u.title, initials: u.initials, kind: u.role === "admin" ? "team" : u.role };
  if (id === "buyer") return { id, name: "Buyer", title: "Buyer organisation", initials: "B", kind: "buyer" };
  return { id, name: "Elets System", title: "Automated", initials: "E", kind: "system" };
}
