import type { BuyerOrg, BuyerPlan } from "./types";

/**
 * BUYER PLANS
 * Free: matching runs automatically and results are shown straight away, but
 * talking to suppliers (introductions) and scheduling meetings need Premium.
 * Premium (Elets Pro): the Elets team runs and reviews matching, makes the
 * introductions and arranges meetings. The plan is set by Elets operations.
 */

export const PLAN_LABEL: Record<BuyerPlan, string> = { free: "Free", premium: "Premium" };

export const planOf = (b: Pick<BuyerOrg, "plan"> | undefined | null): BuyerPlan => (b?.plan === "premium" ? "premium" : "free");
export const isPremium = (b: Pick<BuyerOrg, "plan"> | undefined | null) => planOf(b) === "premium";

/** Matches shown to free buyers: the strongest few, and never a poor fit. */
export const AUTO_MATCH_LIMIT = 5;
export const AUTO_MATCH_MIN_SCORE = 50;

export type GateReason = "contact" | "meeting";

export const GATE_COPY: Record<GateReason, { title: string; body: string }> = {
  contact: {
    title: "Talking to suppliers is part of Premium",
    body: "On Premium, the Elets team introduces you to the suppliers you choose, with your brief shared so the first conversation starts with context.",
  },
  meeting: {
    title: "Meetings with suppliers are part of Premium",
    body: "On Premium, the Elets team arranges and joins your meetings with suppliers, and keeps notes and next steps in one place.",
  },
};
