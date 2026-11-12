import { PRO_MODULES, type PricingContent, type PricingPlan } from "./types";

/**
 * Starting content for the pricing page. Everything here, prices included, is
 * edited in Operations > Content > Pricing; edits are stored in site content.
 * Prices are left blank ("Contact us") until Elets sets them.
 */
export const DEFAULT_PRICING: PricingContent = {
  headline: "Simple, transparent pricing",
  subtext:
    "Organisations sourcing technology use the marketplace free of charge. Technology providers choose how visible they want to be — and no plan ever changes who gets matched.",
  note: "Listing packages affect visibility only. They are never an input to the matching engine and never change match scores or rankings.",
  plans: [
    {
      id: "buyers",
      group: "buyers",
      name: "Buyers",
      price: "Free",
      period: "",
      description: "For government departments, PSUs, hospitals, universities, banks and enterprises sourcing technology.",
      features: [
        "Post and track technology requirements",
        "Explainable matching across eight dimensions",
        "Browse and compare verified providers",
        "Elets-facilitated introductions",
        "Shortlists, meetings and messages in one place",
      ],
      ctaLabel: "Post a requirement",
      ctaHref: "/signup?role=buyer&next=/buyer/requirements/new",
    },
    {
      id: "pro",
      group: "pro",
      name: "Elets Pro",
      price: "",
      period: "",
      description: "Managed technology procurement with a dedicated Elets relationship manager, from first brief to final award.",
      features: PRO_MODULES.map((m) => m.name),
      ctaLabel: "Explore Elets Pro",
      ctaHref: "/pro",
      highlight: true,
    },
    {
      id: "standard",
      group: "providers",
      name: "Standard listing",
      price: "Free",
      period: "",
      description: "For technology companies getting started on the marketplace.",
      features: [
        "Company profile with solutions and case studies",
        "Verification by the Elets team",
        "Eligible for matching once approved",
        "Matched opportunities and introductions",
        "Profile and pipeline analytics",
      ],
      ctaLabel: "List your company",
      ctaHref: "/signup?role=provider",
    },
    {
      id: "featured",
      group: "providers",
      name: "Featured listing",
      price: "",
      period: "",
      description: "For providers who want more visibility in the directory.",
      features: ["Everything in Standard", "Featured badge on your directory card and profile, clearly disclosed", "Considered for homepage featured placement"],
      ctaLabel: "Talk to us",
      ctaHref: "mailto:info@elets.in?subject=Featured%20listing%20enquiry",
      highlight: true,
    },
    {
      id: "premium",
      group: "providers",
      name: "Premium listing",
      price: "",
      period: "",
      description: "For providers who want the most visibility across the marketplace.",
      features: ["Everything in Featured", "Premium badge on your directory card and profile, clearly disclosed", "Considered for homepage featured placement"],
      ctaLabel: "Talk to us",
      ctaHref: "mailto:info@elets.in?subject=Premium%20listing%20enquiry",
    },
  ],
};

export const pricingOf = (content: { pricing?: PricingContent }): PricingContent => content.pricing ?? DEFAULT_PRICING;

/** Only allow in-site paths, email, phone and https links from editable content. */
export function safeHref(href: string): string {
  const h = href.trim();
  return /^(\/(?!\/)|mailto:|tel:|https:\/\/)/i.test(h) ? h : "/";
}

export const priceLabel = (p: PricingPlan) => p.price.trim() || "Contact us";
