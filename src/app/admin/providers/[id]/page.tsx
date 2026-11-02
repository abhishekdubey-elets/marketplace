import { Suspense } from "react";
import { ProviderDetail } from "@/components/admin/provider-detail";

export const metadata = { title: "Provider review" };

export default function Page() {
  return (
    <Suspense>
      <ProviderDetail />
    </Suspense>
  );
}
