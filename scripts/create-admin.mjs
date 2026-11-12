#!/usr/bin/env node
/**
 * Create an Elets operations (admin) account, or reset its password.
 *
 *   node scripts/create-admin.mjs --email ops@example.com --name "Full Name" [--title "Role"] [--password "..."]
 *
 * Reads DATABASE_URL from the environment or .env.local. If --password is
 * omitted a strong random one is generated and printed once. Operations users
 * sign in at the unlisted OPS_LOGIN_PATH, never at /login.
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCb);

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    return readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const email = arg("email")?.trim().toLowerCase();
const name = arg("name")?.trim();
const title = arg("title")?.trim() ?? "Elets Operations";
let password = arg("password");
const url = databaseUrl();

if (!email || !/^\S+@\S+\.\S+$/.test(email) || !name) {
  console.error('Usage: node scripts/create-admin.mjs --email you@example.com --name "Full Name" [--title "Role"] [--password "..."]');
  process.exit(1);
}
if (!url) {
  console.error("DATABASE_URL is not set (environment or .env.local).");
  process.exit(1);
}
const generated = !password;
if (generated) password = randomBytes(18).toString("base64url"); // 24 chars, ~144 bits
if (password.length < 12) {
  console.error("Use a password of at least 12 characters for operations accounts.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("base64")}$${(await scrypt(password, salt, 64)).toString("base64")}`;
const initials =
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "EO";

const sql = neon(url);
await sql`create schema if not exists marketplace`;
await sql`create table if not exists marketplace.users (
  id text primary key, email text not null unique, password_hash text not null, name text not null,
  title text not null default '', role text not null, org_id text not null, initials text not null,
  created_at timestamptz not null default now())`;
await sql`alter table marketplace.users drop constraint if exists users_role_check`;
await sql`alter table marketplace.users add constraint users_role_check check (role in ('buyer', 'provider', 'admin'))`;
await sql`alter table marketplace.users add column if not exists owner boolean not null default false`;

const [existing] = await sql`select id, role from marketplace.users where email = ${email}`;
if (existing && existing.role !== "admin") {
  console.error(`${email} is already a ${existing.role} account; use a different email for operations.`);
  process.exit(1);
}
const id = existing?.id ?? `u-${randomBytes(5).toString("hex")}`;

await sql.transaction([
  // accounts created here are owners: the Team page can't remove or reset them
  sql`insert into marketplace.users (id, email, password_hash, name, title, role, org_id, initials, owner)
      values (${id}, ${email}, ${hash}, ${name}, ${title}, 'admin', '', ${initials}, true)
      on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name, title = excluded.title, owner = true`,
  // public profile so the name shows in history, notes and the audit log
  sql`insert into marketplace.records (collection, id, data, ord)
      values ('members', ${id}, ${JSON.stringify({ id, name, role: "admin", title, orgId: null, initials })}::jsonb,
              coalesce((select max(ord) from marketplace.records where collection = 'members'), 0) + 1)
      on conflict (collection, id) do update set data = excluded.data, updated_at = now()`,
  // Elets team entry (Team page); keeps phone/sectors if it already exists
  sql`insert into marketplace.records (collection, id, data, ord)
      values ('team', ${id}, ${JSON.stringify({ id, name, title, email, phone: "", initials, focus: [], active: true, hasLogin: true, owner: true })}::jsonb,
              coalesce((select max(ord) from marketplace.records where collection = 'team'), 0) + 1)
      on conflict (collection, id) do update
        set data = marketplace.records.data || ${JSON.stringify({ name, title, email, initials, active: true, hasLogin: true, owner: true })}::jsonb, updated_at = now()`,
]);

console.log(`${existing ? "Updated" : "Created"} operations account ${email} (${id}).`);
if (generated) console.log(`Password (shown once, store it in a password manager): ${password}`);
