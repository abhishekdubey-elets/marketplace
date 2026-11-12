import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { findUserById, hashPassword } from "@/lib/auth/accounts";
import { ensureReady, isDbConfigured, sql, upsertQuery } from "@/lib/db/records";
import type { TeamMember } from "@/lib/types";

/**
 * Manage an Elets team member's operations sign-in (Team page).
 * The sign-in's user id is the team member's id, so their actions and messages
 * resolve to their team profile.
 */
const Body = z.object({ memberId: z.string().min(1).max(120), action: z.enum(["create", "reset", "revoke"]) });

export async function POST(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "The database isn't configured." }, { status: 503 });
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  // the caller must be a current operations account, not just hold an old admin cookie
  const me = session?.role === "admin" ? await findUserById(session.userId) : null;
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Only Elets operations can manage sign-ins." }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { memberId, action } = parsed.data;

  await ensureReady();
  const q = sql();
  const [row] = (await q`select data from marketplace.records where collection = 'team' and id = ${memberId}`) as { data: TeamMember }[];
  if (!row) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  const member = row.data;
  const email = member.email.trim().toLowerCase();

  // Account owners can't be removed or reset by other operations users (a reset would hand over their password).
  const [target] = (await q`select owner from marketplace.users where id = ${memberId}`) as { owner: boolean }[];
  if (target?.owner && memberId !== me.id) {
    return NextResponse.json({ error: "This is an account owner. Owners are managed with scripts/create-admin.mjs." }, { status: 403 });
  }

  if (action === "revoke") {
    if (memberId === me.id) return NextResponse.json({ error: "You can't remove your own sign-in." }, { status: 400 });
    await q.transaction([
      q`delete from marketplace.users where id = ${memberId} and role = 'admin'`,
      q`update marketplace.records set data = data || '{"hasLogin": false}'::jsonb, updated_at = now() where collection = 'team' and id = ${memberId}`,
    ]);
    return NextResponse.json({ ok: true });
  }

  if (member.active === false) return NextResponse.json({ error: "Reactivate this team member first." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Add a valid email for this team member first; it becomes their sign-in." }, { status: 400 });
  const [taken] = (await q`select id, role from marketplace.users where email = ${email}`) as { id: string; role: string }[];
  if (taken && taken.id !== memberId) {
    return NextResponse.json({ error: `${email} is already used by another ${taken.role === "admin" ? "operations" : taken.role} account.` }, { status: 409 });
  }

  const password = randomBytes(18).toString("base64url");
  const hash = await hashPassword(password);
  const profile = { id: memberId, name: member.name, role: "admin", title: member.title, orgId: null, initials: member.initials };
  await q.transaction([
    q`insert into marketplace.users (id, email, password_hash, name, title, role, org_id, initials)
      values (${memberId}, ${email}, ${hash}, ${member.name}, ${member.title}, 'admin', '', ${member.initials})
      on conflict (id) do update set email = excluded.email, password_hash = excluded.password_hash, name = excluded.name, title = excluded.title, initials = excluded.initials`,
    upsertQuery([{ c: "members", id: memberId, d: profile, pos: "end" }]),
    q`update marketplace.records set data = data || '{"hasLogin": true}'::jsonb, updated_at = now() where collection = 'team' and id = ${memberId}`,
  ]);
  return NextResponse.json({ ok: true, email, password });
}
