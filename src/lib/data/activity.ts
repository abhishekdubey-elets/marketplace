import type {
  Announcement,
  AuditEntry,
  Match,
  Meeting,
  Notification,
  Opportunity,
  OpportunityStage,
  SavedSearch,
  SiteContent,
  Thread,
} from "../types";
import { REQUIREMENT_STAGES } from "../types";
import { REQUIREMENTS } from "./buyers";
import { PROVIDERS } from "./providers";
import { rankProviders } from "../matching";

const stageIdx = (s: (typeof REQUIREMENT_STAGES)[number]) => REQUIREMENT_STAGES.indexOf(s);

// ------------------------------------------------------------------ matches
// Generated from the matching engine so that demo data and live scoring agree.
export const MATCHES: Match[] = [];
export const OPPORTUNITIES: Opportunity[] = [];

const NEXT_STEP: Record<OpportunityStage, string> = {
  introduction: "Schedule discovery call",
  discovery: "Share solution walkthrough",
  evaluation: "Submit technical proposal clarifications",
  proposal: "Commercial proposal under review",
  negotiation: "Finalise commercial terms",
  won: "Kick-off planning",
  lost: "Closed",
};

let oppSeq = 31;
for (const r of REQUIREMENTS) {
  const idx = stageIdx(r.stage);
  if (idx < stageIdx("matching")) continue;
  const ranked = rankProviders(r, PROVIDERS).slice(0, 4);
  ranked.forEach((m, i) => {
    let status: Match["status"] = "suggested";
    if (idx >= stageIdx("shortlisted")) status = "approved";
    if (idx === stageIdx("shortlisted") && i < 2) status = i === 0 ? "intro_requested" : "shortlisted";
    if (idx >= stageIdx("introduced") && i < 2) status = "introduced";
    const created = r.history[Math.min(2, r.history.length - 1)].at;
    MATCHES.push({
      id: `m-${r.id}-${m.providerId}`,
      requirementId: r.id,
      providerId: m.providerId,
      status,
      providerInterest: status === "introduced" ? "interested" : i === 1 && idx >= 3 ? "interested" : "none",
      reviewedBy: status === "suggested" ? null : r.assignedTo,
      createdAt: created,
      updatedAt: r.updatedAt,
    });
    if (status === "introduced") {
      let stage: OpportunityStage = "introduction";
      if (r.stage === "introduced") stage = i === 0 ? "discovery" : "introduction";
      if (r.stage === "evaluation") stage = i === 0 ? "proposal" : "evaluation";
      if (r.stage === "negotiation") stage = i === 0 ? "negotiation" : "evaluation";
      if (r.stage === "completed") stage = i === 0 ? "won" : "lost";
      OPPORTUNITIES.push({
        id: `o-${r.id}-${m.providerId}`,
        code: `OPP-2026-${String(oppSeq++).padStart(4, "0")}`,
        requirementId: r.id,
        providerId: m.providerId,
        buyerId: r.buyerId,
        stage,
        ownerId: r.assignedTo ?? "t-neha",
        nextStep: NEXT_STEP[stage],
        nextStepDue: stage === "won" || stage === "lost" ? null : "2026-11-1" + (oppSeq % 9),
        notes: [
          { id: "n1", authorId: r.assignedTo ?? "t-neha", text: "Introduction email sent with requirement brief and buyer contact.", at: r.history[Math.min(4, r.history.length - 1)].at },
        ],
        createdAt: r.history[Math.min(4, r.history.length - 1)].at,
        updatedAt: r.updatedAt,
        outcome: stage === "won" ? "Selected by buyer after evaluation." : stage === "lost" ? "Buyer selected another provider." : undefined,
      });
    }
  });
}

// ------------------------------------------------------------------ meetings
export const MEETINGS: Meeting[] = [
  { id: "mt-1", title: "Medisphere HIS — clinical workflow demo", at: "2026-11-04T11:00:00+05:30", durationMins: 90, mode: "in-person", location: "Sahyadri Hospital, Pune — Board Room", buyerId: "b-sahyadri", providerId: "p-medisphere", requirementId: "r-141", engagementId: "e-007", attendees: ["u-buyer", "t-priya"], status: "scheduled", agenda: "OPD, IPD and pharmacy workflows with clinical leads" },
  { id: "mt-2", title: "Helix — implementation approach review", at: "2026-11-06T15:00:00+05:30", durationMins: 60, mode: "video", location: "Video call", buyerId: "b-sahyadri", providerId: "p-helix", requirementId: "r-141", engagementId: "e-007", attendees: ["u-buyer", "t-priya"], status: "scheduled" },
  { id: "mt-3", title: "Nimbus Stack — bed-board discovery call", at: "2026-11-05T10:30:00+05:30", durationMins: 45, mode: "video", location: "Video call", buyerId: "b-sahyadri", providerId: "p-nimbus", requirementId: "r-133", engagementId: null, attendees: ["u-buyer", "u-provider", "t-priya"], status: "scheduled" },
  { id: "mt-4", title: "Elets Pro — weekly engagement sync", at: "2026-11-03T16:00:00+05:30", durationMins: 30, mode: "video", location: "Video call", buyerId: "b-sahyadri", providerId: null, requirementId: "r-141", engagementId: "e-007", attendees: ["u-buyer", "t-priya"], status: "scheduled" },
  { id: "mt-5", title: "NEGS — cloud migration commercial discussion", at: "2026-11-05T14:00:00+05:30", durationMins: 60, mode: "in-person", location: "NEGS Office, Chandigarh", buyerId: "b-negs", providerId: "p-nimbus", requirementId: "r-124", engagementId: null, attendees: ["u-provider", "t-ananya"], status: "scheduled" },
  { id: "mt-6", title: "Grievance platform — proposal presentations", at: "2026-11-09T11:00:00+05:30", durationMins: 180, mode: "in-person", location: "NEGS Office, Chandigarh", buyerId: "b-negs", providerId: null, requirementId: "r-118", engagementId: "e-004", attendees: ["t-ananya"], status: "scheduled" },
  { id: "mt-7", title: "Coastal Bank — FinArc negotiation round 2", at: "2026-11-10T12:00:00+05:30", durationMins: 60, mode: "video", location: "Video call", buyerId: "b-coastal", providerId: "p-finarc", requirementId: "r-121", engagementId: "e-005", attendees: ["t-vikram"], status: "scheduled" },
  { id: "mt-8", title: "Metro City ICCC — discovery workshop", at: "2026-11-12T10:00:00+05:30", durationMins: 120, mode: "in-person", location: "Metro City ICCC, Nashik", buyerId: "b-metro", providerId: null, requirementId: "r-158", engagementId: "e-009", attendees: ["t-ananya", "t-rohan"], status: "scheduled" },
  { id: "mt-9", title: "Pragati — Nimbus Stack introduction call", at: "2026-11-13T15:30:00+05:30", durationMins: 45, mode: "video", location: "Video call", buyerId: "b-pragati", providerId: "p-nimbus", requirementId: "r-129", engagementId: null, attendees: ["u-provider", "t-rohan"], status: "requested" },
  { id: "mt-10", title: "SOC requirement — scoping call", at: "2026-10-27T11:00:00+05:30", durationMins: 30, mode: "phone", location: "Phone", buyerId: "b-sahyadri", providerId: null, requirementId: "r-152", engagementId: null, attendees: ["u-buyer", "t-priya"], status: "completed" },
];

// ------------------------------------------------------------------ notifications
export const NOTIFICATIONS: Notification[] = [
  // buyer
  { id: "nt-b1", audience: "buyer", userId: "u-buyer", type: "provider_shortlisted", title: "Vendor shortlist updated", body: "Priya Nair moved Medisphere Health IT and Helix Implementation Partners into due diligence for PRO-2026-007.", href: "/buyer/pro/e-007", at: "2026-11-02T09:40:00+05:30", read: false },
  { id: "nt-b2", audience: "buyer", userId: "u-buyer", type: "meeting_scheduled", title: "Meeting scheduled", body: "Medisphere HIS clinical workflow demo on 4 Nov, 11:00 AM.", href: "/buyer/meetings", at: "2026-11-01T17:15:00+05:30", read: false },
  { id: "nt-b3", audience: "buyer", userId: "u-buyer", type: "requirement_reviewed", title: "Requirement under matching", body: "REQ-2026-0152 (24x7 SOC) has been reviewed and matching is in progress.", href: "/buyer/requirements/r-152", at: "2026-10-22T13:05:00+05:30", read: false },
  { id: "nt-b4", audience: "buyer", userId: "u-buyer", type: "document_uploaded", title: "Due diligence document uploaded", body: "Medisphere — reference checks summary added to your Pro workspace.", href: "/buyer/pro/e-007", at: "2026-10-30T12:20:00+05:30", read: true },
  { id: "nt-b5", audience: "buyer", userId: "u-buyer", type: "provider_matched", title: "4 providers matched", body: "Elets approved 4 providers for REQ-2026-0141 after review.", href: "/buyer/requirements/r-141", at: "2026-09-05T15:00:00+05:30", read: true },
  { id: "nt-b6", audience: "buyer", userId: "u-buyer", type: "requirement_submitted", title: "Requirement received", body: "REQ-2026-0171 (Telemedicine for outreach clinics) was submitted successfully.", href: "/buyer/requirements/r-171", at: "2026-10-31T11:00:00+05:30", read: true },
  // provider
  { id: "nt-p1", audience: "provider", userId: "u-provider", type: "new_opportunity", title: "New matched opportunity", body: "You were matched to REQ-2026-0129 — Campus ERP and LMS consolidation (74% match).", href: "/provider/opportunities/r-129", at: "2026-11-01T10:10:00+05:30", read: false },
  { id: "nt-p2", audience: "provider", userId: "u-provider", type: "meeting_scheduled", title: "Commercial discussion confirmed", body: "NEGS cloud migration commercial discussion on 5 Nov, 2:00 PM.", href: "/provider/leads", at: "2026-10-31T16:40:00+05:30", read: false },
  { id: "nt-p3", audience: "provider", userId: "u-provider", type: "intro_requested", title: "Introduction made", body: "Elets introduced you to Sahyadri Multi-Speciality Hospital Group for REQ-2026-0133.", href: "/provider/leads", at: "2026-10-12T12:00:00+05:30", read: true },
  { id: "nt-p4", audience: "provider", userId: "u-provider", type: "verification_approved", title: "Verification approved", body: "Your company profile is verified. The verified badge now appears on your profile.", href: "/provider/verification", at: "2026-07-14T18:00:00+05:30", read: true },
  { id: "nt-p5", audience: "provider", userId: "u-provider", type: "new_opportunity", title: "New matched opportunity", body: "You were matched to REQ-2026-0112 — ERP upgrade and application support.", href: "/provider/opportunities/r-112", at: "2026-10-25T09:30:00+05:30", read: true },
  // admin
  { id: "nt-a1", audience: "admin", userId: null, type: "requirement_submitted", title: "New requirement submitted", body: "Sahyadri Hospital Group submitted REQ-2026-0171 — Telemedicine platform.", href: "/admin/requirements/r-171", at: "2026-10-31T11:00:00+05:30", read: false },
  { id: "nt-a2", audience: "admin", userId: null, type: "requirement_submitted", title: "New requirement submitted", body: "Bharat Rural Finance submitted REQ-2026-0168 — Document intelligence for KYC.", href: "/admin/requirements/r-168", at: "2026-10-28T15:20:00+05:30", read: false },
  { id: "nt-a3", audience: "admin", userId: null, type: "document_uploaded", title: "Verification documents uploaded", body: "Quantra Data Labs uploaded incorporation documents for verification.", href: "/admin/providers?status=unverified", at: "2026-10-29T13:00:00+05:30", read: false },
  { id: "nt-a4", audience: "admin", userId: null, type: "intro_requested", title: "Introduction requested", body: "Sahyadri Hospital Group requested an introduction to Kavach Cyber Systems.", href: "/admin/requirements/r-152", at: "2026-10-30T10:45:00+05:30", read: false },
  { id: "nt-a5", audience: "admin", userId: null, type: "pro_updated", title: "Pro engagement milestone due", body: "PRO-2026-004 — evaluation report due on 12 Nov.", href: "/admin/pro/e-004", at: "2026-11-01T09:00:00+05:30", read: true },
  { id: "nt-a6", audience: "admin", userId: null, type: "new_opportunity", title: "Provider interest received", body: "Nimbus Stack expressed interest in REQ-2026-0118.", href: "/admin/opportunities", at: "2026-10-26T14:30:00+05:30", read: true },
];

// ------------------------------------------------------------------ messages
export const THREADS: Thread[] = [
  {
    id: "th-1", subject: "HIS evaluation — demo logistics", participants: ["u-buyer", "t-priya"], context: { kind: "engagement", id: "e-007" }, unreadBy: ["u-buyer"],
    messages: [
      { id: "1", authorId: "t-priya", text: "Dr. Menon, Medisphere has confirmed the clinical workflow demo for 4 Nov at 11:00. Could you confirm the clinical leads attending?", at: "2026-11-01T16:50:00+05:30" },
      { id: "2", authorId: "u-buyer", text: "Thanks Priya. Dr. Kulkarni (Medicine), Sister Thomas (Nursing) and our pharmacy head will join.", at: "2026-11-01T18:05:00+05:30" },
      { id: "3", authorId: "t-priya", text: "Perfect. I've shared the evaluation scorecard so each attendee can score the demo against the agreed criteria.", at: "2026-11-02T09:42:00+05:30" },
    ],
  },
  {
    id: "th-2", subject: "SOC requirement — clarifications", participants: ["u-buyer", "t-priya"], context: { kind: "requirement", id: "r-152" }, unreadBy: [],
    messages: [
      { id: "1", authorId: "t-priya", text: "We've started matching for the SOC requirement. Do you need on-site analysts, or is remote monitoring acceptable?", at: "2026-10-22T13:10:00+05:30" },
      { id: "2", authorId: "u-buyer", text: "Remote is fine, but incident response must be on-site within 24 hours.", at: "2026-10-22T15:30:00+05:30" },
    ],
  },
  {
    id: "th-3", subject: "NEGS cloud migration — commercial format", participants: ["u-provider", "t-ananya"], context: { kind: "opportunity", id: "o-r-124-p-nimbus" }, unreadBy: ["u-provider"],
    messages: [
      { id: "1", authorId: "t-ananya", text: "Arjun, NEGS would like the commercial proposal split into migration (one-time) and managed operations (annual) for three years.", at: "2026-10-31T11:20:00+05:30" },
      { id: "2", authorId: "u-provider", text: "Understood. We'll share the revised format before the 5 Nov meeting.", at: "2026-10-31T12:02:00+05:30" },
      { id: "3", authorId: "t-ananya", text: "Great — please also include the DR drill schedule.", at: "2026-10-31T16:35:00+05:30" },
    ],
  },
  {
    id: "th-4", subject: "Profile — case study review", participants: ["u-provider", "t-neha"], context: { kind: "verification", id: "p-nimbus" }, unreadBy: [],
    messages: [
      { id: "1", authorId: "t-neha", text: "Your new university analytics case study is approved and now visible on your public profile.", at: "2026-10-18T10:00:00+05:30" },
    ],
  },
  {
    id: "th-5", subject: "Grievance platform — evaluation committee", participants: ["u-admin", "t-ananya"], context: { kind: "engagement", id: "e-004" }, unreadBy: ["u-admin"],
    messages: [
      { id: "1", authorId: "t-ananya", text: "Technical scores for all three proposals are in. CivicStack leads on functional fit; Tattva is strongest on the multilingual assistant.", at: "2026-11-01T18:30:00+05:30" },
    ],
  },
];

// ------------------------------------------------------------------ audit log
export const AUDIT_LOG: AuditEntry[] = [
  { id: "al-1", actorId: "t-priya", action: "Moved vendors to due diligence", entity: "engagement", entityId: "e-007", detail: "Medisphere Health IT, Helix Implementation Partners", at: "2026-11-02T09:40:00+05:30" },
  { id: "al-2", actorId: "t-neha", action: "Requested additional documents", entity: "provider", entityId: "p-orbis", detail: "ISO 27001 certificate and client reference letters", at: "2026-10-30T15:10:00+05:30" },
  { id: "al-3", actorId: "t-rohan", action: "Initiated matching", entity: "requirement", entityId: "r-152", detail: "4 providers suggested by matching engine", at: "2026-10-22T13:00:00+05:30" },
  { id: "al-4", actorId: "t-ananya", action: "Changed requirement status", entity: "requirement", entityId: "r-158", detail: "Submitted → Under Review", at: "2026-10-15T13:00:00+05:30" },
  { id: "al-5", actorId: "t-neha", action: "Changed listing package", entity: "provider", entityId: "p-kavach", detail: "Standard → Featured (no effect on matching)", at: "2026-10-12T11:30:00+05:30" },
  { id: "al-6", actorId: "t-vikram", action: "Recorded recommendation", entity: "engagement", entityId: "e-005", detail: "FinArc Solutions recommended for core banking", at: "2026-10-28T17:00:00+05:30" },
  { id: "al-7", actorId: "t-neha", action: "Approved verification", entity: "provider", entityId: "p-ledgerline", detail: "All documents accepted", at: "2026-09-03T12:00:00+05:30" },
  { id: "al-8", actorId: "t-neha", action: "Updated featured categories", entity: "content", entityId: null, detail: "Homepage featured categories reordered", at: "2026-10-05T10:20:00+05:30" },
  { id: "al-9", actorId: "t-ananya", action: "Approved matches", entity: "match", entityId: "r-141", detail: "4 providers approved for buyer visibility", at: "2026-09-05T14:55:00+05:30" },
  { id: "al-10", actorId: "t-priya", action: "Created Pro engagement", entity: "engagement", entityId: "e-007", detail: "PRO-2026-007 for Sahyadri Hospital Group", at: "2026-08-24T10:00:00+05:30" },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "an-1", title: "Healthcare Technology showcase — provider registrations open", body: "Verified healthcare technology providers can register for the upcoming Elets healthcare showcase.", audience: "provider", active: true, at: "2026-10-28" },
  { id: "an-2", title: "New: compare up to four providers side by side", body: "Buyers can now compare shortlisted providers across all eight matching dimensions.", audience: "buyer", active: true, at: "2026-10-20" },
];

export const SITE_CONTENT: SiteContent = {
  heroHeadline: "Find the Right Technology. Build the Right Partnerships.",
  heroSubtext:
    "An intelligent B2B solution marketplace connecting organisations with verified technology providers, backed by Elets' industry network and managed expertise.",
  featuredProviderIds: ["p-nimbus", "p-medisphere", "p-kavach", "p-civicstack", "p-finarc", "p-urbangrid"],
  featuredCategoryIds: ["ai", "cloud", "cyber", "enterprise", "dx", "data", "healthtech", "edtech", "fintech", "gov", "iot"],
  sections: { ecosystem: true, howItWorks: true, categories: true, providers: true, postRequirement: true, pro: true, whyElets: true, verticals: true },
  proHeadline: "Managed technology procurement, from first brief to final award.",
  proSubtext:
    "Elets Pro assigns a relationship manager and a structured eight-stage process to help your organisation define, evaluate and select the right technology partner.",
};

export const SAVED_SEARCHES: SavedSearch[] = [
  { id: "ss-1", name: "Verified healthcare IT, West India", query: "", filters: { categories: ["healthtech"], industries: ["health"], regions: ["west"], verifiedOnly: true }, at: "2026-10-12" },
  { id: "ss-2", name: "SOC providers with CERT-In", query: "SOC", filters: { categories: ["cyber"], industries: [], regions: [], verifiedOnly: true }, at: "2026-10-21" },
];
