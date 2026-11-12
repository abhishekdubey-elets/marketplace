import { Suspense } from "react";
import { UpgradePage } from "@/components/buyer/upgrade";

export const metadata = { title: "Upgrade to Premium" };

export default function Page() {
  return (
    <Suspense>
      <UpgradePage />
    </Suspense>
  );
}
