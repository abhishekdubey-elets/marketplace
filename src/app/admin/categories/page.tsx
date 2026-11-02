import { Suspense } from "react";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const metadata = { title: "Categories" };

export default function Page() {
  return (
    <Suspense>
      <CategoriesManager />
    </Suspense>
  );
}
