import { Suspense } from "react";
import { ProvidersList } from "@/components/admin/providers-list";

export const metadata = { title: "Providers" };

export default function Page() {
  return (
    <Suspense>
      <ProvidersList />
    </Suspense>
  );
}
