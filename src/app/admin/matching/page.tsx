import { Suspense } from "react";
import { MatchingQueue } from "@/components/admin/matching-queue";

export const metadata = { title: "Matching review" };

export default function Page() {
  return (
    <Suspense>
      <MatchingQueue />
    </Suspense>
  );
}
