import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand colours of the Elets Solution Marketplace logo. */
export const BRAND = { red: "#e5202e", navy: "#0b1f4d" } as const;

/** The "E": a red ribbon with flat arms (viewBox 0 0 64 64). */
const E_PATH = "M57 6H32a26 26 0 0 0 0 52h25l-4-10H32a16 16 0 0 1 0-32h21Z";
/** Middle bar of the E, reaching out and breaking into pixels: the digital marketplace connecting both sides. */
const BAR_PATH = "M27 27h18v10H27a5 5 0 0 1 0-10Z";

function MarkShapes({ bar }: { bar: string }) {
  return (
    <>
      <path d={E_PATH} fill={BRAND.red} />
      <path d={BAR_PATH} fill={bar} />
      <rect x="47" y="27" width="4.5" height="4.5" rx=".6" fill={bar} />
      <rect x="47" y="32.5" width="4.5" height="4.5" rx=".6" fill={bar} />
      <rect x="53" y="27" width="4.5" height="4.5" rx=".6" fill={BRAND.red} />
    </>
  );
}

/**
 * The logo mark.
 * - `tile` (default): on a navy rounded square, for app icons and tight spaces.
 * - `plain`: the mark alone; set `inverted` on dark backgrounds.
 */
export function LogoMark({ className, size = 28, variant = "tile", inverted }: { className?: string; size?: number; variant?: "tile" | "plain"; inverted?: boolean }) {
  if (variant === "plain")
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
        <MarkShapes bar={inverted ? "#fff" : BRAND.navy} />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill={BRAND.navy} />
      <g transform="translate(6 6) scale(.8125)">
        <MarkShapes bar="#fff" />
      </g>
    </svg>
  );
}

/** Wordmark: "elets" with the brand red "e", over "Solution Marketplace". */
export function Wordmark({ dark, className, size = "md" }: { dark?: boolean; className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className={cn("leading-none", className)}>
      <span className={cn("block font-extrabold tracking-[-0.035em]", lg ? "text-[28px]" : "text-[19px]", dark ? "text-white" : "text-[#0b1f4d]")}>
        <span className="text-[#e5202e]">e</span>lets
      </span>
      <span className={cn("block whitespace-nowrap font-semibold uppercase", lg ? "mt-1.5 text-[11px] tracking-[0.2em]" : "mt-[3px] text-[8.5px] tracking-[0.17em]", dark ? "text-navy-200" : "text-[#0b1f4d]")}>
        Solution Marketplace
      </span>
    </span>
  );
}

export function Logo({ dark, className, href = "/", compact, size = "md" }: { dark?: boolean; className?: string; href?: string; compact?: boolean; size?: "md" | "lg" }) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", size === "lg" ? "gap-3" : "gap-2", className)} aria-label="Elets Solution Marketplace home">
      <LogoMark variant="plain" inverted={dark} size={size === "lg" ? 44 : 32} />
      {!compact && <Wordmark dark={dark} size={size} />}
    </Link>
  );
}
