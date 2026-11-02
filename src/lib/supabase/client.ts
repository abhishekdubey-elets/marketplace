import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase integration boundary.
 *
 * The demo currently runs entirely on the mock data layer (src/lib/store.ts).
 * When NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set, these
 * helpers return real clients so store actions can be migrated one by one to
 * the tables in /supabase/schema.sql. Nothing in the UI uses them yet.
 */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getBrowserSupabase() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
