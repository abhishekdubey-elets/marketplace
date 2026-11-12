"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Announcement,
  AuditEntry,
  BuyerOrg,
  BuyerPlan,
  CaseStudy,
  Industry,
  Match,
  Meeting,
  ModuleState,
  Notification,
  Opportunity,
  OpportunityStage,
  ProEngagement,
  ProModuleKey,
  Provider,
  Region,
  Requirement,
  RequirementStage,
  Role,
  SavedSearch,
  ServiceCategory,
  SiteContent,
  TeamMember,
  Solution,
  TechCategory,
  Thread,
  VerificationStatus,
} from "./types";
import { rankProviders } from "./matching";
import { STAGE_LABEL } from "./labels";
import { AUTO_MATCH_LIMIT, AUTO_MATCH_MIN_SCORE, PLAN_LABEL, isPremium } from "./plans";

/**
 * DATA LAYER
 * ----------
 * All marketplace data lives in this Zustand store and actions update it
 * synchronously. When DATABASE_URL is configured, src/lib/sync.ts loads the
 * shared data from Neon Postgres and saves every change back, so all users see
 * the same marketplace; only personal lists (favourites, compare, recently
 * viewed, saved searches) stay in this browser's localStorage. Without a
 * database the whole store is kept in localStorage, as in the original demo.
 */

import { PERSONAL_KEYS, seed, type DataState, type ProRequest } from "./seed";
export type { DataState, ProRequest } from "./seed";

let seq = 0;
// time + counter + random so ids created by different users at once don't collide
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The signed-in user, so actions log who actually did them (falls back to the demo user ids). */
let currentActorId: string | null = null;
export const setActor = (id: string | null) => {
  currentActorId = id;
};
const actor = (fallback: string) => currentActorId ?? fallback;
export const actorId = actor;

/** Set by src/lib/sync.ts once shared data comes from the database: then only personal keys are kept locally. */
export const persistMode = { personalOnly: false };
const now = () => new Date().toISOString();

export interface Actions {
  resetDemo: () => void;

  // generic / comms
  log: (actorId: string, action: string, entity: AuditEntry["entity"], entityId: string | null, detail: string) => void;
  notify: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (audience: Role, userId: string) => void;
  sendMessage: (threadId: string, authorId: string, text: string) => void;
  createThread: (t: Omit<Thread, "id" | "messages" | "unreadBy">, authorId: string, text: string) => string;
  markThreadRead: (threadId: string, userId: string) => void;

  // buyer
  createRequirement: (r: Omit<Requirement, "id" | "code" | "stage" | "history" | "createdAt" | "updatedAt" | "internalNotes" | "assignedTo" | "priority">) => string;
  toggleFavourite: (providerId: string) => void;
  toggleCompare: (providerId: string) => boolean;
  clearCompare: () => void;
  addRecentlyViewed: (providerId: string) => void;
  saveSearch: (s: Omit<SavedSearch, "id" | "at">) => void;
  deleteSavedSearch: (id: string) => void;
  shortlistMatch: (matchId: string, shortlisted: boolean) => void;
  requestIntroduction: (matchId: string) => void;
  scheduleMeeting: (m: Omit<Meeting, "id">) => string;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  requestPro: (r: Omit<ProRequest, "id" | "at" | "status">) => void;

  // provider
  updateProvider: (id: string, patch: Partial<Provider> | ((p: Provider) => Provider)) => void;
  upsertSolution: (providerId: string, s: Solution) => void;
  removeSolution: (providerId: string, solutionId: string) => void;
  upsertCaseStudy: (providerId: string, c: CaseStudy) => void;
  removeCaseStudy: (providerId: string, caseId: string) => void;
  setProviderInterest: (matchId: string, interest: Match["providerInterest"]) => void;
  requestVerification: (providerId: string) => void;

  // admin
  setRequirementStage: (id: string, stage: RequirementStage, actorId: string, note?: string) => void;
  updateRequirement: (id: string, patch: Partial<Requirement>, actorId: string, auditDetail?: string) => void;
  addRequirementNote: (id: string, actorId: string, text: string) => void;
  runMatching: (requirementId: string, actorId: string, topN?: number) => number;
  /** Free plan: match and share results with the buyer straight away, without Elets review. */
  autoMatch: (requirementId: string, actorId: string) => number;
  setBuyerPlan: (buyerId: string, plan: BuyerPlan, actorId: string) => void;
  reviewMatch: (matchId: string, decision: "approved" | "rejected", actorId: string) => void;
  addMatch: (requirementId: string, providerId: string, actorId: string) => void;
  makeIntroduction: (matchId: string, actorId: string) => void;
  setVerification: (providerId: string, status: VerificationStatus, actorId: string, note?: string) => void;
  setMatchingEligible: (providerId: string, eligible: boolean, actorId: string) => void;
  setListing: (providerId: string, listing: Provider["listing"], actorId: string) => void;
  setAccountStatus: (providerId: string, status: Provider["accountStatus"], actorId: string) => void;
  updateBuyer: (id: string, patch: Partial<BuyerOrg>, actorId: string) => void;
  setOpportunityStage: (id: string, stage: OpportunityStage, actorId: string) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>, actorId: string, auditDetail?: string) => void;
  addOpportunityNote: (id: string, actorId: string, text: string) => void;

  // Elets Pro
  createEngagement: (e: Pick<ProEngagement, "title" | "buyerId" | "requirementId" | "rmId" | "targetDate">, actorId: string) => string;
  updateEngagement: (id: string, fn: (e: ProEngagement) => ProEngagement, actorId?: string, auditAction?: string) => void;
  setModuleState: (id: string, module: ProModuleKey, state: ModuleState, actorId: string) => void;
  setScore: (id: string, providerId: string, criterionId: string, score: number) => void;
  updateProRequest: (id: string, status: ProRequest["status"]) => void;

  // taxonomy & content
  upsertCategory: (c: TechCategory, actorId: string) => void;
  upsertIndustry: (i: Industry, actorId: string) => void;
  upsertRegion: (r: Region, actorId: string) => void;
  upsertServiceCategory: (s: ServiceCategory, actorId: string) => void;
  updateContent: (patch: Partial<SiteContent>, actorId: string) => void;
  upsertAnnouncement: (a: Announcement, actorId: string) => void;

  // Elets team
  upsertTeamMember: (t: TeamMember, actorId: string, auditAction?: string) => void;
}

export type Store = DataState & Actions;

const nextCode = (reqs: Requirement[]) => {
  const max = reqs.reduce((m, r) => Math.max(m, Number(r.code.split("-").pop()) || 0), 0);
  return `REQ-2026-${String(max + 1).padStart(4, "0")}`;
};

const upsert = <T extends { id: string }>(arr: T[], item: T) =>
  arr.some((x) => x.id === item.id) ? arr.map((x) => (x.id === item.id ? item : x)) : [...arr, item];

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const log: Actions["log"] = (actorId, action, entity, entityId, detail) =>
        set((s) => ({ audit: [{ id: uid("al"), actorId, action, entity, entityId, detail, at: now() }, ...s.audit] }));
      const notify: Actions["notify"] = (n) =>
        set((s) => ({ notifications: [{ ...n, id: uid("nt"), at: now(), read: false }, ...s.notifications] }));
      const req = (id: string) => get().requirements.find((r) => r.id === id);
      const prov = (id: string) => get().providers.find((p) => p.id === id);
      const patchProvider = (id: string, fn: (p: Provider) => Provider) =>
        set((s) => ({ providers: s.providers.map((p) => (p.id === id ? fn(p) : p)) }));

      return {
        ...seed(),

        resetDemo: () => set(seed()),
        log,
        notify,
        markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: (audience, userId) =>
          set((s) => ({
            notifications: s.notifications.map((n) => (n.audience === audience && (n.userId === null || n.userId === userId) ? { ...n, read: true } : n)),
          })),
        sendMessage: (threadId, authorId, text) =>
          set((s) => ({
            threads: s.threads.map((t) =>
              t.id === threadId
                ? { ...t, messages: [...t.messages, { id: uid("msg"), authorId, text, at: now() }], unreadBy: t.participants.filter((p) => p !== authorId) }
                : t,
            ),
          })),
        createThread: (t, authorId, text) => {
          const id = uid("th");
          set((s) => ({
            threads: [{ ...t, id, messages: [{ id: uid("msg"), authorId, text, at: now() }], unreadBy: t.participants.filter((p) => p !== authorId) }, ...s.threads],
          }));
          return id;
        },
        markThreadRead: (threadId, userId) =>
          set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? { ...t, unreadBy: t.unreadBy.filter((u) => u !== userId) } : t)) })),

        // ------------------------------------------------------------ buyer
        createRequirement: (input) => {
          const id = uid("r");
          const code = nextCode(get().requirements);
          const at = now();
          const r: Requirement = {
            ...input,
            id,
            code,
            stage: "submitted",
            history: [{ stage: "submitted", at, by: actor("buyer"), note: "Requirement submitted by buyer." }],
            createdAt: at.slice(0, 10),
            updatedAt: at,
            internalNotes: [],
            assignedTo: null,
            priority: "medium",
          };
          set((s) => ({ requirements: [r, ...s.requirements] }));
          const buyer = get().buyers.find((b) => b.id === input.buyerId);
          const premium = isPremium(buyer);
          log(actor("u-buyer"), "Submitted requirement", "requirement", id, `${code} — ${input.title}`);
          if (input.proRequested) {
            set((s) => ({ proRequests: [{ id: uid("pr"), buyerId: input.buyerId, requirementId: id, services: ["Full Elets Pro engagement"], note: "Requested with requirement submission.", at, status: "new" }, ...s.proRequests] }));
          }
          if (premium) {
            notify({ audience: "admin", userId: null, type: "requirement_submitted", title: "New requirement submitted", body: `${buyer?.name ?? "A buyer"} (Premium) submitted ${code} — ${input.title}. Matching is run by the Elets team.`, href: `/admin/requirements/${id}` });
            notify({ audience: "buyer", userId: `org:${input.buyerId}`, type: "requirement_submitted", title: "Requirement received", body: `${code} was submitted. Your Elets team will review it and run matching for you.`, href: `/buyer/requirements/${id}` });
          } else {
            const n = get().autoMatch(id, actor("buyer"));
            notify({ audience: "admin", userId: null, type: "requirement_submitted", title: "New requirement submitted", body: `${buyer?.name ?? "A buyer"} (Free) submitted ${code} — ${input.title}. Matched automatically with ${n} provider${n === 1 ? "" : "s"}.`, href: `/admin/requirements/${id}` });
          }
          return id;
        },
        toggleFavourite: (pid) => set((s) => ({ favourites: s.favourites.includes(pid) ? s.favourites.filter((x) => x !== pid) : [...s.favourites, pid] })),
        toggleCompare: (pid) => {
          const c = get().compare;
          if (c.includes(pid)) {
            set({ compare: c.filter((x) => x !== pid) });
            return true;
          }
          if (c.length >= 4) return false;
          set({ compare: [...c, pid] });
          return true;
        },
        clearCompare: () => set({ compare: [] }),
        addRecentlyViewed: (pid) => set((s) => ({ recentlyViewed: [pid, ...s.recentlyViewed.filter((x) => x !== pid)].slice(0, 8) })),
        saveSearch: (ss) => set((s) => ({ savedSearches: [{ ...ss, id: uid("ss"), at: now().slice(0, 10) }, ...s.savedSearches] })),
        deleteSavedSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
        shortlistMatch: (matchId, on) =>
          set((s) => ({
            matches: s.matches.map((m) => (m.id === matchId ? { ...m, status: on ? "shortlisted" : "approved", updatedAt: now() } : m)),
          })),
        requestIntroduction: (matchId) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, status: "intro_requested", updatedAt: now() } : x)) }));
          const r = req(m.requirementId);
          const p = prov(m.providerId);
          notify({ audience: "admin", userId: null, type: "intro_requested", title: "Introduction requested", body: `Buyer requested an introduction to ${p?.name} for ${r?.code}.`, href: `/admin/requirements/${m.requirementId}` });
          log(actor("u-buyer"), "Requested introduction", "match", matchId, `${p?.name} for ${r?.code}`);
        },
        scheduleMeeting: (m) => {
          const id = uid("mt");
          set((s) => ({ meetings: [...s.meetings, { ...m, id }] }));
          notify({ audience: "admin", userId: null, type: "meeting_scheduled", title: m.status === "requested" ? "Meeting requested" : "Meeting scheduled", body: m.title, href: "/admin/opportunities" });
          return id;
        },
        updateMeeting: (id, patch) => set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
        requestPro: (r) => {
          set((s) => ({
            proRequests: [{ ...r, id: uid("pr"), at: now(), status: "new" }, ...s.proRequests],
            requirements: r.requirementId ? s.requirements.map((x) => (x.id === r.requirementId ? { ...x, proRequested: true } : x)) : s.requirements,
          }));
          notify({ audience: "admin", userId: null, type: "pro_updated", title: "Elets Pro assistance requested", body: `${get().buyers.find((b) => b.id === r.buyerId)?.name} requested: ${r.services.join(", ")}.`, href: "/admin/pro" });
          log(actor("u-buyer"), "Requested Elets Pro assistance", "engagement", null, r.services.join(", "));
        },

        // ------------------------------------------------------------ provider
        updateProvider: (id, patch) => patchProvider(id, (p) => (typeof patch === "function" ? patch(p) : { ...p, ...patch })),
        upsertSolution: (pid, sol) => patchProvider(pid, (p) => ({ ...p, solutions: upsert(p.solutions, sol) })),
        removeSolution: (pid, sid) => patchProvider(pid, (p) => ({ ...p, solutions: p.solutions.filter((x) => x.id !== sid) })),
        upsertCaseStudy: (pid, c) => patchProvider(pid, (p) => ({ ...p, caseStudies: upsert(p.caseStudies, c) })),
        removeCaseStudy: (pid, cid) => patchProvider(pid, (p) => ({ ...p, caseStudies: p.caseStudies.filter((x) => x.id !== cid) })),
        setProviderInterest: (matchId, interest) => {
          const m = get().matches.find((x) => x.id === matchId);
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, providerInterest: interest, updatedAt: now() } : x)) }));
          if (m && interest === "interested") {
            notify({ audience: "admin", userId: null, type: "new_opportunity", title: "Provider interest received", body: `${prov(m.providerId)?.name} expressed interest in ${req(m.requirementId)?.code}.`, href: `/admin/requirements/${m.requirementId}` });
            log(actor("u-provider"), "Expressed interest", "match", matchId, `${prov(m.providerId)?.name} → ${req(m.requirementId)?.code}`);
          }
        },
        requestVerification: (pid) => {
          patchProvider(pid, (p) => ({ ...p, verification: "pending", documents: p.documents.map((d) => (d.status === "requested" ? { ...d, status: "under_review", uploadedAt: now().slice(0, 10) } : d)) }));
          notify({ audience: "admin", userId: null, type: "document_uploaded", title: "Verification requested", body: `${prov(pid)?.name} submitted their profile for verification.`, href: "/admin/providers" });
          log(actor("u-provider"), "Requested verification", "provider", pid, prov(pid)?.name ?? "");
        },

        // ------------------------------------------------------------ admin
        setRequirementStage: (id, stage, actorId, note) => {
          const r = req(id);
          if (!r || r.stage === stage) return;
          const at = now();
          set((s) => ({
            requirements: s.requirements.map((x) => (x.id === id ? { ...x, stage, updatedAt: at, history: [...x.history, { stage, at, by: actorId, note }] } : x)),
          }));
          log(actorId, "Changed requirement status", "requirement", id, `${STAGE_LABEL[r.stage]} → ${STAGE_LABEL[stage]}`);
          notify({ audience: "buyer", userId: `org:${r.buyerId}`, type: "requirement_reviewed", title: `${r.code} moved to ${STAGE_LABEL[stage]}`, body: note || r.title, href: `/buyer/requirements/${id}` });
        },
        updateRequirement: (id, patch, actorId, detail) => {
          set((s) => ({ requirements: s.requirements.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)) }));
          log(actorId, "Updated requirement", "requirement", id, detail ?? Object.keys(patch).join(", "));
        },
        addRequirementNote: (id, actorId, text) =>
          set((s) => ({ requirements: s.requirements.map((x) => (x.id === id ? { ...x, internalNotes: [...x.internalNotes, { id: uid("n"), authorId: actorId, text, at: now() }] } : x)) })),
        runMatching: (requirementId, actorId, topN = 5) => {
          const r = req(requirementId);
          if (!r) return 0;
          const existing = new Set(get().matches.filter((m) => m.requirementId === requirementId).map((m) => m.providerId));
          const ranked = rankProviders(r, get().providers, get().categories).filter((m) => !existing.has(m.providerId)).slice(0, Math.max(0, topN - existing.size));
          const at = now();
          const fresh: Match[] = ranked.map((m) => ({ id: uid("m"), requirementId, providerId: m.providerId, status: "suggested", providerInterest: "none", reviewedBy: null, createdAt: at, updatedAt: at }));
          set((s) => ({ matches: [...s.matches, ...fresh] }));
          if (r.stage === "submitted" || r.stage === "under_review") get().setRequirementStage(requirementId, "matching", actorId, "Matching initiated against eligible providers.");
          log(actorId, "Ran matching engine", "requirement", requirementId, `${fresh.length} new provider suggestions`);
          return fresh.length;
        },
        autoMatch: (requirementId, actorId) => {
          const r = req(requirementId);
          if (!r) return 0;
          const mine = get().matches.filter((m) => m.requirementId === requirementId);
          const existing = new Set(mine.map((m) => m.providerId));
          const room = Math.max(0, AUTO_MATCH_LIMIT - mine.filter((m) => m.status !== "rejected").length);
          const ranked = rankProviders(r, get().providers, get().categories)
            .filter((m) => m.score >= AUTO_MATCH_MIN_SCORE && !existing.has(m.providerId))
            .slice(0, room);
          const at = now();
          const fresh: Match[] = ranked.map((m) => ({ id: uid("m"), requirementId, providerId: m.providerId, status: "approved", providerInterest: "none", reviewedBy: null, createdAt: at, updatedAt: at }));
          set((s) => ({
            matches: [...s.matches, ...fresh],
            requirements: s.requirements.map((x) => (x.id === requirementId ? { ...x, autoMatchedAt: at } : x)),
          }));
          for (const m of fresh)
            notify({ audience: "provider", userId: `org:${m.providerId}`, type: "new_opportunity", title: "New matched opportunity", body: `You were matched to ${r.code} — ${r.title}.`, href: `/provider/opportunities/${requirementId}` });
          const summary = fresh.length
            ? `Matched automatically with ${fresh.length} provider${fresh.length === 1 ? "" : "s"}.`
            : "Matching ran automatically. No suitable providers yet; new matches appear as providers join.";
          if (r.stage === "submitted" || r.stage === "under_review") get().setRequirementStage(requirementId, "matching", actorId, summary);
          else if (fresh.length) notify({ audience: "buyer", userId: `org:${r.buyerId}`, type: "requirement_reviewed", title: `New matches for ${r.code}`, body: summary, href: `/buyer/requirements/${requirementId}?tab=matches` });
          if (fresh.length || !r.autoMatchedAt) log(actorId, "Matched automatically", "requirement", requirementId, `${fresh.length} provider suggestions shared with the buyer (Free plan)`);
          return fresh.length;
        },
        setBuyerPlan: (buyerId, plan, actorId) => {
          const b = get().buyers.find((x) => x.id === buyerId);
          if (!b || (b.plan ?? "free") === plan) return;
          set((s) => ({ buyers: s.buyers.map((x) => (x.id === buyerId ? { ...x, plan } : x)) }));
          log(actorId, `Changed plan to ${PLAN_LABEL[plan]}`, "buyer", buyerId, `${b.name}: ${PLAN_LABEL[b.plan ?? "free"]} → ${PLAN_LABEL[plan]}`);
          notify(
            plan === "premium"
              ? { audience: "buyer", userId: `org:${buyerId}`, type: "pro_updated", title: "You're on Premium", body: "The Elets team now runs matching for your requirements, and you can request introductions and meetings with suppliers.", href: "/buyer/requirements" }
              : { audience: "buyer", userId: `org:${buyerId}`, type: "pro_updated", title: "Your plan changed to Free", body: "Matching now runs automatically. Talking to suppliers and meetings need Premium.", href: "/buyer/upgrade" },
          );
        },
        reviewMatch: (matchId, decision, actorId) => {
          const m = get().matches.find((x) => x.id === matchId);
          set((s) => ({ matches: s.matches.map((x) => (x.id === matchId ? { ...x, status: decision, reviewedBy: actorId, updatedAt: now() } : x)) }));
          if (m) {
            log(actorId, decision === "approved" ? "Approved match" : "Removed match", "match", matchId, `${prov(m.providerId)?.name} for ${req(m.requirementId)?.code}`);
            if (decision === "approved") {
              notify({ audience: "provider", userId: `org:${m.providerId}`, type: "new_opportunity", title: "New matched opportunity", body: `You were matched to ${req(m.requirementId)?.code} — ${req(m.requirementId)?.title}.`, href: `/provider/opportunities/${m.requirementId}` });
            }
          }
        },
        addMatch: (requirementId, providerId, actorId) => {
          if (get().matches.some((m) => m.requirementId === requirementId && m.providerId === providerId)) return;
          const at = now();
          set((s) => ({ matches: [...s.matches, { id: uid("m"), requirementId, providerId, status: "suggested", providerInterest: "none", reviewedBy: null, createdAt: at, updatedAt: at }] }));
          log(actorId, "Added provider to match list", "match", requirementId, prov(providerId)?.name ?? "");
        },
        makeIntroduction: (matchId, actorId) => {
          const m = get().matches.find((x) => x.id === matchId);
          if (!m) return;
          const r = req(m.requirementId);
          const p = prov(m.providerId);
          const at = now();
          const oppCount = get().opportunities.length;
          set((s) => ({
            matches: s.matches.map((x) => (x.id === matchId ? { ...x, status: "introduced", updatedAt: at } : x)),
            opportunities: s.opportunities.some((o) => o.requirementId === m.requirementId && o.providerId === m.providerId)
              ? s.opportunities
              : [
                  {
                    id: uid("o"),
                    code: `OPP-2026-${String(31 + oppCount + 10).padStart(4, "0")}`,
                    requirementId: m.requirementId,
                    providerId: m.providerId,
                    buyerId: r?.buyerId ?? "",
                    stage: "introduction",
                    ownerId: r?.assignedTo ?? actorId,
                    nextStep: "Schedule discovery call",
                    nextStepDue: null,
                    notes: [{ id: uid("n"), authorId: actorId, text: "Introduction made by Elets.", at }],
                    createdAt: at,
                    updatedAt: at,
                  },
                  ...s.opportunities,
                ],
          }));
          if (r && ["matching", "shortlisted", "submitted", "under_review"].includes(r.stage)) get().setRequirementStage(r.id, "introduced", actorId, `Introduced to ${p?.name}.`);
          notify({ audience: "buyer", userId: r ? `org:${r.buyerId}` : null, type: "intro_requested", title: "Introduction made", body: `Elets introduced you to ${p?.name} for ${r?.code}.`, href: `/buyer/requirements/${m.requirementId}` });
          notify({ audience: "provider", userId: `org:${m.providerId}`, type: "intro_requested", title: "Introduction made", body: `Elets introduced you to ${get().buyers.find((b) => b.id === r?.buyerId)?.name} for ${r?.code}.`, href: "/provider/leads" });
          log(actorId, "Made introduction", "opportunity", matchId, `${p?.name} ↔ ${r?.code}`);
        },
        setVerification: (pid, status, actorId, note) => {
          patchProvider(pid, (p) => ({
            ...p,
            verification: status,
            verifiedAt: status === "verified" ? now().slice(0, 10) : p.verifiedAt,
            documents: status === "verified" ? p.documents.map((d) => ({ ...d, status: "accepted" })) : p.documents,
          }));
          log(actorId, `Set verification: ${status.replace("_", " ")}`, "provider", pid, note ?? prov(pid)?.name ?? "");
          if (status === "verified")
            notify({ audience: "provider", userId: `org:${pid}`, type: "verification_approved", title: "Verification approved", body: "Your company profile is now verified.", href: "/provider/verification" });
        },
        setMatchingEligible: (pid, eligible, actorId) => {
          patchProvider(pid, (p) => ({ ...p, matchingEligible: eligible }));
          log(actorId, eligible ? "Enabled matching eligibility" : "Disabled matching eligibility", "provider", pid, prov(pid)?.name ?? "");
        },
        setListing: (pid, listing, actorId) => {
          const before = prov(pid)?.listing;
          patchProvider(pid, (p) => ({ ...p, listing }));
          log(actorId, "Changed listing package", "provider", pid, `${before} → ${listing} (no effect on matching)`);
        },
        setAccountStatus: (pid, status, actorId) => {
          patchProvider(pid, (p) => ({ ...p, accountStatus: status }));
          log(actorId, status === "suspended" ? "Suspended account" : "Reactivated account", "provider", pid, prov(pid)?.name ?? "");
        },
        updateBuyer: (id, patch, actorId) => {
          const { plan, ...rest } = patch;
          if (Object.keys(rest).length) {
            set((s) => ({ buyers: s.buyers.map((b) => (b.id === id ? { ...b, ...rest } : b)) }));
            log(actorId, "Updated buyer organisation", "buyer", id, Object.keys(rest).join(", "));
          }
          if (plan) get().setBuyerPlan(id, plan, actorId);
        },
        setOpportunityStage: (id, stage, actorId) => {
          const o = get().opportunities.find((x) => x.id === id);
          set((s) => ({ opportunities: s.opportunities.map((x) => (x.id === id ? { ...x, stage, updatedAt: now() } : x)) }));
          log(actorId, "Updated opportunity stage", "opportunity", id, `${o?.code}: ${o?.stage} → ${stage}`);
        },
        updateOpportunity: (id, patch, actorId, detail) => {
          set((s) => ({ opportunities: s.opportunities.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)) }));
          log(actorId, "Updated opportunity", "opportunity", id, detail ?? Object.keys(patch).join(", "));
        },
        addOpportunityNote: (id, actorId, text) =>
          set((s) => ({ opportunities: s.opportunities.map((x) => (x.id === id ? { ...x, notes: [...x.notes, { id: uid("n"), authorId: actorId, text, at: now() }], updatedAt: now() } : x)) })),

        // ------------------------------------------------------------ Elets Pro
        createEngagement: (e, actorId) => {
          const id = uid("e");
          const n = get().engagements.length + 6;
          const code = `PRO-2026-${String(n).padStart(3, "0")}`;
          const r = e.requirementId ? req(e.requirementId) : undefined;
          const eng: ProEngagement = {
            ...e,
            id,
            code,
            status: "active",
            startDate: now().slice(0, 10),
            modules: { discovery: "active", intelligence: "upcoming", shortlisting: "upcoming", diligence: "upcoming", rfp: "upcoming", evaluation: "upcoming", negotiation: "upcoming", post_award: "upcoming" },
            brief: { background: r?.problem ?? "", objectives: r?.objectives ?? [], scope: [], constraints: [] },
            marketScan: [],
            shortlist: [],
            documents: [],
            criteria: get().engagements[0]?.criteria ?? [],
            scores: {},
            milestones: [],
            tasks: [],
            meetingNotes: [],
            messages: [],
            recommendation: null,
            outcome: null,
          };
          set((s) => ({ engagements: [eng, ...s.engagements] }));
          log(actorId, "Created Pro engagement", "engagement", id, `${code} — ${e.title}`);
          get().setBuyerPlan(e.buyerId, "premium", actorId);
          notify({ audience: "buyer", userId: `org:${e.buyerId}`, type: "pro_updated", title: "Elets Pro engagement created", body: `${code} — ${e.title}. Your relationship manager will be in touch.`, href: `/buyer/pro/${id}` });
          return id;
        },
        updateEngagement: (id, fn, actorId, auditAction) => {
          set((s) => ({ engagements: s.engagements.map((e) => (e.id === id ? fn(e) : e)) }));
          if (actorId && auditAction) log(actorId, auditAction, "engagement", id, get().engagements.find((e) => e.id === id)?.code ?? "");
        },
        setModuleState: (id, module, state, actorId) => {
          set((s) => ({ engagements: s.engagements.map((e) => (e.id === id ? { ...e, modules: { ...e.modules, [module]: state } } : e)) }));
          log(actorId, `Set module ${module} to ${state}`, "engagement", id, get().engagements.find((e) => e.id === id)?.code ?? "");
        },
        setScore: (id, providerId, criterionId, score) =>
          set((s) => ({
            engagements: s.engagements.map((e) =>
              e.id === id ? { ...e, scores: { ...e.scores, [providerId]: { ...(e.scores[providerId] ?? {}), [criterionId]: score } } } : e,
            ),
          })),
        updateProRequest: (id, status) => set((s) => ({ proRequests: s.proRequests.map((r) => (r.id === id ? { ...r, status } : r)) })),

        // ------------------------------------------------------------ taxonomy & content
        upsertCategory: (c, actorId) => {
          set((s) => ({ categories: upsert(s.categories, c) }));
          log(actorId, "Updated technology category", "category", c.id, c.name);
        },
        upsertIndustry: (i, actorId) => {
          set((s) => ({ industries: upsert(s.industries, i) }));
          log(actorId, "Updated industry", "category", i.id, i.name);
        },
        upsertRegion: (r, actorId) => {
          set((s) => ({ regions: upsert(s.regions, r) }));
          log(actorId, "Updated region", "category", r.id, r.name);
        },
        upsertServiceCategory: (c, actorId) => {
          set((s) => ({ serviceCategories: upsert(s.serviceCategories, c) }));
          log(actorId, "Updated service category", "category", c.id, c.name);
        },
        updateContent: (patch, actorId) => {
          set((s) => ({ content: { ...s.content, ...patch } }));
          log(actorId, "Updated site content", "content", null, Object.keys(patch).join(", "));
        },
        upsertTeamMember: (t, actorId, auditAction) => {
          set((s) => ({ team: upsert(s.team, t) }));
          log(actorId, auditAction ?? "Updated team member", "team", t.id, t.name);
        },
        upsertAnnouncement: (a, actorId) => {
          set((s) => ({ announcements: upsert(s.announcements, a) }));
          log(actorId, "Updated announcement", "content", a.id, a.title);
        },
      };
    },
    {
      name: "elets-marketplace-demo",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const entries = Object.entries(s).filter(([k, v]) => typeof v !== "function" && (!persistMode.personalOnly || (PERSONAL_KEYS as readonly string[]).includes(k)));
        return Object.fromEntries(entries) as unknown as DataState;
      },
    },
  ),
);

/** Hydration flag (not persisted) so pages can show skeletons until local data is loaded. */
export const useHydration = create<{ hydrated: boolean; setHydrated: () => void }>((set) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
}));
