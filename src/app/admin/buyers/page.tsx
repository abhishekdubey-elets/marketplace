import { Suspense } from "react";
import { BuyersList } from "@/components/admin/buyers-list";

export const metadata = { title: "Buyers" };

export default function Page() {
  return (
    <Suspense>
      <BuyersList />
    </Suspense>
  );
}
