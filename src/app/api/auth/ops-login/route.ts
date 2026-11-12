import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/auth/accounts";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

/** Elets operations sign-in. Only accounts with the admin role are accepted; everything else is a generic failure. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  let user;
  try {
    user = await authenticate(parsed.data.email, parsed.data.password);
  } catch (e) {
    console.error("[auth/ops-login] lookup failed", e);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });

  const token = await signSession({ userId: user.id, role: "admin" });
  const res = NextResponse.json({ ok: true, redirect: "/admin" });
  res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  return res;
}
