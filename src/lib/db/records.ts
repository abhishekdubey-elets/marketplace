import { neon } from "@neondatabase/serverless";
import { seed, SHARED_COLLECTIONS, type DataState, type SharedCollection } from "@/lib/seed";

/**
 * Shared marketplace data in Neon Postgres.
 *
 * Every entity (provider, requirement, match, notification, ...) is one row in
 * marketplace.records keyed by (collection, id), with the entity as jsonb. `ord`
 * keeps each collection in the order the UI expects (newest-first lists get
 * prepended, others appended). Site content is the single row ("content", "site").
 *
 * Everything lives in its own `marketplace` schema so it never collides with
 * other applications' tables in the same database.
 */

export type Collection = SharedCollection | "content";
export type UpsertOp = { op: "upsert"; c: Collection; id: string; d: unknown; pos?: "start" | "end" };
export type DeleteOp = { op: "delete"; c: Collection; id: string };
export type Op = UpsertOp | DeleteOp;

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

let _sql: ReturnType<typeof neon> | null = null;
export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (_sql ??= neon(process.env.DATABASE_URL));
}

let ready: Promise<void> | null = null;

/** Create the schema/table if needed and fill it with the starting dataset when empty. */
export function ensureReady(): Promise<void> {
  ready ??= (async () => {
    const q = sql();
    await q`create schema if not exists marketplace`;
    await q`create table if not exists marketplace.records (
      collection text not null,
      id text not null,
      data jsonb not null,
      ord double precision not null default 0,
      updated_at timestamptz not null default now(),
      primary key (collection, id)
    )`;
    await q`create table if not exists marketplace.users (
      id text primary key,
      email text not null unique,
      password_hash text not null,
      name text not null,
      title text not null default '',
      role text not null,
      org_id text not null,
      initials text not null,
      created_at timestamptz not null default now()
    )`;
    // role constraint (re)defined separately so existing tables pick up the 'admin' role
    await q`alter table marketplace.users drop constraint if exists users_role_check`;
    await q`alter table marketplace.users add constraint users_role_check check (role in ('buyer', 'provider', 'admin'))`;
    const [{ n }] = (await q`select count(*)::int as n from marketplace.records`) as { n: number }[];
    if (n === 0) await insertSeed();
    else {
      // databases seeded before the members collection existed: add the demo members once
      const [{ m }] = (await q`select count(*)::int as m from marketplace.records where collection = 'members'`) as { m: number }[];
      if (m === 0) await insertSeed(["members"]);
    }
  })().catch((e) => {
    ready = null; // let the next request retry
    throw e;
  });
  return ready;
}

function seedRows(only?: Collection[]) {
  const s = seed();
  const rows: { c: Collection; id: string; d: unknown; o: number }[] = [];
  for (const c of SHARED_COLLECTIONS) if (!only || only.includes(c)) (s[c] as { id: string }[]).forEach((d, i) => rows.push({ c, id: d.id, d, o: i }));
  if (!only || only.includes("content")) rows.push({ c: "content", id: "site", d: s.content, o: 0 });
  return rows;
}

async function insertSeed(only?: Collection[]) {
  await sql()`
    insert into marketplace.records (collection, id, data, ord)
    select r->>'c', r->>'id', r->'d', (r->>'o')::double precision
    from jsonb_array_elements(${JSON.stringify(seedRows(only))}::jsonb) r
    on conflict (collection, id) do nothing`;
}

/** Read shared collections (all, or only the listed ones). */
export async function readAll(only?: readonly Collection[]): Promise<Partial<Pick<DataState, SharedCollection | "content">>> {
  await ensureReady();
  const rows = (only
    ? await sql()`select collection, data from marketplace.records where collection = any(${only as string[]}) order by collection, ord, id`
    : await sql()`select collection, data from marketplace.records order by collection, ord, id`) as { collection: Collection; data: unknown }[];
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    if (r.collection === "content") out.content = r.data;
    else ((out[r.collection] ??= []) as unknown[]).push(r.data);
  }
  // A collection with no rows (e.g. every announcement deleted) still needs to come back empty.
  for (const c of only ?? SHARED_COLLECTIONS) if (c !== "content" && !(c in out)) out[c] = [];
  return out as Partial<Pick<DataState, SharedCollection | "content">>;
}

/** Apply a batch of upserts/deletes atomically. New rows are placed at the start or end of their collection. */
export async function applyOps(ops: Op[]) {
  await ensureReady();
  const ups = ops.filter((o): o is UpsertOp => o.op === "upsert").map((o) => ({ c: o.c, id: o.id, d: o.d, pos: o.pos ?? ("end" as const) }));
  const dels = ops.filter((o): o is DeleteOp => o.op === "delete").map((o) => ({ c: o.c, id: o.id }));
  const q = sql();
  await q.transaction([upsertQuery(ups), deleteQuery(dels)]);
}

/** Insert/update records; new rows go to the start or end of their collection. Usable inside sql().transaction([...]). */
export function upsertQuery(ups: { c: Collection; id: string; d: unknown; pos?: "start" | "end" }[]) {
  const q = sql();
  return q`
      insert into marketplace.records (collection, id, data, ord)
      select o->>'c', o->>'id', o->'d',
        case when o->>'pos' = 'start'
          then coalesce((select min(r.ord) from marketplace.records r where r.collection = o->>'c'), 0) - k
          else coalesce((select max(r.ord) from marketplace.records r where r.collection = o->>'c'), 0) + k
        end
      from jsonb_array_elements(${JSON.stringify(ups)}::jsonb) with ordinality as t(o, k)
      on conflict (collection, id) do update set data = excluded.data, updated_at = now()`;
}

export function deleteQuery(dels: { c: Collection; id: string }[]) {
  return sql()`
      delete from marketplace.records r
      using jsonb_array_elements(${JSON.stringify(dels)}::jsonb) o
      where r.collection = o->>'c' and r.id = o->>'id'`;
}

/** Wipe and reload the starting dataset (admin "Reset demo data"). */
export async function resetAll() {
  await ensureReady();
  await sql()`delete from marketplace.records`;
  await insertSeed();
}
