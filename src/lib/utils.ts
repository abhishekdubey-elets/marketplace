import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats dates deterministically (no locale/timezone drift between server and client). Uses IST. */
function ist(d: string | Date) {
  const t = typeof d === "string" ? (d.length === 10 ? new Date(d + "T12:00:00+05:30") : new Date(d)) : d;
  return new Date(t.getTime() + 5.5 * 3600000);
}

export function formatDate(d: string | Date, opts: { year?: boolean } = {}) {
  const x = ist(d);
  const s = `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
  return opts.year === false ? s : `${s} ${x.getUTCFullYear()}`;
}

export function formatTime(d: string | Date) {
  const x = ist(d);
  let h = x.getUTCHours();
  const m = x.getUTCMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

export function formatDateTime(d: string | Date) {
  return `${formatDate(d, { year: false })}, ${formatTime(d)}`;
}

export function weekday(d: string | Date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][ist(d).getUTCDay()];
}

/** Demo "now" — the platform clock. Falls back to real time. */
export function nowTs() {
  return Date.now();
}

export function timeAgo(d: string) {
  const diff = (nowTs() - new Date(d.length === 10 ? d + "T12:00:00+05:30" : d).getTime()) / 1000;
  if (diff < 0) return "upcoming";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(d, { year: false });
}

export function daysUntil(d: string) {
  const t = new Date(d.length === 10 ? d + "T23:59:00+05:30" : d).getTime();
  return Math.ceil((t - nowTs()) / 86400000);
}

export function pluralize(n: number, word: string, plural?: string) {
  return `${n} ${n === 1 ? word : plural ?? word + "s"}`;
}

export function initials(name: string) {
  return name
    .replace(/^(Dr\.|Prof\.)\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
