import type { Role } from "../types";

// Server-only module: imported by API route handlers, never by client components.
// Demo passwords can be overridden with environment variables.
export const DEMO_ACCOUNTS: { email: string; password: string; userId: string; role: Role }[] = [
  { email: "buyer@elets.demo", password: process.env.DEMO_BUYER_PASSWORD || "Buyer@2026", userId: "u-buyer", role: "buyer" },
  { email: "provider@elets.demo", password: process.env.DEMO_PROVIDER_PASSWORD || "Provider@2026", userId: "u-provider", role: "provider" },
  { email: "admin@elets.demo", password: process.env.DEMO_ADMIN_PASSWORD || "Admin@2026", userId: "u-admin", role: "admin" },
];
