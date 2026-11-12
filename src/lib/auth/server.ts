import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";
import { USERS } from "../data/taxonomy";
import { DEMO_ACCOUNTS } from "./demo-accounts";
import { findUserById } from "./accounts";

export async function getCurrentUser() {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const demo = DEMO_ACCOUNTS.some((a) => a.userId === s.userId) ? USERS.find((u) => u.id === s.userId) : undefined;
  if (demo) return demo;
  try {
    return await findUserById(s.userId);
  } catch (e) {
    console.error("[auth] user lookup failed", e);
    return null;
  }
}
