import type { BudgetBand, CompanySize, MatchDimension, MatchResult, Provider, Requirement, TechCategory } from "./types";
import { CATEGORIES, INDUSTRIES, REGIONS } from "./data/taxonomy";

/**
 * Explainable eight-dimension matching framework.
 *
 * INTEGRITY: the engine only receives a `MatchableProfile`, which is built by
 * `toMatchable()` and deliberately omits the paid `listing` package, profile
 * views and every other commercial field. Paid listings cannot influence scores
 * because the data never reaches this function.
 */
export type MatchableProfile = Pick<
  Provider,
  "id" | "industries" | "categories" | "capabilities" | "regions" | "certifications" | "caseStudies" | "budgetBands" | "size"
>;

export function toMatchable(p: Provider): MatchableProfile {
  return {
    id: p.id,
    industries: p.industries,
    categories: p.categories,
    capabilities: p.capabilities,
    regions: p.regions,
    certifications: p.certifications,
    caseStudies: p.caseStudies,
    budgetBands: p.budgetBands,
    size: p.size,
  };
}

export const DIMENSION_META: Record<MatchDimension, { label: string; weight: number; description: string }> = {
  technology: { label: "Technology alignment", weight: 20, description: "Provider works in the requested technology category or a closely related one." },
  industry: { label: "Industry experience", weight: 15, description: "Provider serves the buyer's sector, with sector case studies weighted higher." },
  functional: { label: "Functional capability", weight: 15, description: "Overlap between the capabilities the buyer needs and those the provider offers." },
  implementation: { label: "Implementation experience", weight: 12, description: "Documented implementations in the same category or sector." },
  capacity: { label: "Organisation size & capacity", weight: 10, description: "Provider scale relative to the size and scope of the engagement." },
  geography: { label: "Geographic suitability", weight: 10, description: "Provider coverage of the buyer's delivery locations." },
  compliance: { label: "Certifications & compliance", weight: 10, description: "Provider holds the certifications and empanelments the buyer requires." },
  commercial: { label: "Budget & commercial fit", weight: 8, description: "Provider typically delivers engagements in the buyer's budget range." },
};

const BUDGET_ORDER: BudgetBand[] = ["under-25l", "25l-1cr", "1cr-5cr", "5cr-25cr", "25cr-plus"];
const SIZE_ORDER: CompanySize[] = ["1-50", "51-200", "201-1000", "1000+"];
const SCALE_NEED: Record<Requirement["scale"], number> = { pilot: 0, department: 1, organisation: 2, statewide: 3 };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name ?? id;
const indName = (id: string) => INDUSTRIES.find((c) => c.id === id)?.name ?? id;
const regionName = (id: string) => REGIONS.find((r) => r.id === id)?.name ?? id;

export function matchLabel(score: number): MatchResult["label"] {
  if (score >= 88) return "Strong Alignment";
  if (score >= 78) return "Good Alignment";
  if (score >= 65) return "Partial Alignment";
  return "Low Alignment";
}

export function scoreMatch(req: Requirement, p: MatchableProfile, categories: TechCategory[] = CATEGORIES): MatchResult {
  const reasons: string[] = [];
  const gaps: string[] = [];
  const cat = categories.find((c) => c.id === req.categoryId);

  // 1. Technology alignment
  let technology = 20;
  if (p.categories.includes(req.categoryId)) {
    technology = p.categories[0] === req.categoryId ? 100 : 90;
    reasons.push(`Core expertise in ${catName(req.categoryId)}`);
  } else if (cat && p.categories.some((c) => cat.related.includes(c))) {
    technology = 60;
    gaps.push(`Adjacent rather than core ${catName(req.categoryId)} expertise`);
  } else {
    gaps.push(`No listed ${catName(req.categoryId)} offering`);
  }

  // 2. Industry experience
  const sectorCases = p.caseStudies.filter((c) => c.industryId === req.industryId).length;
  let industry = 30;
  if (p.industries.includes(req.industryId)) {
    industry = Math.min(100, 72 + sectorCases * 14);
    reasons.push(sectorCases > 0 ? `Delivered ${sectorCases} documented project${sectorCases > 1 ? "s" : ""} in ${indName(req.industryId)}` : `Serves ${indName(req.industryId)} clients`);
  } else {
    gaps.push(`No stated experience in ${indName(req.industryId)}`);
  }

  // 3. Functional capability
  const need = req.capabilities.map((c) => c.toLowerCase());
  const have = new Set(p.capabilities.map((c) => c.toLowerCase()));
  const covered = need.filter((c) => have.has(c));
  const functional = need.length ? clamp(25 + (covered.length / need.length) * 75) : 70;
  if (covered.length) reasons.push(`Covers ${covered.length} of ${need.length} required capabilities`);
  const missing = req.capabilities.filter((c) => !have.has(c.toLowerCase()));
  if (missing.length && missing.length <= 2) gaps.push(`Not listed: ${missing.join(", ")}`);
  else if (missing.length > 2) gaps.push(`${missing.length} required capabilities not listed`);

  // 4. Implementation experience
  const similar = p.caseStudies.filter((c) => c.categoryId === req.categoryId || (c.industryId === req.industryId && p.categories.includes(c.categoryId)));
  const implementation = clamp(35 + similar.length * 24);
  if (similar.length >= 2) reasons.push("Multiple similar implementation projects");
  else if (similar.length === 1) reasons.push("Comparable implementation on record");
  else gaps.push("No comparable case study published");

  // 5. Organisation size & capacity
  const sizeIdx = SIZE_ORDER.indexOf(p.size);
  const needIdx = SCALE_NEED[req.scale];
  const capacity = sizeIdx >= needIdx ? 100 - Math.max(0, sizeIdx - needIdx - 1) * 10 : clamp(100 - (needIdx - sizeIdx) * 28);
  if (sizeIdx < needIdx) gaps.push("Team size may be stretched for this scope");

  // 6. Geographic suitability
  let geography: number;
  if (p.regions.includes("pan-india")) {
    geography = 100;
    reasons.push("Pan-India delivery coverage");
  } else {
    const hit = req.regions.filter((r) => p.regions.includes(r));
    geography = req.regions.length ? clamp(30 + (hit.length / req.regions.length) * 70) : 80;
    if (hit.length === req.regions.length && hit.length) reasons.push(`Delivery presence in ${hit.map(regionName).join(", ")}`);
    else if (!hit.length) gaps.push("No delivery presence in the required region");
  }

  // 7. Certifications & compliance
  const certHave = new Set(p.certifications);
  const certHit = req.compliance.filter((c) => certHave.has(c));
  const compliance = req.compliance.length ? clamp(20 + (certHit.length / req.compliance.length) * 80) : 85;
  if (req.compliance.length && certHit.length === req.compliance.length) reasons.push(`Holds all required certifications (${certHit.join(", ")})`);
  else if (req.compliance.length) {
    const missingCerts = req.compliance.filter((c) => !certHave.has(c));
    gaps.push(`Missing ${missingCerts.join(", ")}`);
  }

  // 8. Budget & commercial suitability
  let commercial = 75;
  if (req.budget !== "undisclosed") {
    const bIdx = BUDGET_ORDER.indexOf(req.budget);
    if (p.budgetBands.includes(req.budget)) commercial = 100;
    else {
      const dist = Math.min(...p.budgetBands.map((b) => Math.abs(BUDGET_ORDER.indexOf(b) - bIdx)));
      commercial = clamp(100 - dist * 30);
      gaps.push("Typical engagement size differs from stated budget");
    }
  }

  const dimensions: Record<MatchDimension, number> = {
    technology,
    industry,
    functional,
    implementation,
    capacity,
    geography,
    compliance,
    commercial,
  };
  const total = (Object.keys(dimensions) as MatchDimension[]).reduce((s, k) => s + dimensions[k] * DIMENSION_META[k].weight, 0) / 100;
  const score = clamp(total);
  return { providerId: p.id, score, label: matchLabel(score), dimensions, reasons: reasons.slice(0, 5), gaps: gaps.slice(0, 4) };
}

/** Eligible = admin-approved for matching and account active. Verification is displayed but evaluated separately. */
export function isMatchEligible(p: Provider) {
  return p.matchingEligible && p.accountStatus === "active";
}

export function rankProviders(req: Requirement, providers: Provider[], categories?: TechCategory[]): MatchResult[] {
  return providers
    .filter(isMatchEligible)
    .map((p) => scoreMatch(req, toMatchable(p), categories))
    .sort((a, b) => b.score - a.score || a.providerId.localeCompare(b.providerId));
}

export function scoreTone(score: number): "strong" | "good" | "partial" | "low" {
  if (score >= 88) return "strong";
  if (score >= 78) return "good";
  if (score >= 65) return "partial";
  return "low";
}
