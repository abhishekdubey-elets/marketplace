"use client";

import { useParams } from "next/navigation";
import { ProWorkspace } from "@/components/pro/workspace";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ProWorkspace engagementId={id} mode="admin" />;
}
