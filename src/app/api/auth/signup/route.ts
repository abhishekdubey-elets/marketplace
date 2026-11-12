import { NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { createAccount, emailTaken } from "@/lib/auth/accounts";
import { isDbConfigured } from "@/lib/db/records";
import { safeNext, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth/session";

const BUYER_TYPES = [
  "Government Department",
  "Public Sector Undertaking",
  "Hospital / Health System",
  "University / Institute",
  "School Network",
  "Bank / NBFC",
  "Insurance",
  "Urban Local Body",
] as const;

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const Body = z.object({
  role: z.enum(["buyer", "provider"]),
  name: text(2, 80),
  title: text(0, 80).default(""),
  email: z.string().trim().email().max(120),
  password: z.string().min(8, "Use at least 8 characters.").max(200),
  orgName: text(2, 120),
  city: text(0, 60).default(""),
  state: text(0, 60).default(""),
  size: z.enum(["1-50", "51-200", "201-1000", "1000+"]),
  buyerType: z.enum(BUYER_TYPES).optional(),
  website: text(0, 200).optional(),
  next: z.string().optional(),
});

/** Self-service sign-up for buyers and solution providers. Creates the account and signs the user in. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Sign-up needs the marketplace database, which isn't configured." }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first ? `${first.path.join(".") || "Form"}: ${first.message}` : "Check the form and try again." }, { status: 400 });
  }
  const input = parsed.data;
  if (input.role === "buyer" && !input.buyerType) return NextResponse.json({ error: "Choose your organisation type." }, { status: 400 });

  try {
    if (DEMO_ACCOUNTS.some((a) => a.email.toLowerCase() === input.email.toLowerCase()) || (await emailTaken(input.email))) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    const user = await createAccount(input);
    const token = await signSession({ userId: user.id, role: user.role });
    const home = user.role === "provider" ? "/provider/onboarding" : "/buyer";
    const redirect = input.next && safeNext(user.role, input.next) !== `/${user.role}` ? safeNext(user.role, input.next) : home;
    const res = NextResponse.json({ ok: true, redirect, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
    return res;
  } catch (e) {
    if (String((e as Error).message).includes("users_email_key")) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }
    console.error("[auth/signup] failed", e);
    return NextResponse.json({ error: "Couldn't create your account. Try again shortly." }, { status: 500 });
  }
}
