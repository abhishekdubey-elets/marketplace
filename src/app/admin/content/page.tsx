import { Suspense } from "react";
import { ContentManager } from "@/components/admin/content-manager";

export const metadata = { title: "Content" };

export default function Page() {
  return (
    <Suspense>
      <ContentManager />
    </Suspense>
  );
}
