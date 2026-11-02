import { Suspense } from "react";
import { RequirementsList } from "@/components/admin/requirements-list";

export const metadata = { title: "Requirements" };

export default function Page() {
  return (
    <Suspense>
      <RequirementsList />
    </Suspense>
  );
}
