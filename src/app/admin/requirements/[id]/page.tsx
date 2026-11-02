import { Suspense } from "react";
import { RequirementWorkspace } from "@/components/admin/requirement-workspace";

export const metadata = { title: "Requirement" };

export default function Page() {
  return (
    <Suspense>
      <RequirementWorkspace />
    </Suspense>
  );
}
