"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LifeBuoy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import { Logo, LogoMark } from "@/components/brand";
import { Tooltip } from "@/components/ui/overlay";
import { NAV, PORTAL_LABEL, type NavItem } from "./nav";
import { TEAM } from "@/lib/data/taxonomy";
import { isForUser } from "@/lib/people";

function useBadgeCounts(role: Role, user: User) {
  const notifications = useStore((s) => s.notifications);
  const threads = useStore((s) => s.threads);
  const providers = useStore((s) => s.providers);
  const requirements = useStore((s) => s.requirements);
  const matches = useStore((s) => s.matches);
  const proRequests = useStore((s) => s.proRequests);
  return React.useMemo(() => {
    const mine = (uid: string) => (role === "admin" ? true : uid === user.id);
    return {
      notifications: notifications.filter((n) => n.audience === role && !n.read && isForUser(n, user)).length,
      messages: threads.filter((t) => t.unreadBy.includes(user.id) && t.participants.some(mine)).length,
      pendingVerifications: providers.filter((p) => p.verification === "pending" || p.verification === "unverified").length,
      newRequirements: requirements.filter((r) => r.stage === "submitted").length,
      pendingMatches: matches.filter((m) => m.status === "suggested").length,
      opportunities: matches.filter((m) => m.providerId === user.orgId && ["approved", "shortlisted", "intro_requested"].includes(m.status) && m.providerInterest === "none").length,
      proRequests: proRequests.filter((r) => r.status === "new").length,
    } as Record<NonNullable<NavItem["badge"]>, number>;
  }, [notifications, threads, providers, requirements, matches, proRequests, role, user]);
}

export function SidebarNav({ role, user, collapsed, onNavigate }: { role: Role; user: User; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const counts = useBadgeCounts(role, user);
  const groups = NAV[role];
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));
  // Prefer the most specific active item when items share a prefix.
  const activeHref = groups
    .flatMap((g) => g.items)
    .filter(isActive)
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="space-y-5" aria-label="Primary">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && !collapsed && <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-4">{g.label}</p>}
          {g.label && collapsed && <div className="mx-auto mb-2 h-px w-6 bg-line" />}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = item.href === activeHref;
              const count = item.badge ? counts[item.badge] : 0;
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                    active ? "bg-white text-ink shadow-[0_1px_2px_rgb(16_24_40/0.06),0_0_0_1px_rgb(16_24_40/0.05)]" : "text-ink-2 hover:bg-white/70 hover:text-ink",
                    collapsed && "justify-center px-0",
                  )}
                >
                  {active && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600" />}
                  <item.icon className={cn("size-[17px] shrink-0", active ? "text-brand-600" : item.pro ? "text-accent-600" : "text-ink-4 group-hover:text-ink-2")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.pro && <span className="rounded bg-gradient-to-r from-brand-600 to-accent-500 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-white">Pro</span>}
                  {count > 0 && !collapsed && <span className="ml-auto rounded-full bg-brand-600 px-1.5 py-px text-[10px] font-semibold tabular-nums text-white">{count}</span>}
                  {count > 0 && collapsed && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-600 ring-2 ring-canvas" />}
                </Link>
              );
              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip content={item.label} side="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ role, collapsed }: { role: Role; collapsed: boolean }) {
  const rm = TEAM.find((t) => t.id === (role === "buyer" ? "t-priya" : role === "provider" ? "t-neha" : ""));
  if (collapsed) return null;
  if (role === "admin")
    return (
      <div className="rounded-xl border border-line bg-white p-3 text-xs shadow-xs">
        <p className="font-semibold text-ink">Integrity controls active</p>
        <p className="mt-1 leading-relaxed text-ink-3">Listing packages are excluded from match scoring. All admin actions are audit-logged.</p>
      </div>
    );
  return (
    <div className="space-y-2">
      {role === "buyer" && (
        <Link href="/buyer/pro" className="group block overflow-hidden rounded-xl bg-navy-900 p-3 text-xs text-white shadow-raised">
          <div className="pointer-events-none absolute" />
          <div className="flex items-center gap-1.5 font-semibold">
            <Sparkles className="size-3.5 text-accent-300" /> Elets Pro
          </div>
          <p className="mt-1 leading-relaxed text-navy-200">Managed support from brief to award.</p>
          <span className="mt-2 inline-block font-medium text-accent-300 group-hover:underline">Explore engagements →</span>
        </Link>
      )}
      {rm && (
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 shadow-xs">
          <span className="grid size-8 place-items-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">{rm.initials}</span>
          <div className="min-w-0 text-xs">
            <p className="truncate font-medium text-ink">{rm.name}</p>
            <p className="truncate text-ink-3">Your Elets contact</p>
          </div>
          <Link href={`/${role}/messages`} className="ml-auto grid size-7 place-items-center rounded-md text-ink-4 hover:bg-navy-50 hover:text-ink" aria-label="Message your Elets contact">
            <LifeBuoy className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ role, user, collapsed, onToggle }: { role: Role; user: User; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-canvas transition-[width] duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex h-14 items-center", collapsed ? "justify-center" : "px-4")}>
        {collapsed ? <Link href={`/${role}`} aria-label="Home"><LogoMark /></Link> : <Logo href={`/${role}`} />}
      </div>
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-lg border border-line bg-white px-2.5 py-2 shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">{PORTAL_LABEL[role]}</p>
          <OrgName user={user} />
        </div>
      )}
      <div className={cn("scrollbar-thin flex-1 overflow-y-auto pb-4", collapsed ? "px-2.5" : "px-3")}>
        <SidebarNav role={role} user={user} collapsed={collapsed} />
      </div>
      <div className={cn("space-y-2 border-t border-line p-3")}>
        <SidebarFooter role={role} collapsed={collapsed} />
        <button
          onClick={onToggle}
          className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-3 transition hover:bg-white hover:text-ink", collapsed && "justify-center px-0")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function OrgName({ user }: { user: User }) {
  const buyer = useStore((s) => s.buyers.find((b) => b.id === user.orgId));
  const provider = useStore((s) => s.providers.find((p) => p.id === user.orgId));
  const name = user.role === "admin" ? "Elets Marketplace Operations" : user.role === "buyer" ? buyer?.name : provider?.name;
  return <p className="truncate text-[13px] font-semibold text-ink">{name}</p>;
}
