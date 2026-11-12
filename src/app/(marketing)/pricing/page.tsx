import type { Metadata } from "next";
import { PricingPage } from "@/components/marketing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for organisations sourcing technology. Listing packages for technology providers, and Elets Pro managed procurement. Paid listings never affect match scores.",
};

export default function Page() {
  return <PricingPage />;
}
