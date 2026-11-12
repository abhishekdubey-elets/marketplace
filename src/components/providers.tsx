"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlay";
import { setActor, useHydration, useStore } from "@/lib/store";
import { setMembers } from "@/lib/people";
import { reloadForSession, startSync } from "@/lib/sync";
import type { User } from "@/lib/types";

const SessionContext = React.createContext<User | null>(null);

export function useSession() {
  return React.useContext(SessionContext);
}

/** Current user inside a portal (portals are protected, so this is always set there). */
export function useUser(): User {
  const u = React.useContext(SessionContext);
  if (!u) throw new Error("useUser must be used inside a signed-in portal");
  return u;
}

function StoreHydrator({ userId }: { userId: string | null }) {
  const setHydrated = useHydration((s) => s.setHydrated);
  // who is acting (for audit/history), and names of signed-up members for display
  setActor(userId);
  const members = useStore((s) => s.members);
  setMembers(members);
  const firstUser = React.useRef<string | null | undefined>(undefined);
  React.useEffect(() => {
    // local personal data first, then the shared database (if configured) on top
    Promise.resolve(useStore.persist.rehydrate())
      .then(startSync)
      .finally(setHydrated);
  }, [setHydrated]);
  React.useEffect(() => {
    // signing in or out changes which shared collections this browser may read
    if (firstUser.current === undefined) firstUser.current = userId;
    else if (firstUser.current !== userId) {
      firstUser.current = userId;
      void reloadForSession();
    }
  }, [userId]);
  return null;
}

export function AppProviders({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={user}>
      <TooltipProvider>
        <StoreHydrator userId={user?.id ?? null} />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border !border-line !shadow-overlay !font-sans",
              title: "!text-[13px] !font-semibold !text-ink",
              description: "!text-xs !text-ink-3",
            },
          }}
        />
      </TooltipProvider>
    </SessionContext.Provider>
  );
}
