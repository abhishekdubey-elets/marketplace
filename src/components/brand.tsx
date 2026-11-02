import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="elets-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3565fb" />
          <stop offset="1" stopColor="#14ae9f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0c1631" />
      <rect x="7" y="7.5" width="14" height="3.6" rx="1.8" fill="url(#elets-g)" />
      <rect x="7" y="14.2" width="18" height="3.6" rx="1.8" fill="url(#elets-g)" />
      <rect x="7" y="20.9" width="11" height="3.6" rx="1.8" fill="url(#elets-g)" />
      <circle cx="24.2" cy="9.3" r="2.2" fill="#2fcbbb" />
    </svg>
  );
}

export function Logo({ dark, className, href = "/", compact }: { dark?: boolean; className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="Elets Solution Marketplace home">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className={cn("block text-[15px] font-semibold tracking-tight", dark ? "text-white" : "text-ink")}>Elets</span>
          <span className={cn("block text-[10px] font-medium uppercase tracking-[0.14em]", dark ? "text-navy-300" : "text-ink-3")}>Solution Marketplace</span>
        </span>
      )}
    </Link>
  );
}
