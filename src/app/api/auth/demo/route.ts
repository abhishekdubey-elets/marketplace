import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { safeNext, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";

// One-click demo sign-in for presentations. Disable by setting DISABLE_DEMO_LOGIN=true.
const Body = z.object({ role: z.enum(["buyer", "provider"]), next: z.string().optional() });

export async function POST(req: Request) {
  if (process.env.DISABLE_DEMO_LOGIN === "true") return NextResponse.json({ error: "Demo sign-in is disabled." }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
  const acct = DEMO_ACCOUNTS.find((a) => a.role === parsed.data.role)!;
  const token = await signSession({ userId: acct.userId, role: acct.role });
  const res = NextResponse.json({ ok: true, redirect: safeNext(acct.role, parsed.data.next) });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
