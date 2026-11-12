"use client";

import { toast } from "sonner";
import { persistMode, useHydration, useStore } from "./store";
import { SHARED_COLLECTIONS, type DataState, type SharedCollection } from "./seed";

/**
 * Keeps the client store in step with the shared Neon database.
 *
 * Store actions stay synchronous and update the UI immediately. This module
 * watches every state change, works out which entities were added, changed or
 * removed (by object identity — actions always replace what they change), and
 * sends those records to /api/data in small debounced batches. Other people's
 * changes are pulled every 20s and whenever the tab regains focus.
 *
 * When DATABASE_URL is not set the API reports `configured: false` and the
 * store keeps its original per-browser localStorage behaviour.
 */

type Collection = SharedCollection | "content";
type Op = { op: "upsert"; c: Collection; id: string; d: unknown; pos?: "start" | "end" } | { op: "delete"; c: Collection; id: string };

const POLL_MS = 20_000;
const DEBOUNCE_MS = 300;

let dbMode = false; // mirrored into persistMode.personalOnly
let started = false;
let applyingRemote = false;
let changeCounter = 0;
let failedNotified = false;
const pending = new Map<string, Op>();
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;

/** True once data is coming from the shared database. */
export const isDbMode = () => dbMode;

// ------------------------------------------------------------------ outgoing

function queue(op: Op) {
  pending.set(`${op.c}\u0000${op.id}`, op);
  changeCounter++;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flush(), DEBOUNCE_MS);
}

function diff(prev: DataState, next: DataState) {
  for (const c of SHARED_COLLECTIONS) {
    const a = prev[c] as { id: string }[];
    const b = next[c] as { id: string }[];
    if (a === b) continue;
    const before = new Map(a.map((x) => [x.id, x]));
    b.forEach((x, i) => {
      const old = before.get(x.id);
      if (old !== x) queue({ op: "upsert", c, id: x.id, d: x, pos: old ? undefined : i === 0 && b.length > 1 ? "start" : "end" });
      before.delete(x.id);
    });
    for (const id of before.keys()) queue({ op: "delete", c, id });
  }
  if (prev.content !== next.content) queue({ op: "upsert", c: "content", id: "site", d: next.content });
}

async function send(ops: Op[], keepalive = false) {
  const res = await fetch("/api/data", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ops }), keepalive });
  if (res.status === 401) return; // signed out: nothing to save
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`);
}

async function flush(keepalive = false): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  if (inflight) {
    await inflight;
    if (pending.size) return flush(keepalive);
    return;
  }
  if (!pending.size) return;
  const batch = [...pending.entries()];
  pending.clear();
  inflight = (async () => {
    try {
      for (let i = 0; i < batch.length; i += 400) await send(batch.slice(i, i + 400).map(([, op]) => op), keepalive);
      failedNotified = false;
    } catch (e) {
      // put back anything that hasn't been superseded, and retry shortly
      for (const [k, op] of batch) if (!pending.has(k)) pending.set(k, op);
      if (!failedNotified) {
        failedNotified = true;
        toast.error("Couldn't save your latest changes", { description: `${(e as Error).message}. Retrying…` });
      }
      timer = setTimeout(() => void flush(), 4000);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// ------------------------------------------------------------------ incoming

type Remote = Partial<Pick<DataState, SharedCollection | "content">>;

function applyRemote(data: Remote) {
  const cur = useStore.getState();
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    // skip collections that haven't changed so the UI doesn't re-render needlessly
    if (JSON.stringify(cur[k as keyof DataState]) !== JSON.stringify(v)) patch[k] = v;
  }
  if (!Object.keys(patch).length) return;
  applyingRemote = true;
  try {
    useStore.setState(patch as Partial<DataState>);
  } finally {
    applyingRemote = false;
  }
}

async function fetchRemote(): Promise<{ configured: boolean; data?: Remote }> {
  const res = await fetch("/api/data", { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Pull the latest shared data. Skipped (unless forced) while local changes are still being saved. */
export async function refresh(force = false) {
  if (!dbMode) return;
  if (!force && (pending.size || inflight)) return;
  const counter = changeCounter;
  try {
    const j = await fetchRemote();
    if (!force && counter !== changeCounter) return; // a local edit happened meanwhile; next poll catches up
    if (j.data) applyRemote(j.data);
  } catch {
    /* offline or transient — try again on the next poll */
  }
}

// ------------------------------------------------------------------ lifecycle

/** Load shared data and start syncing. Resolves once the store holds server data (or local data when no DB). */
export async function startSync() {
  if (started) return;
  started = true;
  let j: { configured: boolean; data?: Remote };
  try {
    j = await fetchRemote();
  } catch {
    toast.error("Couldn't reach the marketplace database", { description: "Showing demo data; changes may not be saved." });
    return;
  }
  if (!j.configured) return; // no database: keep per-browser localStorage behaviour
  dbMode = true;
  persistMode.personalOnly = true;
  if (j.data) applyRemote(j.data);

  useStore.subscribe((next, prev) => {
    if (!applyingRemote) diff(prev, next);
  });
  setInterval(() => document.visibilityState === "visible" && void refresh(), POLL_MS);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && void refresh());
  window.addEventListener("pagehide", () => void flush(true));
}

/** After sign-in/out the visible collections change (signed-out visitors only get public ones). */
export async function reloadForSession() {
  if (!dbMode) return;
  await flush();
  useHydration.setState({ hydrated: false });
  await refresh(true);
  useHydration.setState({ hydrated: true });
}

/** "Reset demo data" for the no-database mode only: clears this browser's copy. Shared data is never reset from the UI. */
export function resetLocalData() {
  if (dbMode) return false;
  useStore.getState().resetDemo();
  return true;
}
