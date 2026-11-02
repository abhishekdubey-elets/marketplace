import type { MatchStatus, OpportunityStage, RequirementStage, VerificationStatus, ListingPackage } from "./types";

export const STAGE_LABEL: Record<RequirementStage, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  matching: "Matching in Progress",
  shortlisted: "Providers Shortlisted",
  introduced: "Introduction Made",
  evaluation: "Evaluation",
  negotiation: "Negotiation",
  completed: "Completed",
};

export const STAGE_SHORT: Record<RequirementStage, string> = {
  submitted: "Submitted",
  under_review: "Review",
  matching: "Matching",
  shortlisted: "Shortlisted",
  introduced: "Introduced",
  evaluation: "Evaluation",
  negotiation: "Negotiation",
  completed: "Completed",
};

export const STAGE_TONE: Record<RequirementStage, Tone> = {
  submitted: "neutral",
  under_review: "amber",
  matching: "blue",
  shortlisted: "violet",
  introduced: "teal",
  evaluation: "blue",
  negotiation: "amber",
  completed: "green",
};

export const OPP_STAGE_LABEL: Record<OpportunityStage, string> = {
  introduction: "Introduction",
  discovery: "Discovery",
  evaluation: "Evaluation",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Closed — not selected",
};

export const OPP_STAGE_TONE: Record<OpportunityStage, Tone> = {
  introduction: "neutral",
  discovery: "blue",
  evaluation: "violet",
  proposal: "teal",
  negotiation: "amber",
  won: "green",
  lost: "red",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: "Verified",
  pending: "Pending review",
  docs_requested: "Documents requested",
  unverified: "Not verified",
  rejected: "Rejected",
};

export const VERIFICATION_TONE: Record<VerificationStatus, Tone> = {
  verified: "green",
  pending: "amber",
  docs_requested: "amber",
  unverified: "neutral",
  rejected: "red",
};

export const LISTING_LABEL: Record<ListingPackage, string> = {
  standard: "Standard listing",
  featured: "Featured listing",
  premium: "Premium listing",
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  suggested: "Awaiting Elets review",
  approved: "Recommended",
  rejected: "Removed",
  shortlisted: "Shortlisted",
  intro_requested: "Introduction requested",
  introduced: "Introduced",
};

export const MATCH_STATUS_TONE: Record<MatchStatus, Tone> = {
  suggested: "amber",
  approved: "blue",
  rejected: "red",
  shortlisted: "violet",
  intro_requested: "teal",
  introduced: "green",
};

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet" | "teal" | "navy";
