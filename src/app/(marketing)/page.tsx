import type { Metadata } from "next";
import { Landing } from "@/components/marketing/landing";

export const metadata: Metadata = {
  title: { absolute: "Elets Solution Marketplace — Find the Right Technology. Build the Right Partnerships." },
};

export default function HomePage() {
  return <Landing />;
}
