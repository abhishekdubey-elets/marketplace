import { Suspense } from "react";
import { OpportunitiesBoard } from "@/components/admin/opportunities-board";

export const metadata = { title: "Opportunities" };

export default function Page() {
  return (
    <Suspense>
      <OpportunitiesBoard />
    </Suspense>
  );
}
