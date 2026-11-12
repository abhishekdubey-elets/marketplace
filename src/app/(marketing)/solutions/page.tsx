import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryView } from "@/components/shared/discovery";
import { SolutionsCta, SolutionsHero } from "@/components/marketing/solutions-hero";
import { PageSkeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Explore solutions",
  description: "Discover verified technology providers across government, healthcare, education and BFSI.",
};

export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <Suspense fallback={<PageSkeleton />}>
          <DiscoveryView basePath="/solutions" profileHref="/providers" />
        </Suspense>
      </div>
      <SolutionsCta />
    </>
  );
}
