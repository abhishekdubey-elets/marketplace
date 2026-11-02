import { Suspense } from "react";
import { MessagesView } from "@/components/shared/messages-view";

export const metadata = { title: "Messages" };

export default function Page() {
  return (
    <Suspense>
      <MessagesView />
    </Suspense>
  );
}
