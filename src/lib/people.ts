import { TEAM, USERS } from "./data/taxonomy";
import type { Notification, User } from "./types";

type MemberLike = Pick<User, "id" | "name" | "title" | "initials" | "role">;
const members = new Map<string, MemberLike>();

/** Signed-up users (from the shared "members" collection), so their names resolve like the demo users. */
export function setMembers(list: MemberLike[]) {
  members.clear();
  for (const m of list) members.set(m.id, m);
}

/** Notification addressed to everyone in the role, to this user, or to this user's organisation ("org:<id>"). */
export function isForUser(n: Notification, user: Pick<User, "id" | "orgId">) {
  return n.userId === null || n.userId === user.id || (user.orgId !== null && n.userId === `org:${user.orgId}`);
}

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
  const u = USERS.find((x) => x.id === id) ?? members.get(id);
  if (u) return { id, name: u.name, title: u.title, initials: u.initials, kind: u.role === "admin" ? "team" : u.role };
  if (id === "buyer") return { id, name: "Buyer", title: "Buyer organisation", initials: "B", kind: "buyer" };
  return { id, name: "Elets System", title: "Automated", initials: "E", kind: "system" };
}
