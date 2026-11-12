/**
 * Starting dataset for the marketplace. Used by the server to fill an empty
 * database (see src/lib/db/records.ts) and as the client store's initial state
 * before shared data arrives.
 */
import type {
  User,
  TeamMember,
  Announcement,
  AuditEntry,
  BuyerOrg,
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
  Solution,
  TechCategory,
  Thread,
  VerificationStatus,
} from "./types";
import { CATEGORIES, INDUSTRIES, REGIONS, SERVICE_CATEGORIES, TEAM, USERS } from "./data/taxonomy";
import { PROVIDERS } from "./data/providers";
import { BUYERS, REQUIREMENTS } from "./data/buyers";
import { PRO_ENGAGEMENTS } from "./data/pro";
import {
  ANNOUNCEMENTS,
  AUDIT_LOG,
  MATCHES,
  MEETINGS,
  NOTIFICATIONS,
  OPPORTUNITIES,
  SAVED_SEARCHES,
  SITE_CONTENT,
  THREADS,
} from "./data/activity";
export interface ProRequest {
  id: string;
  buyerId: string;
  requirementId: string | null;
  services: string[];
  note: string;
  at: string;
  status: "new" | "contacted" | "converted";
}

/** Public profile of a signed-up user, used to show names in history, notes and messages. Never includes email. */
export type Member = Omit<User, "email">;

export interface DataState {
  members: Member[];
  /** Elets team: relationship managers, analysts and operations staff */
  team: TeamMember[];
  providers: Provider[];
  buyers: BuyerOrg[];
  requirements: Requirement[];
  matches: Match[];
  opportunities: Opportunity[];
  meetings: Meeting[];
  engagements: ProEngagement[];
  proRequests: ProRequest[];
  notifications: Notification[];
  threads: Thread[];
  audit: AuditEntry[];
  categories: TechCategory[];
  industries: Industry[];
  regions: Region[];
  serviceCategories: ServiceCategory[];
  content: SiteContent;
  announcements: Announcement[];
  // buyer personalisation
  favourites: string[];
  compare: string[];
  recentlyViewed: string[];
  savedSearches: SavedSearch[];
}

/**
 * Sample organisations, people and activity (the original demo dataset) are
 * included only when NEXT_PUBLIC_SAMPLE_DATA=true, e.g. for a local demo. By
 * default the marketplace starts empty apart from reference lists and site copy.
 * The same flag enables the demo buyer/provider sign-ins.
 */
export const SAMPLE_DATA = process.env.NEXT_PUBLIC_SAMPLE_DATA === "true";

export const seed = (): DataState => (SAMPLE_DATA ? sampleSeed() : starterSeed());

/** Reference lists and site copy only: what a real deployment starts with. */
export const starterSeed = (): DataState => ({
  members: [],
  team: [],
  providers: [],
  buyers: [],
  requirements: [],
  matches: [],
  opportunities: [],
  meetings: [],
  engagements: [],
  proRequests: [],
  notifications: [],
  threads: [],
  audit: [],
  categories: CATEGORIES,
  industries: INDUSTRIES,
  regions: REGIONS,
  serviceCategories: SERVICE_CATEGORIES,
  content: { ...SITE_CONTENT, featuredProviderIds: [] },
  announcements: [],
  favourites: [],
  compare: [],
  recentlyViewed: [],
  savedSearches: [],
});

/** The full fictional demo dataset. */
export const sampleSeed = (): DataState => ({
  members: USERS.map(({ email: _email, ...m }) => m),
  team: TEAM,
  providers: PROVIDERS,
  buyers: BUYERS,
  requirements: REQUIREMENTS,
  matches: MATCHES,
  opportunities: OPPORTUNITIES,
  meetings: MEETINGS,
  engagements: PRO_ENGAGEMENTS,
  proRequests: [
    { id: "pr-1", buyerId: "b-lakeview", requirementId: "r-163", services: ["Requirement Discovery", "RFP & Tender Support"], note: "Need help structuring evaluation criteria for AI-assisted marking.", at: "2026-10-26T12:00:00+05:30", status: "new" },
  ],
  notifications: NOTIFICATIONS,
  threads: THREADS,
  audit: AUDIT_LOG,
  categories: CATEGORIES,
  industries: INDUSTRIES,
  regions: REGIONS,
  serviceCategories: SERVICE_CATEGORIES,
  content: SITE_CONTENT,
  announcements: ANNOUNCEMENTS,
  favourites: ["p-medisphere", "p-kavach"],
  compare: [],
  recentlyViewed: ["p-medisphere", "p-helix", "p-kavach"],
  savedSearches: SAVED_SEARCHES,
});


/** Collections shared between all users and stored in the database. */
export const SHARED_COLLECTIONS = [
  "members",
  "team",
  "providers",
  "buyers",
  "requirements",
  "matches",
  "opportunities",
  "meetings",
  "engagements",
  "proRequests",
  "notifications",
  "threads",
  "audit",
  "categories",
  "industries",
  "regions",
  "serviceCategories",
  "announcements",
] as const satisfies readonly (keyof DataState)[];
export type SharedCollection = (typeof SHARED_COLLECTIONS)[number];

/** Collections anyone can read without signing in (public site and directory). */
export const PUBLIC_COLLECTIONS: readonly SharedCollection[] = ["providers", "categories", "industries", "regions", "serviceCategories", "announcements"];

/** Per-browser personalisation, kept in localStorage rather than the database. */
export const PERSONAL_KEYS = ["favourites", "compare", "recentlyViewed", "savedSearches"] as const satisfies readonly (keyof DataState)[];
