"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers";
import { useStore } from "./store";
import { planOf, type GateReason } from "./plans";
import type { BuyerPlan } from "./types";

/** The signed-in buyer's plan. */
export function useBuyerPlan(): BuyerPlan {
  const orgId = useSession()?.orgId;
  return useStore((s) => planOf(s.buyers.find((b) => b.id === orgId)));
}

/**
 * Wrap a supplier-contact action: Premium buyers go ahead, free buyers are sent
 * to the upgrade page. Returns true when the action may continue.
 */
export function usePremiumGate() {
  const plan = useBuyerPlan();
  const router = useRouter();
  const premium = plan === "premium";
  const gate = (reason: GateReason, requirementId?: string) => {
    if (premium) return true;
    const q = new URLSearchParams({ reason });
    if (requirementId) q.set("requirement", requirementId);
    router.push(`/buyer/upgrade?${q}`);
    return false;
  };
  return { premium, gate };
}
