import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { isDbConfigured, resetAll } from "@/lib/db/records";

/** Restore the starting dataset for everyone. Elets operations only. */
export async function POST() {
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (s?.role !== "admin") return NextResponse.json({ error: "Only Elets operations can reset shared data." }, { status: 403 });
  try {
    await resetAll();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data/reset] failed", e);
    return NextResponse.json({ error: "Reset failed." }, { status: 500 });
  }
}
