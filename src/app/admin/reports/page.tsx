import { Suspense } from "react";
import { Reports } from "@/components/admin/reports";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <Suspense>
      <Reports />
    </Suspense>
  );
}
