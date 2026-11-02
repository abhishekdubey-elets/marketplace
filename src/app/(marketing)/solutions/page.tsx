import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";
import { DiscoveryView } from "@/components/shared/discovery";
import { PageSkeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Explore solutions",
  description: "Discover verified technology providers across government, healthcare, education and BFSI.",
};

export default function SolutionsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="size-3.5" /> Solution discovery
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink text-balance sm:text-4xl">Explore technology providers</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
            Search by company, product, capability, industry or technology category. Profiles marked Elets Verified have been reviewed by the Elets team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 shadow-xs">
            <BadgeCheck className="size-3.5 text-emerald-600" /> Verification reviewed by Elets
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 shadow-xs">
            <ShieldCheck className="size-3.5 text-accent-600" /> Ranking never paid
          </span>
        </div>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <DiscoveryView basePath="/solutions" profileHref="/providers" />
      </Suspense>
    </div>
  );
}
