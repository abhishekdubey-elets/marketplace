"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProviderNotFound, ProviderProfileView } from "@/components/shared/provider-profile";

export default function BuyerProviderPage() {
  const { slug } = useParams<{ slug: string }>();
  const provider = useStore((s) => s.providers.find((p) => p.slug === slug && p.accountStatus === "active"));
  return (
    <>
      <Link href="/buyer/discover" className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" /> Back to discovery
      </Link>
      {provider ? <ProviderProfileView provider={provider} mode="buyer" /> : <ProviderNotFound backHref="/buyer/discover" />}
    </>
  );
}
