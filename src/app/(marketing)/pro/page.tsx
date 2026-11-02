import type { Metadata } from "next";
import { ProPage } from "@/components/marketing/pro-page";

export const metadata: Metadata = {
  title: "Elets Pro — Managed Solutions",
  description: "Managed technology procurement support from Elets: requirement discovery, market intelligence, vendor shortlisting, due diligence, RFP support, evaluation, negotiation and post-award review.",
};

export default function Page() {
  return <ProPage />;
}
