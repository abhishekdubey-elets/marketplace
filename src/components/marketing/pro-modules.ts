import { ClipboardCheck, FileSearch, Gavel, ListChecks, Scale, ScrollText, ShieldCheck, Telescope, type LucideIcon } from "lucide-react";
import type { ProModuleKey } from "@/lib/types";

export const PRO_MODULE_ICONS: Record<ProModuleKey, LucideIcon> = {
  discovery: FileSearch,
  intelligence: Telescope,
  shortlisting: ListChecks,
  diligence: ShieldCheck,
  rfp: ScrollText,
  evaluation: Scale,
  negotiation: Gavel,
  post_award: ClipboardCheck,
};

/** Marketing copy for each Elets Pro module: what Elets does and what the buyer receives. */
export const PRO_MODULE_COPY: Record<ProModuleKey, { summary: string; elets: string[]; deliverables: string[] }> = {
  discovery: {
    summary: "Understand the real problem before anyone talks about products.",
    elets: ["Stakeholder workshops with business and IT teams", "Current-state and constraint mapping", "Translate needs into a structured technology requirement"],
    deliverables: ["Signed-off requirement brief", "Objectives, scope and constraints"],
  },
  intelligence: {
    summary: "Know what the market can actually offer.",
    elets: ["Research technologies, vendors and implementation partners", "Draw on Elets' industry relationships and sector knowledge", "Identify common approaches and risks"],
    deliverables: ["Market scan by segment", "Long-list of relevant providers"],
  },
  shortlisting: {
    summary: "Narrow the field using transparent criteria.",
    elets: ["Apply the eight-dimension matching framework", "Review fit with the buyer", "Confirm provider interest and availability"],
    deliverables: ["Agreed vendor shortlist", "Match explanations per provider"],
  },
  diligence: {
    summary: "Check credentials before commitments are made.",
    elets: ["Review experience, certifications and case studies", "Conduct reference checks", "Assess delivery capacity and team"],
    deliverables: ["Due diligence summary per vendor", "Flagged risks and clarifications"],
  },
  rfp: {
    summary: "Structured documents that make proposals comparable.",
    elets: ["Draft technical requirements and scope", "Define evaluation criteria and weights", "Support tender documentation and pre-bid queries"],
    deliverables: ["RFP / tender draft", "Evaluation criteria matrix"],
  },
  evaluation: {
    summary: "Compare technical and commercial proposals objectively.",
    elets: ["Coordinate demos and presentations", "Consolidate committee scoring", "Normalise commercial proposals"],
    deliverables: ["Weighted evaluation matrix", "Evaluation report"],
  },
  negotiation: {
    summary: "Move the preferred option to a decision.",
    elets: ["Coordinate discussions between parties", "Support negotiation on scope, milestones and terms", "Track open points to closure"],
    deliverables: ["Negotiation brief", "Final recommendation"],
  },
  post_award: {
    summary: "Close the loop after the decision.",
    elets: ["Track the outcome and early delivery", "Collect structured buyer and provider feedback", "Feed learnings back into future matching"],
    deliverables: ["Post-award review", "Feedback record"],
  },
};
