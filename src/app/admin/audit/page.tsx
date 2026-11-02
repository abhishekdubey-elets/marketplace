import { Suspense } from "react";
import { AuditLog } from "@/components/admin/audit-log";

export const metadata = { title: "Audit log" };

export default function Page() {
  return (
    <Suspense>
      <AuditLog />
    </Suspense>
  );
}
