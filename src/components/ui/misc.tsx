import * as React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Provider, VerificationStatus } from "@/lib/types";
import { VERIFICATION_LABEL } from "@/lib/labels";
import { scoreTone } from "@/lib/matching";

// ------------------------------------------------------------------ avatars & logos

const AVATAR_BG = ["bg-brand-100 text-brand-800", "bg-accent-100 text-accent-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-800", "bg-navy-100 text-navy-700"];

export function Avatar({ initials, size = "md", className, tone }: { initials: string; size?: "xs" | "sm" | "md" | "lg"; className?: string; tone?: number }) {
  const s = { xs: "size-6 text-[10px]", sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-11 text-sm" }[size];
  const idx = tone ?? (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_BG.length;
  return <span className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-white", s, AVATAR_BG[idx], className)}>{initials}</span>;
}

export function ProviderLogo({ provider, size = "md", className }: { provider: Pick<Provider, "logo" | "name">; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = { sm: "size-8 text-[11px] rounded-lg", md: "size-10 text-xs rounded-xl", lg: "size-14 text-base rounded-2xl", xl: "size-20 text-xl rounded-2xl" }[size];
  return (
    <span
      aria-label={`${provider.name} logo`}
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden font-bold tracking-tight text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]", s, className)}
      style={{ background: `linear-gradient(135deg, ${provider.logo.from}, ${provider.logo.to})` }}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.28),transparent_60%)]" />
      <span className="relative">{provider.logo.initials}</span>
    </span>
  );
}

export function OrgAvatar({ initials, size = "md", className }: { initials: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "size-8 text-[11px] rounded-lg", md: "size-10 text-xs rounded-xl", lg: "size-14 text-base rounded-2xl" }[size];
  return <span className={cn("inline-grid shrink-0 place-items-center border border-line bg-gradient-to-br from-white to-navy-50 font-semibold text-navy-700", s, className)}>{initials}</span>;
}

// ------------------------------------------------------------------ verification

export function VerificationBadge({ status, compact }: { status: VerificationStatus; compact?: boolean }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100">
        <BadgeCheck className="size-3.5 fill-brand-600 text-white" />
        {compact ? "Verified" : "Elets Verified"}
      </span>
    );
  if (status === "pending" || status === "docs_requested")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-100">
        <Clock className="size-3.5" />
        {VERIFICATION_LABEL[status]}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-ink-3 ring-1 ring-inset ring-navy-100">
      <ShieldAlert className="size-3.5" />
      {VERIFICATION_LABEL[status]}
    </span>
  );
}

// ------------------------------------------------------------------ layout pieces

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-3">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  trend,
  href,
  accent = "brand",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  href?: string;
  accent?: "brand" | "accent" | "violet" | "amber" | "navy";
  className?: string;
}) {
  const a = {
    brand: "bg-navy-900 text-white",
    accent: "bg-flame-50 text-flame-600 ring-1 ring-inset ring-flame-100",
    violet: "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100",
    amber: "bg-navy-50 text-navy-900 ring-1 ring-inset ring-navy-100",
    navy: "bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100",
  }[accent];
  const body = (
    <div className={cn("group relative h-full overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-card transition duration-300", href && "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised", className)}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-navy-900 via-brand-600 to-flame-600 transition-transform duration-500 group-hover:scale-x-100" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-3">{label}</p>
        {icon && <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", a)}>{icon}</span>}
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy-900 tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend && <span className={cn("font-medium", trend.positive === false ? "text-red-600" : "text-emerald-600")}>{trend.value}</span>}
        {hint && <span className="truncate text-ink-3">{hint}</span>}
        {href && <ChevronRight className="ml-auto size-4 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink-2" />}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-brand-50/70" />
        <div className="relative grid size-12 place-items-center rounded-2xl border border-line bg-white text-brand-600 shadow-card [&_svg]:size-5">{icon}</div>
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[108px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-white px-1 font-mono text-[10px] font-medium text-ink-3 shadow-xs", className)}>{children}</kbd>;
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4", className)}>{children}</p>;
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-line", className)} />;
}

// ------------------------------------------------------------------ match score

const RING: Record<ReturnType<typeof scoreTone>, { stroke: string; text: string; bg: string }> = {
  strong: { stroke: "#14ae9f", text: "text-accent-700", bg: "bg-accent-50" },
  good: { stroke: "#2149e8", text: "text-brand-700", bg: "bg-brand-50" },
  partial: { stroke: "#e8a33d", text: "text-amber-700", bg: "bg-amber-50" },
  low: { stroke: "#98a2b3", text: "text-ink-3", bg: "bg-navy-50" },
};

export function ScoreRing({ score, size = 56, stroke = 5, showLabel = true, className }: { score: number; size?: number; stroke?: number; showLabel?: boolean; className?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = RING[scoreTone(score)];
  return (
    <div className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }} role="img" aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e6e8ee" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      {showLabel && (
        <span className={cn("absolute font-semibold tabular-nums tracking-tight text-ink", size >= 72 ? "text-lg" : size >= 52 ? "text-sm" : "text-[11px]")}>
          {score}
          <span className="text-[0.7em] text-ink-3">%</span>
        </span>
      )}
    </div>
  );
}

export function ScorePill({ score, label }: { score: number; label?: string }) {
  const tone = RING[scoreTone(score)];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold", tone.bg, tone.text)}>
      <span className="size-1.5 rounded-full" style={{ background: tone.stroke }} />
      {score}% {label && <span className="font-medium opacity-80">· {label}</span>}
    </span>
  );
}

export function DimensionBar({ label, value, weight }: { label: string; value: number; weight?: number }) {
  const tone = RING[scoreTone(value)];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-ink-2">{label}</span>
        <span className="shrink-0 tabular-nums text-ink-3">
          {weight !== undefined && <span className="mr-2 text-ink-4">w{weight}</span>}
          <span className="font-semibold text-ink">{value}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-navy-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: tone.stroke }} />
      </div>
    </div>
  );
}
