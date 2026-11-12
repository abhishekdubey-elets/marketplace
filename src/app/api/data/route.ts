import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { applyOps, isDbConfigured, readAll, type Collection } from "@/lib/db/records";
import { PUBLIC_COLLECTIONS, SHARED_COLLECTIONS } from "@/lib/seed";

export const dynamic = "force-dynamic";

const COLLECTIONS = [...SHARED_COLLECTIONS, "content"] as [Collection, ...Collection[]];
const Ops = z.object({
  ops: z
    .array(
      z.discriminatedUnion("op", [
        z.object({ op: z.literal("upsert"), c: z.enum(COLLECTIONS), id: z.string().min(1).max(120), d: z.record(z.string(), z.unknown()), pos: z.enum(["start", "end"]).optional() }),
        z.object({ op: z.literal("delete"), c: z.enum(COLLECTIONS), id: z.string().min(1).max(120) }),
      ]),
    )
    .min(1)
    .max(500),
});

async function session() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Shared data. Signed-out visitors get only the public directory collections and site content. */
export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ configured: false });
  const s = await session();
  try {
    const data = await readAll(s ? undefined : [...PUBLIC_COLLECTIONS, "content"]);
    return NextResponse.json({ configured: true, data }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[api/data] read failed", e);
    return NextResponse.json({ error: "Could not load data." }, { status: 500 });
  }
}

/** Save a batch of changes from the client store. Requires a signed-in session. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  if (!(await session())) return NextResponse.json({ error: "Sign in to make changes." }, { status: 401 });
  const parsed = Ops.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid change set." }, { status: 400 });
  // the site content row has a fixed id
  if (parsed.data.ops.some((o) => o.c === "content" && o.id !== "site")) return NextResponse.json({ error: "Invalid change set." }, { status: 400 });
  try {
    await applyOps(parsed.data.ops);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data] write failed", e);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }
}
