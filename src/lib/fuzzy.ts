/**
 * Fuzzy capability matching.
 *
 * Capabilities are free-text tags typed by buyers and providers, so the same
 * thing is often written differently: "Telemedicine" / "Tele-medicine" /
 * "Telehealth", "EMR" / "Electronic health records", "Dashboards & BI" /
 * "Business intelligence". Comparing two tags goes through four steps:
 *
 * 1. Normalise: lower case, "&" → "and", hyphens joined ("e-Office" → "eoffice"),
 *    British/American spellings unified, filler words ("and", "for",
 *    "services"…) dropped, simple plurals and "-ing" removed.
 * 2. Concepts: known acronyms and synonyms are mapped to one concept, so
 *    "EMR", "EHR" and "electronic medical records" become the same token. This
 *    also works inside longer tags ("Indic language NLP" contains NLP).
 * 3. Compare words: each word is paired with its closest word on the other side.
 *    Words with a small typo still count ("Telemedecine"). Generic words such as
 *    "data", "digital" or "management" carry less weight than specific ones.
 * 4. Compare the whole tag with spaces removed, to catch typos and spacing.
 *
 * The similarity (0–1) is then graded:
 *   ≥ 0.9  "match"   counts as covered (full credit)
 *   ≥ 0.6  "related" partly covered (half credit), shown as related experience
 *   < 0.6  not covered
 */

export const FULL_MATCH = 0.9;
export const RELATED_MATCH = 0.6;

/** Synonym and acronym groups. Every phrase in a group is treated as the same concept. */
const CONCEPTS: string[][] = [
  ["emr", "ehr", "electronic medical record", "electronic health record", "electronic medical records system"],
  ["his", "hmis", "hospital information system", "hospital management system", "hospital management information system"],
  ["lis", "lims", "laboratory information system", "lab information system", "laboratory information management system"],
  ["pacs", "picture archiving and communication system", "medical image archive"],
  ["telemedicine", "telehealth", "teleconsultation", "tele consultation", "virtual consultation", "remote consultation"],
  ["abdm", "ndhm", "abha", "ayushman bharat digital mission", "national digital health mission"],
  ["lms", "learning management system", "learning platform", "elearning platform"],
  ["erp", "enterprise resource planning"],
  ["hrms", "hris", "hcm", "human resource management system", "hr management system", "human resource information system", "human capital management"],
  ["gis", "geographic information system", "geospatial"],
  ["ocr", "optical character recognition"],
  ["nlp", "natural language processing"],
  ["conversational ai", "chatbot", "virtual assistant", "voicebot", "voice bot"],
  ["ai", "artificial intelligence"],
  ["ml", "machine learning"],
  ["bi", "business intelligence", "dashboard", "dashboard and bi", "reporting dashboard"],
  ["siem", "security information and event management"],
  ["soc", "security operations centre", "security operation centre", "soc operation", "managed soc"],
  ["vapt", "vulnerability assessment and penetration testing", "vulnerability assessment", "penetration testing", "pentest", "pen testing"],
  ["disaster recovery", "business continuity", "bcp", "dr site"],
  ["ekyc", "kyc", "know your customer", "video kyc", "digital onboarding"],
  ["iam", "identity and access", "identity and access management", "identity management", "access management", "sso", "single sign on"],
  ["iot", "internet of thing", "sensor network", "sensor"],
  ["kubernetes", "k8s", "container orchestration"],
  ["command and control centre", "iccc", "integrated command and control centre", "command centre", "control room"],
  ["eoffice", "efile", "office automation", "file tracking system"],
  ["grievance redressal", "grievance management", "complaint management", "public grievance"],
  ["document management", "dms", "document management system", "record management"],
  ["workflow automation", "rpa", "robotic process automation", "process automation", "bpm", "business process management"],
  ["citizen service portal", "citizen portal", "egovernance portal", "public service portal", "service delivery portal"],
  ["core banking", "cbs", "core banking system", "core banking solution"],
  ["payment", "payment gateway", "upi", "digital payment"],
  ["predictive analytic", "predictive model", "predictive modelling", "forecasting"],
  ["video analytic", "cctv analytic", "video surveillance analytic", "intelligent video analytic"],
  ["cloud migration", "migration to cloud", "cloud modernisation"],
  ["data centre", "datacentre", "dc"],
];

/** Words that say little on their own, so they count for less. */
const GENERIC = new Set(["data", "digital", "management", "analytic", "platform", "system", "solution", "smart", "online", "support", "implementation", "integration", "software", "application", "development", "operation", "technology", "tool", "service"]);

/** Words dropped entirely. */
const STOP = new Set(["and", "or", "of", "for", "the", "a", "an", "to", "in", "on", "with", "by", "services", "solutions"]);

const SPELLING: [RegExp, string][] = [
  [/\bcenter\b/g, "centre"],
  [/\bcenters\b/g, "centres"],
  [/\bprogram\b/g, "programme"],
  [/\bprograms\b/g, "programmes"],
  [/\bmodelling\b/g, "modeling"],
  [/(\w)ization/g, "$1isation"],
  [/(\w)izing\b/g, "$1ising"],
  [/(\w)ize\b/g, "$1ise"],
  [/\banalyze\b/g, "analyse"],
];

function stem(t: string): string {
  if (t.length <= 4) return t; // short words are usually acronyms: "his", "pacs", "hrms"
  if (t.endsWith("ies") && t.length > 5) return t.slice(0, -3) + "y";
  if (t.endsWith("ing") && t.length > 6) return t.slice(0, -3);
  if (t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us") && !t.endsWith("is")) return t.slice(0, -1);
  return t;
}

function words(raw: string): string[] {
  let s = raw.toLowerCase().replace(/&/g, " and ");
  for (const [re, to] of SPELLING) s = s.replace(re, to);
  s = s.replace(/(\w)[-‐–](\w)/g, "$1$2"); // join hyphenated words: e-office, tele-medicine
  return s
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

// Concept phrases as word sequences, longest first so "conversational ai" wins over "ai".
const CONCEPT_SEQS: { seq: string[]; id: string }[] = CONCEPTS.flatMap((group, i) => group.map((p) => ({ seq: words(p), id: `#${i}` })))
  .filter((c) => c.seq.length)
  .sort((a, b) => b.seq.length - a.seq.length);

function toTokens(raw: string): string[] {
  const w = words(raw);
  const out: string[] = [];
  for (let i = 0; i < w.length; ) {
    const hit = CONCEPT_SEQS.find((c) => c.seq.every((x, k) => w[i + k] === x));
    if (hit) {
      out.push(hit.id);
      i += hit.seq.length;
    } else out.push(w[i++]);
  }
  return [...new Set(out)];
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

const ratio = (a: string, b: string) => 1 - levenshtein(a, b) / Math.max(a.length, b.length);

function wordSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.startsWith("#") || b.startsWith("#")) return 0; // concepts only match themselves
  if (Math.min(a.length, b.length) >= 5) {
    const r = ratio(a, b);
    if (r >= 0.8) return r; // small typo
    if (a.startsWith(b) || b.startsWith(a)) return 0.85; // "telemed" / "telemedicine"
  }
  return 0;
}

const weight = (t: string) => (GENERIC.has(t) ? 0.3 : 1);

interface Prepared {
  tokens: string[];
  compact: string;
}

const cache = new Map<string, Prepared>();
function prepare(raw: string): Prepared {
  let p = cache.get(raw);
  if (!p) {
    p = { tokens: toTokens(raw), compact: words(raw).join("") };
    if (cache.size > 5000) cache.clear();
    cache.set(raw, p);
  }
  return p;
}

/** Similarity of two capability tags, 0–1. */
export function capabilitySimilarity(a: string, b: string): number {
  const A = prepare(a);
  const B = prepare(b);
  if (!A.tokens.length || !B.tokens.length) return 0;
  if (A.compact === B.compact) return 1;

  // weighted soft overlap: each word paired with its best counterpart
  const side = (X: string[], Y: string[]) => X.reduce((s, x) => s + weight(x) * Math.max(...Y.map((y) => wordSimilarity(x, y))), 0);
  const total = A.tokens.reduce((s, t) => s + weight(t), 0) + B.tokens.reduce((s, t) => s + weight(t), 0);
  const overlap = (side(A.tokens, B.tokens) + side(B.tokens, A.tokens)) / total;

  // containment: one tag is a more specific version of the other ("NLP" / "Indic language NLP").
  // If the extra words are all generic ("GIS" / "GIS analytics") it is the same capability.
  let contained = 0;
  for (const [S, L] of [
    [A.tokens, B.tokens],
    [B.tokens, A.tokens],
  ]) {
    const covered = side(S, L) / S.reduce((s, t) => s + weight(t), 0);
    if (covered >= 0.9) {
      const extra = L.filter((l) => Math.max(...S.map((x) => wordSimilarity(l, x))) < 0.8);
      contained = Math.max(contained, extra.every((t) => GENERIC.has(t)) ? 0.95 : 0.75);
    }
  }

  // whole tag, ignoring spaces: catches typos across word boundaries
  const whole = Math.min(A.compact.length, B.compact.length) >= 6 ? ratio(A.compact, B.compact) : 0;

  return Math.max(overlap, contained, whole >= 0.88 ? whole : 0);
}

export interface CapabilityMatch {
  /** The capability the buyer asked for. */
  need: string;
  /** The provider capability that fits it best, if any is close enough. */
  match: string | null;
  similarity: number;
  /** exact: same tag; match: same thing written differently; related: partly covered; none. */
  kind: "exact" | "match" | "related" | "none";
}

/** Pair every needed capability with the provider's closest one. */
export function matchCapabilities(need: string[], have: string[]): CapabilityMatch[] {
  return need.map((n) => {
    let best: string | null = null;
    let sim = 0;
    for (const h of have) {
      const s = h.trim().toLowerCase() === n.trim().toLowerCase() ? 1 : capabilitySimilarity(n, h);
      if (s > sim) {
        sim = s;
        best = h;
      }
      if (sim === 1) break;
    }
    const exact = best !== null && best.trim().toLowerCase() === n.trim().toLowerCase();
    const kind: CapabilityMatch["kind"] = exact ? "exact" : sim >= FULL_MATCH ? "match" : sim >= RELATED_MATCH ? "related" : "none";
    return { need: n, match: kind === "none" ? null : best, similarity: Math.round(sim * 100) / 100, kind };
  });
}
