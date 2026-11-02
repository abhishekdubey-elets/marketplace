"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Role, User } from "@/lib/types";
import { useHydration } from "@/lib/store";
import { useLocalStorage } from "@/lib/hooks";
import { PageSkeleton } from "@/components/ui/misc";
import { Logo } from "@/components/brand";
import { Sidebar, SidebarNav, OrgName } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { PORTAL_LABEL } from "./nav";

function DeniedToast() {
  const params = useSearchParams();
  const denied = params.get("denied");
  React.useEffect(() => {
    if (denied) toast.error("Access restricted", { description: `That area is only available to ${denied === "admin" ? "Elets operations" : denied} accounts.` });
  }, [denied]);
  return null;
}

export function AppShell({ role, user, children }: { role: Role; user: User; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useLocalStorage("elets-sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const hydrated = useHydration((s) => s.hydrated);
  const pathname = usePathname();

  React.useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar role={role} user={user} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <D.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-navy-950/40 animate-fade-in lg:hidden" />
          <D.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-canvas shadow-overlay outline-none animate-[fade-in_0.2s] lg:hidden">
            <D.Title className="sr-only">Navigation</D.Title>
            <D.Description className="sr-only">Portal navigation</D.Description>
            <div className="flex h-14 items-center justify-between px-4">
              <Logo href={`/${role}`} />
              <D.Close className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-white" aria-label="Close navigation">
                <X className="size-4" />
              </D.Close>
            </div>
            <div className="mx-3 mb-3 rounded-lg border border-line bg-white px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-4">{PORTAL_LABEL[role]}</p>
              <OrgName user={user} />
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
              <SidebarNav role={role} user={user} onNavigate={() => setMobileOpen(false)} />
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} user={user} onSearch={() => setSearchOpen(true)} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{hydrated ? <div className="animate-fade-in">{children}</div> : <PageSkeleton />}</main>
      </div>

      <CommandPalette role={role} orgId={user.orgId} open={searchOpen} onOpenChange={setSearchOpen} />
      <React.Suspense fallback={null}>
        <DeniedToast />
      </React.Suspense>
    </div>
  );
}
