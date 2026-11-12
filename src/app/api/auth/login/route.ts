import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { authenticate } from "@/lib/auth/accounts";
import { safeNext, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";
import type { Role } from "@/lib/types";

const Body = z.object({ email: z.string().email(), password: z.string().min(1), next: z.string().optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  const { email, password, next } = parsed.data;

  let account: { userId: string; role: Role } | null = null;
  const demo = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (demo) {
    if (demo.password === password) account = { userId: demo.userId, role: demo.role };
  } else {
    try {
      const user = await authenticate(email, password);
      if (user) account = { userId: user.id, role: user.role };
    } catch (e) {
      console.error("[auth/login] lookup failed", e);
      return NextResponse.json({ error: "Sign-in is temporarily unavailable. Try again shortly." }, { status: 503 });
    }
  }
  if (!account) return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const token = await signSession(account);
  const res = NextResponse.json({ ok: true, redirect: safeNext(account.role, next), role: account.role });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
