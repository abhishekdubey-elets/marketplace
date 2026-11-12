"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Handshake,
  LogOut,
  Menu,
  MessagesSquare,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { isDbMode, resetLocalData } from "@/lib/sync";
import { SAMPLE_DATA } from "@/lib/seed";
import type { NotificationType, Role, User } from "@/lib/types";
import { useLookups } from "@/lib/hooks";
import { Avatar, Kbd } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@/components/ui/overlay";
import { SEGMENT_LABEL, PORTAL_LABEL } from "./nav";
import { isForUser } from "@/lib/people";

export const NOTIF_ICON: Record<NotificationType, React.ElementType> = {
  requirement_submitted: ClipboardList,
  requirement_reviewed: ClipboardList,
  provider_matched: Target,
  intro_requested: Handshake,
  provider_shortlisted: Users,
  meeting_scheduled: CalendarDays,
  pro_updated: Sparkles,
  document_uploaded: FileText,
  verification_approved: ShieldCheck,
  new_opportunity: Target,
};

function Breadcrumbs() {
  const pathname = usePathname();
  const L = useLookups();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((seg, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const prev = parts[i - 1];
    let label = SEGMENT_LABEL[seg];
    if (!label) {
      if (prev === "requirements" || prev === "opportunities") label = L.requirement(seg)?.code ?? seg;
      else if (prev === "pro") label = L.engagement(seg)?.code ?? seg;
      else if (prev === "providers") label = (L.providerBySlug(seg) ?? L.provider(seg))?.name ?? seg;
      else label = seg;
    }
    return { href, label };
  });
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1 text-[13px] md:flex">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.href}>
          {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-4" />}
          {i === crumbs.length - 1 ? (
            <span className="truncate font-medium text-ink">{c.label}</span>
          ) : (
            <Link href={c.href} className="truncate text-ink-3 transition hover:text-ink">
              {c.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function NotificationBell({ role, user }: { role: Role; user: User }) {
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const mine = all.filter((n) => n.audience === role && isForUser(n, user));
  const unread = mine.filter((n) => !n.read).length;
  const list = (tab === "unread" ? mine.filter((n) => !n.read) : mine).slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative grid size-9 place-items-center rounded-lg text-ink-3 transition hover:bg-navy-50 hover:text-ink" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-flame-600 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-white">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(400px,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          <div className="flex items-center gap-1 text-xs">
            {(["all", "unread"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-2 py-1 font-medium capitalize transition", tab === t ? "bg-navy-50 text-ink" : "text-ink-3 hover:text-ink")}>
                {t}
                {t === "unread" && unread > 0 && ` (${unread})`}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollbar-thin max-h-[420px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <BellOff className="size-5 text-ink-4" />
              <p className="mt-2 text-sm font-medium text-ink">You&apos;re all caught up</p>
              <p className="text-xs text-ink-3">New activity will appear here.</p>
            </div>
          ) : (
            list.map((n) => {
              const I = NOTIF_ICON[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    router.push(n.href);
                  }}
                  className={cn("flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left transition last:border-0 hover:bg-subtle", !n.read && "bg-brand-50/40")}
                >
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", n.read ? "bg-navy-50 text-ink-3" : "bg-navy-900 text-white")}>
                    <I className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium text-ink">{n.title}</span>
                      <span className="shrink-0 text-[11px] text-ink-4">{timeAgo(n.at)}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-3">{n.body}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-flame-600" />}
                </button>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <button
            className="text-xs font-medium text-ink-3 hover:text-ink disabled:opacity-40"
            disabled={unread === 0}
            onClick={() => {
              markAll(role, user.id);
              toast.success("All notifications marked as read");
            }}
          >
            Mark all as read
          </button>
          <Link href={`/${role}/notifications`} onClick={() => setOpen(false)} className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu({ role, user }: { role: Role; user: User }) {
  const router = useRouter();
  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };
  const switchTo = async (r: Role) => {
    const res = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: r }) });
    const j = await res.json();
    if (j.redirect) {
      router.push(j.redirect);
      router.refresh();
    }
  };
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-navy-50" aria-label="Account menu">
          <Avatar initials={user.initials} size="sm" />
          <span className="hidden text-left leading-tight xl:block">
            <span className="block text-[13px] font-medium text-ink">{user.name}</span>
            <span className="block text-[11px] text-ink-3">{PORTAL_LABEL[role]}</span>
          </span>
        </button>
      </DropdownTrigger>
      <DropdownContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar initials={user.initials} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-3">{user.email}</p>
          </div>
        </div>
        <DropdownSeparator />
        {role === "provider" && (
          <DropdownItem icon={<UserCircle />} onSelect={() => router.push("/provider/profile")}>
            Company profile
          </DropdownItem>
        )}
        <DropdownItem icon={<MessagesSquare />} onSelect={() => router.push(`/${role}/messages`)}>
          Messages
        </DropdownItem>
        {SAMPLE_DATA && (
          <>
            <DropdownSeparator />
            <DropdownLabel>Demo — switch portal</DropdownLabel>
            {(["buyer", "provider"] as Role[])
              .filter((r) => r !== role)
              .map((r) => (
                <DropdownItem key={r} icon={<Users />} onSelect={() => switchTo(r)}>
                  View as demo {r}
                </DropdownItem>
              ))}
            {!isDbMode() && (
              <DropdownItem
                icon={<RotateCcw />}
                onSelect={() => {
                  if (resetLocalData()) toast.success("Demo data reset", { description: "All changes in this browser were cleared." });
                }}
              >
                Reset demo data
              </DropdownItem>
            )}
          </>
        )}
        <DropdownSeparator />
        <DropdownItem icon={<LogOut />} danger onSelect={signOut}>
          Sign out
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function Topbar({ role, user, onSearch, onMenu }: { role: Role; user: User; onSearch: () => void; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onSearch}
          className="flex h-9 items-center gap-2 rounded-lg border border-line bg-subtle px-3 text-[13px] text-ink-4 transition hover:border-line-strong hover:bg-white sm:w-64 lg:w-80"
          aria-label="Search"
        >
          <Search className="size-4" />
          <span className="hidden flex-1 text-left sm:inline">Search marketplace…</span>
          <span className="hidden items-center gap-0.5 sm:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
        <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
        {SAMPLE_DATA && (
          <Tooltip content="Demo environment — all organisations and data are fictional">
            <span className="hidden cursor-default items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 md:inline-flex">
              <span className="size-1.5 rounded-full bg-amber-500" /> Demo data
            </span>
          </Tooltip>
        )}
        <Tooltip content="Messages">
          <Link href={`/${role}/messages`} className="hidden size-9 place-items-center rounded-lg text-ink-3 transition hover:bg-navy-50 hover:text-ink sm:grid" aria-label="Messages">
            <MessagesSquare className="size-[18px]" />
          </Link>
        </Tooltip>
        <NotificationBell role={role} user={user} />
        <UserMenu role={role} user={user} />
      </div>
    </header>
  );
}
