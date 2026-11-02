import { Suspense } from "react";
import { AdminDashboard } from "@/components/admin/dashboard";

export const metadata = { title: "Operations overview" };

export default function Page() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
