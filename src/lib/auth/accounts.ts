import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { ensureReady, isDbConfigured, sql, upsertQuery, type Collection } from "@/lib/db/records";
import type { BuyerOrg, BuyerType, CompanySize, Provider, User } from "@/lib/types";

/**
 * Self-service accounts for buyers and solution providers, stored in
 * marketplace.users (Neon). Passwords are hashed with scrypt. Elets operations
 * accounts are not self-service.
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(pw, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(expected, actual);
}

type Row = { id: string; email: string; password_hash: string; name: string; title: string; role: "buyer" | "provider" | "admin"; org_id: string; initials: string };
// Elets operations users have no organisation (stored as '')
const toUser = (r: Row): User => ({ id: r.id, name: r.name, email: r.email, role: r.role, title: r.title, orgId: r.org_id || null, initials: r.initials });

export async function findUserById(id: string): Promise<User | null> {
  if (!isDbConfigured()) return null;
  await ensureReady();
  const rows = (await sql()`select * from marketplace.users where id = ${id}`) as Row[];
  return rows[0] ? toUser(rows[0]) : null;
}

/** Returns the user if the email/password pair is valid. */
export async function authenticate(email: string, password: string): Promise<User | null> {
  if (!isDbConfigured()) return null;
  await ensureReady();
  const rows = (await sql()`select * from marketplace.users where email = ${email.trim().toLowerCase()}`) as Row[];
  if (!rows[0]) {
    await hashPassword(password); // keep response time similar for unknown emails
    return null;
  }
  return (await verifyPassword(password, rows[0].password_hash)) ? toUser(rows[0]) : null;
}

export async function emailTaken(email: string) {
  await ensureReady();
  const rows = (await sql()`select 1 from marketplace.users where email = ${email.trim().toLowerCase()}`) as unknown[];
  return rows.length > 0;
}

// ---------------------------------------------------------------- sign-up

export interface SignupInput {
  role: "buyer" | "provider";
  name: string;
  title: string;
  email: string;
  password: string;
  orgName: string;
  city: string;
  state: string;
  size: CompanySize;
  buyerType?: BuyerType;
  website?: string;
}

const INDUSTRY_FOR: Record<BuyerType, string> = {
  "Government Department": "gov",
  "Public Sector Undertaking": "psu",
  "Hospital / Health System": "health",
  "University / Institute": "edu",
  "School Network": "edu",
  "Bank / NBFC": "bfsi",
  Insurance: "bfsi",
  "Urban Local Body": "urban",
};

const LOGO_PAIRS: [string, string][] = [
  ["#3565fb", "#14ae9f"],
  ["#0c1631", "#3565fb"],
  ["#7c3aed", "#3565fb"],
  ["#0f766e", "#22c55e"],
  ["#b45309", "#f59e0b"],
  ["#be123c", "#fb7185"],
];

const initialsOf = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^(of|and|the|&)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "provider";

const rid = () => randomBytes(5).toString("hex");

async function uniqueSlug(base: string) {
  const rows = (await sql()`select data->>'slug' as slug from marketplace.records where collection = 'providers' and data->>'slug' like ${base + "%"}`) as { slug: string }[];
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

/** Creates the user and their organisation (buyer org or provider profile), and notifies Elets operations. */
export async function createAccount(input: SignupInput): Promise<User> {
  await ensureReady();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const title = input.title.trim();
  const orgName = input.orgName.trim();
  const today = new Date().toISOString().slice(0, 10);
  const at = new Date().toISOString();
  const userId = `u-${rid()}`;
  const initials = initialsOf(name);
  const ups: { c: Collection; id: string; d: unknown; pos?: "start" | "end" }[] = [];
  let orgId: string;

  if (input.role === "buyer") {
    orgId = `b-${rid()}`;
    const type = input.buyerType ?? "Government Department";
    const org: BuyerOrg = {
      id: orgId,
      name: orgName,
      type,
      industryId: INDUSTRY_FOR[type],
      city: input.city.trim(),
      state: input.state.trim(),
      size: input.size,
      contactName: name,
      contactEmail: email,
      joinedAt: today,
      status: "active",
      initials: initialsOf(orgName),
    };
    ups.push({ c: "buyers", id: orgId, d: org, pos: "start" });
  } else {
    orgId = `p-${rid()}`;
    const [from, to] = LOGO_PAIRS[Math.floor(Math.random() * LOGO_PAIRS.length)]!;
    const provider: Provider = {
      id: orgId,
      slug: await uniqueSlug(slugify(orgName)),
      name: orgName,
      tagline: "",
      description: "",
      logo: { initials: initialsOf(orgName), from, to },
      website: input.website?.trim() ?? "",
      hq: [input.city.trim(), input.state.trim()].filter(Boolean).join(", "),
      founded: new Date().getFullYear(),
      size: input.size,
      industries: [],
      categories: [],
      services: [],
      capabilities: [],
      regions: [],
      clientSegments: [],
      certifications: [],
      solutions: [],
      caseStudies: [],
      budgetBands: [],
      contact: { name, title, email, phone: "" },
      documents: [
        { id: `d-${rid()}`, name: "Certificate of incorporation", kind: "incorporation", status: "requested", uploadedAt: null },
        { id: `d-${rid()}`, name: "GST registration", kind: "gst", status: "requested", uploadedAt: null },
      ],
      // new profiles start unverified and outside matching until Elets reviews them
      verification: "unverified",
      verifiedAt: null,
      matchingEligible: false,
      listing: "standard",
      accountStatus: "active",
      joinedAt: today,
      profileViews: 0,
      profileViewsTrend: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    ups.push({ c: "providers", id: orgId, d: provider, pos: "start" });
  }

  const what = input.role === "buyer" ? "buyer organisation" : "solution provider";
  const ntId = `nt-${rid()}`;
  const alId = `al-${rid()}`;
  ups.push(
    { c: "members", id: userId, d: { id: userId, name, role: input.role, title, orgId, initials }, pos: "end" },
    {
      c: "notifications",
      id: ntId,
      pos: "start",
      d: {
        id: ntId,
        audience: "admin",
        userId: null,
        type: input.role === "buyer" ? "requirement_submitted" : "document_uploaded",
        title: `New ${what} registered`,
        body: `${orgName} signed up (${name}).`,
        href: input.role === "buyer" ? "/admin/buyers" : `/admin/providers/${orgId}`,
        at,
        read: false,
      },
    },
    { c: "audit", id: alId, pos: "start", d: { id: alId, actorId: userId, action: `Registered ${what}`, entity: input.role, entityId: orgId, detail: orgName, at } },
  );

  const q = sql();
  await q.transaction([
    q`insert into marketplace.users (id, email, password_hash, name, title, role, org_id, initials)
      values (${userId}, ${email}, ${await hashPassword(input.password)}, ${name}, ${title}, ${input.role}, ${orgId}, ${initials})`,
    upsertQuery(ups),
  ]);
  return { id: userId, name, email, role: input.role, title, orgId, initials };
}
