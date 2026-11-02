import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { ROLE_HOME, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";

const Body = z.object({ email: z.string().email(), password: z.string().min(1), next: z.string().optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const { email, password, next } = parsed.data;
  const acct = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
  if (!acct) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  const token = await signSession({ userId: acct.userId, role: acct.role });
  const dest = next && next.startsWith(ROLE_HOME[acct.role]) ? next : ROLE_HOME[acct.role];
  const res = NextResponse.json({ ok: true, redirect: dest, role: acct.role });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
