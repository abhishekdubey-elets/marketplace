// Domain model for Elets Solution Marketplace.
// These types mirror the Supabase schema in /supabase/schema.sql so the mock
// data layer can be swapped for database queries without touching components.

export type Role = "buyer" | "provider" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  /** Buyer org id for buyers, provider id for providers, null for Elets staff */
  orgId: string | null;
  initials: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  /** Industry ids this person looks after; used to suggest a relationship manager */
  focus: string[];
  /** Inactive members keep their history but can't be assigned new work (default: active) */
  active?: boolean;
  /** Has an Elets operations sign-in (user id = team member id) */
  hasLogin?: boolean;
  /** Account owner: sign-in is managed only with scripts/create-admin.mjs */
  owner?: boolean;
}

// ---------------------------------------------------------------- taxonomy

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

export interface TechCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  featured: boolean;
  active: boolean;
  /** Categories considered adjacent for partial technology alignment */
  related: string[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  active: boolean;
}

export interface Region {
  id: string;
  name: string;
  active: boolean;
}

// ---------------------------------------------------------------- providers

export type VerificationStatus =
  | "verified"
  | "pending"
  | "docs_requested"
  | "unverified"
  | "rejected";

/** Commercial listing package. Kept strictly separate from verification and matching. */
export type ListingPackage = "standard" | "featured" | "premium";

export type CompanySize = "1-50" | "51-200" | "201-1000" | "1000+";

export type BudgetBand = "under-25l" | "25l-1cr" | "1cr-5cr" | "5cr-25cr" | "25cr-plus" | "undisclosed";

export type Deployment = "cloud" | "on-premise" | "hybrid" | "gov-cloud";

export interface Solution {
  id: string;
  name: string;
  categoryId: string;
  summary: string;
  deployment: Deployment[];
  highlights: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  industryId: string;
  categoryId: string;
  summary: string;
  outcome: string;
  year: number;
}

export interface ProviderDocument {
  id: string;
  name: string;
  kind: "incorporation" | "gst" | "certification" | "reference" | "other";
  status: "accepted" | "under_review" | "requested";
  uploadedAt: string | null;
}

export interface Provider {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: { initials: string; from: string; to: string };
  website: string;
  hq: string;
  founded: number;
  size: CompanySize;
  industries: string[];
  categories: string[];
  services: string[];
  capabilities: string[];
  regions: string[];
  clientSegments: string[];
  certifications: string[];
  solutions: Solution[];
  caseStudies: CaseStudy[];
  /** Typical engagement sizes the provider can serve */
  budgetBands: BudgetBand[];
  contact: { name: string; title: string; email: string; phone: string };
  documents: ProviderDocument[];

  // --- integrity-separated controls -------------------------------------
  verification: VerificationStatus;
  verifiedAt: string | null;
  /** Admin-controlled eligibility to appear in match results (independent of verification) */
  matchingEligible: boolean;
  /** Paid package — display only. NEVER read by the matching engine. */
  listing: ListingPackage;
  accountStatus: "active" | "suspended";

  joinedAt: string;
  profileViews: number;
  profileViewsTrend: number[];
}

// ---------------------------------------------------------------- buyers

export type BuyerType =
  | "Government Department"
  | "Public Sector Undertaking"
  | "Hospital / Health System"
  | "University / Institute"
  | "School Network"
  | "Bank / NBFC"
  | "Insurance"
  | "Urban Local Body";

export interface BuyerOrg {
  id: string;
  name: string;
  type: BuyerType;
  industryId: string;
  city: string;
  state: string;
  size: CompanySize;
  contactName: string;
  contactEmail: string;
  joinedAt: string;
  status: "active" | "invited" | "inactive";
  initials: string;
}

// ---------------------------------------------------------------- requirements

export const REQUIREMENT_STAGES = [
  "submitted",
  "under_review",
  "matching",
  "shortlisted",
  "introduced",
  "evaluation",
  "negotiation",
  "completed",
] as const;
export type RequirementStage = (typeof REQUIREMENT_STAGES)[number];

export type Timeline = "immediate" | "1-3m" | "3-6m" | "6-12m" | "exploratory";
export type ProjectScale = "pilot" | "department" | "organisation" | "statewide";

export interface StatusEvent {
  stage: RequirementStage;
  at: string;
  by: string;
  note?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export interface Requirement {
  id: string;
  code: string;
  buyerId: string;
  title: string;
  industryId: string;
  categoryId: string;
  problem: string;
  objectives: string[];
  /** Capabilities the buyer needs — compared against provider capabilities */
  capabilities: string[];
  budget: BudgetBand;
  timeline: Timeline;
  scale: ProjectScale;
  location: string;
  regions: string[];
  deployment: Deployment[];
  compliance: string[];
  additionalNotes: string;
  attachments: Attachment[];
  stage: RequirementStage;
  history: StatusEvent[];
  priority: "low" | "medium" | "high";
  assignedTo: string | null;
  proRequested: boolean;
  createdAt: string;
  updatedAt: string;
  internalNotes: Note[];
}

// ---------------------------------------------------------------- matching

export const MATCH_DIMENSIONS = [
  "technology",
  "industry",
  "functional",
  "implementation",
  "capacity",
  "geography",
  "compliance",
  "commercial",
] as const;
export type MatchDimension = (typeof MATCH_DIMENSIONS)[number];

export type MatchStatus =
  | "suggested" // engine suggested, awaiting Elets review
  | "approved" // Elets approved, visible to buyer
  | "rejected" // Elets removed from the list
  | "shortlisted" // buyer shortlisted
  | "intro_requested" // buyer requested introduction
  | "introduced"; // Elets made the introduction

export interface Match {
  id: string;
  requirementId: string;
  providerId: string;
  status: MatchStatus;
  providerInterest: "none" | "interested" | "declined";
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  providerId: string;
  score: number;
  label: "Strong Alignment" | "Good Alignment" | "Partial Alignment" | "Low Alignment";
  dimensions: Record<MatchDimension, number>;
  reasons: string[];
  gaps: string[];
}

// ---------------------------------------------------------------- opportunities

export const OPPORTUNITY_STAGES = [
  "introduction",
  "discovery",
  "evaluation",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export interface Note {
  id: string;
  authorId: string;
  text: string;
  at: string;
}

export interface Opportunity {
  id: string;
  code: string;
  requirementId: string;
  providerId: string;
  buyerId: string;
  stage: OpportunityStage;
  ownerId: string;
  nextStep: string;
  nextStepDue: string | null;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  outcome?: string;
}

export interface Meeting {
  id: string;
  title: string;
  at: string;
  durationMins: number;
  mode: "video" | "in-person" | "phone";
  location: string;
  buyerId: string | null;
  providerId: string | null;
  requirementId: string | null;
  engagementId: string | null;
  attendees: string[];
  status: "scheduled" | "requested" | "completed" | "cancelled";
  agenda?: string;
}

// ---------------------------------------------------------------- Elets Pro

export const PRO_MODULES = [
  { key: "discovery", name: "Requirement Discovery", short: "Discovery" },
  { key: "intelligence", name: "Market Intelligence", short: "Market scan" },
  { key: "shortlisting", name: "Vendor Shortlisting", short: "Shortlist" },
  { key: "diligence", name: "Due Diligence", short: "Diligence" },
  { key: "rfp", name: "RFP & Tender Support", short: "RFP" },
  { key: "evaluation", name: "Evaluation Support", short: "Evaluation" },
  { key: "negotiation", name: "Negotiation & Closure", short: "Closure" },
  { key: "post_award", name: "Post-Award Review", short: "Post-award" },
] as const;
export type ProModuleKey = (typeof PRO_MODULES)[number]["key"];

export type ModuleState = "done" | "active" | "upcoming" | "skipped";

export interface ProDocument {
  id: string;
  name: string;
  category: "brief" | "diligence" | "rfp" | "evaluation" | "minutes" | "other";
  size: string;
  uploadedBy: string;
  at: string;
}

export interface ProTask {
  id: string;
  title: string;
  assigneeId: string;
  due: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  module: ProModuleKey;
}

export interface ProMilestone {
  id: string;
  title: string;
  due: string;
  status: "done" | "upcoming" | "at_risk";
  module: ProModuleKey;
}

export interface ShortlistEntry {
  providerId: string;
  status: "longlist" | "shortlisted" | "diligence" | "rfp_invited" | "proposal_received" | "recommended" | "dropped";
  diligence: "not_started" | "in_progress" | "cleared" | "flagged";
  note: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  group: "technical" | "commercial";
  weight: number;
}

export interface MarketScanItem {
  id: string;
  segment: string;
  finding: string;
  providerIds: string[];
}

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  actions: string[];
}

export interface ProMessage {
  id: string;
  authorId: string;
  text: string;
  at: string;
}

export interface ProEngagement {
  id: string;
  code: string;
  title: string;
  buyerId: string;
  requirementId: string | null;
  rmId: string;
  status: "active" | "on_hold" | "completed";
  startDate: string;
  targetDate: string;
  modules: Record<ProModuleKey, ModuleState>;
  brief: {
    background: string;
    objectives: string[];
    scope: string[];
    constraints: string[];
  };
  marketScan: MarketScanItem[];
  shortlist: ShortlistEntry[];
  documents: ProDocument[];
  criteria: EvaluationCriterion[];
  /** providerId -> criterionId -> score (0–10) */
  scores: Record<string, Record<string, number>>;
  milestones: ProMilestone[];
  tasks: ProTask[];
  meetingNotes: MeetingNote[];
  messages: ProMessage[];
  recommendation: { providerId: string; summary: string; rationale: string[] } | null;
  outcome: string | null;
}

// ---------------------------------------------------------------- comms

export type NotificationType =
  | "requirement_submitted"
  | "requirement_reviewed"
  | "provider_matched"
  | "intro_requested"
  | "provider_shortlisted"
  | "meeting_scheduled"
  | "pro_updated"
  | "document_uploaded"
  | "verification_approved"
  | "new_opportunity";

export interface Notification {
  id: string;
  audience: Role;
  /** Specific user, or null for all users with the audience role */
  userId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  at: string;
  read: boolean;
}

export interface Message {
  id: string;
  authorId: string;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  subject: string;
  /** user ids participating */
  participants: string[];
  context: { kind: "requirement" | "opportunity" | "engagement" | "verification" | "general"; id: string | null };
  messages: Message[];
  unreadBy: string[];
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  entity: "provider" | "buyer" | "requirement" | "match" | "opportunity" | "engagement" | "category" | "content" | "team" | "system";
  entityId: string | null;
  detail: string;
  at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | Role;
  active: boolean;
  at: string;
}

export interface SiteContent {
  heroHeadline: string;
  heroSubtext: string;
  featuredProviderIds: string[];
  featuredCategoryIds: string[];
  sections: Record<string, boolean>;
  proHeadline: string;
  proSubtext: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: { categories: string[]; industries: string[]; regions: string[]; verifiedOnly: boolean };
  at: string;
}
