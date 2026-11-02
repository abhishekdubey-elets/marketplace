import type { Role } from "../types";

/**
 * Minimal signed-cookie session used while Supabase Auth is not configured.
 * The cookie is httpOnly and HMAC-SHA256 signed with SESSION_SECRET so it
 * cannot be forged client-side. This is demo-grade auth: there is no user
 * database, password hashing, rotation or revocation.
 */
export const SESSION_COOKIE = "elets_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export interface Session {
  userId: string;
  role: Role;
  exp: number;
}

const enc = new TextEncoder();

function secret() {
  return process.env.SESSION_SECRET || "elets-demo-only-change-me-in-production";
}

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signSession(s: Omit<Session, "exp">): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })));
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const s = JSON.parse(fromB64url(payload)) as Session;
    if (s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

export const ROLE_HOME: Record<Role, string> = { buyer: "/buyer", provider: "/provider", admin: "/admin" };
