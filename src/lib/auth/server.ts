import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";
import { USERS } from "../data/taxonomy";
import { findUserById } from "./accounts";

export async function getCurrentUser() {
  const jar = await cookies();
  const s = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const demo = USERS.find((u) => u.id === s.userId);
  if (demo) return demo;
  try {
    return await findUserById(s.userId);
  } catch (e) {
    console.error("[auth] user lookup failed", e);
    return null;
  }
}
