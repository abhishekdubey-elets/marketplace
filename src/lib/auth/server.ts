import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";
import { USERS } from "../data/taxonomy";

export async function getCurrentUser() {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  return USERS.find((u) => u.id === s.userId) ?? null;
}
