import type { Role } from "../types";

// Server-only module: imported by API route handlers, never by client components.
// Demo passwords can be overridden with environment variables. There is deliberately
// no demo Elets operations account: operations users are real accounts created with
// scripts/create-admin.mjs and sign in at the unlisted OPS_LOGIN_PATH.
export const DEMO_ACCOUNTS: { email: string; password: string; userId: string; role: Role }[] = [
  { email: "buyer@elets.demo", password: process.env.DEMO_BUYER_PASSWORD || "Buyer@2026", userId: "u-buyer", role: "buyer" },
  { email: "provider@elets.demo", password: process.env.DEMO_PROVIDER_PASSWORD || "Provider@2026", userId: "u-provider", role: "provider" },
];
