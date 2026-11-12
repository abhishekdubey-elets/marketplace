import type { Metadata } from "next";
import { PricingPage } from "@/components/marketing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free automatic matching for organisations sourcing technology, Premium managed by the Elets team, and listing packages for technology providers. Paid listings never affect match scores.",
};

export default function Page() {
  return <PricingPage />;
}
