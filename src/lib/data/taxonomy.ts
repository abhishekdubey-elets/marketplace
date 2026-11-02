import type { Industry, Region, ServiceCategory, TeamMember, TechCategory, User } from "../types";

export const INDUSTRIES: Industry[] = [
  { id: "gov", name: "Government & e-Governance", icon: "Landmark", description: "State and central departments, missions and e-governance societies.", active: true },
  { id: "psu", name: "Public Sector Undertakings", icon: "Factory", description: "PSUs, utilities and public enterprises.", active: true },
  { id: "health", name: "Healthcare", icon: "HeartPulse", description: "Hospitals, health systems, diagnostics and public health programmes.", active: true },
  { id: "edu", name: "Education", icon: "GraduationCap", description: "Universities, institutes, school networks and skilling missions.", active: true },
  { id: "bfsi", name: "BFSI", icon: "Landmark", description: "Banks, NBFCs, co-operative banks and insurers.", active: true },
  { id: "urban", name: "Smart Cities & Urban", icon: "Building2", description: "Municipal corporations, smart city SPVs and urban bodies.", active: true },
];

export const CATEGORIES: TechCategory[] = [
  { id: "ai", slug: "ai-ml", name: "Artificial Intelligence & ML", icon: "BrainCircuit", description: "Applied AI, document intelligence, conversational AI and predictive models.", featured: true, active: true, related: ["data", "dx"] },
  { id: "cloud", slug: "cloud-infrastructure", name: "Cloud & Infrastructure", icon: "Cloud", description: "Cloud migration, managed infrastructure, data centres and GovCloud.", featured: true, active: true, related: ["cyber", "dx"] },
  { id: "cyber", slug: "cybersecurity", name: "Cybersecurity", icon: "ShieldCheck", description: "SOC, identity, zero-trust, VAPT and compliance programmes.", featured: true, active: true, related: ["cloud", "fintech"] },
  { id: "enterprise", slug: "enterprise-software", name: "Enterprise Software", icon: "Boxes", description: "ERP, HRMS, CRM, workflow and document management platforms.", featured: true, active: true, related: ["dx", "gov"] },
  { id: "dx", slug: "digital-transformation", name: "Digital Transformation", icon: "Workflow", description: "Process re-engineering, citizen services and digital programme delivery.", featured: true, active: true, related: ["enterprise", "gov"] },
  { id: "data", slug: "data-analytics", name: "Data Analytics", icon: "ChartLine", description: "Data platforms, dashboards, BI and decision-support systems.", featured: true, active: true, related: ["ai", "enterprise"] },
  { id: "healthtech", slug: "healthcare-technology", name: "Healthcare Technology", icon: "Stethoscope", description: "HIS, EMR, telemedicine, ABDM integration and clinical analytics.", featured: true, active: true, related: ["data", "ai"] },
  { id: "edtech", slug: "education-technology", name: "Education Technology", icon: "School", description: "LMS, campus ERP, digital classrooms and assessment platforms.", featured: true, active: true, related: ["enterprise", "cloud"] },
  { id: "fintech", slug: "banking-fintech", name: "Banking & FinTech", icon: "Wallet", description: "Core banking, digital lending, payments and regulatory technology.", featured: true, active: true, related: ["cyber", "data"] },
  { id: "gov", slug: "smart-governance", name: "Smart Governance", icon: "Landmark", description: "Grievance redressal, citizen portals, GIS and governance analytics.", featured: true, active: true, related: ["dx", "iot"] },
  { id: "iot", slug: "iot-emerging", name: "IoT & Emerging Technologies", icon: "Radio", description: "Sensors, command centres, drones, digital twins and edge computing.", featured: true, active: true, related: ["gov", "data"] },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: "consulting", name: "Consulting & Advisory", active: true },
  { id: "implementation", name: "Implementation & Integration", active: true },
  { id: "managed", name: "Managed Services", active: true },
  { id: "product", name: "Product / Platform Licensing", active: true },
  { id: "support", name: "Support & Maintenance", active: true },
  { id: "training", name: "Training & Capacity Building", active: true },
];

export const REGIONS: Region[] = [
  { id: "pan-india", name: "Pan-India", active: true },
  { id: "north", name: "North India", active: true },
  { id: "south", name: "South India", active: true },
  { id: "west", name: "West India", active: true },
  { id: "east", name: "East India", active: true },
  { id: "northeast", name: "North-East India", active: true },
  { id: "central", name: "Central India", active: true },
];

export const COMPLIANCE_OPTIONS = [
  "ISO 27001",
  "ISO 9001",
  "CMMI Level 3",
  "CMMI Level 5",
  "MeitY Empanelled Cloud",
  "CERT-In Empanelled",
  "SOC 2 Type II",
  "ABDM Certified",
  "HIPAA Aligned",
  "RBI Guidelines",
  "GIGW Compliant",
  "ISO 20000",
  "PCI DSS",
];

export const BUDGET_LABELS: Record<string, string> = {
  "under-25l": "Under ₹25 Lakh",
  "25l-1cr": "₹25 Lakh – ₹1 Crore",
  "1cr-5cr": "₹1 – 5 Crore",
  "5cr-25cr": "₹5 – 25 Crore",
  "25cr-plus": "₹25 Crore+",
  undisclosed: "Not disclosed",
};

export const TIMELINE_LABELS: Record<string, string> = {
  immediate: "Immediate (< 1 month)",
  "1-3m": "1 – 3 months",
  "3-6m": "3 – 6 months",
  "6-12m": "6 – 12 months",
  exploratory: "Exploratory / no fixed date",
};

export const SCALE_LABELS: Record<string, string> = {
  pilot: "Pilot / proof of concept",
  department: "Single department",
  organisation: "Organisation-wide",
  statewide: "Statewide / multi-site",
};

export const DEPLOYMENT_LABELS: Record<string, string> = {
  cloud: "Public cloud",
  "on-premise": "On-premise",
  hybrid: "Hybrid",
  "gov-cloud": "MeitY GovCloud",
};

export const SIZE_LABELS: Record<string, string> = {
  "1-50": "1 – 50 employees",
  "51-200": "51 – 200 employees",
  "201-1000": "201 – 1,000 employees",
  "1000+": "1,000+ employees",
};

/** Elets operations team (fictional, for demo) */
export const TEAM: TeamMember[] = [
  { id: "t-ananya", name: "Ananya Rao", title: "Senior Relationship Manager", email: "ananya.rao@elets.demo", phone: "+91 98100 00001", initials: "AR", focus: ["gov", "urban"] },
  { id: "t-vikram", name: "Vikram Mehta", title: "Relationship Manager — BFSI", email: "vikram.mehta@elets.demo", phone: "+91 98100 00002", initials: "VM", focus: ["bfsi"] },
  { id: "t-priya", name: "Priya Nair", title: "Relationship Manager — Healthcare", email: "priya.nair@elets.demo", phone: "+91 98100 00003", initials: "PN", focus: ["health"] },
  { id: "t-rohan", name: "Rohan Kapoor", title: "Solutions Analyst", email: "rohan.kapoor@elets.demo", phone: "+91 98100 00004", initials: "RK", focus: ["edu", "psu"] },
  { id: "t-neha", name: "Neha Sharma", title: "Head of Marketplace Operations", email: "neha.sharma@elets.demo", phone: "+91 98100 00005", initials: "NS", focus: [] },
];

/** Demo login accounts. Passwords are validated server-side only (src/lib/auth/demo-accounts.ts). */
export const USERS: User[] = [
  { id: "u-buyer", name: "Dr. Kavita Menon", email: "buyer@elets.demo", role: "buyer", title: "Chief Information Officer", orgId: "b-sahyadri", initials: "KM" },
  { id: "u-provider", name: "Arjun Iyer", email: "provider@elets.demo", role: "provider", title: "Head of Public Sector Business", orgId: "p-nimbus", initials: "AI" },
  { id: "u-admin", name: "Neha Sharma", email: "admin@elets.demo", role: "admin", title: "Head of Marketplace Operations", orgId: null, initials: "NS" },
];
