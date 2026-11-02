"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlay";
import { useHydration, useStore } from "@/lib/store";
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

function StoreHydrator() {
  const setHydrated = useHydration((s) => s.setHydrated);
  React.useEffect(() => {
    Promise.resolve(useStore.persist.rehydrate()).finally(setHydrated);
  }, [setHydrated]);
  return null;
}

export function AppProviders({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <SessionContext.Provider value={user}>
      <TooltipProvider>
        <StoreHydrator />
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
