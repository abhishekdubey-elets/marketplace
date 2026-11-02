"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProviderNotFound, ProviderProfileView } from "@/components/shared/provider-profile";

export function PublicProfile({ slug }: { slug: string }) {
  const provider = useStore((s) => s.providers.find((p) => p.slug === slug && p.accountStatus === "active"));
  return (
    <>
      <Link href="/solutions" className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ChevronLeft className="size-4" /> All providers
      </Link>
      {provider ? <ProviderProfileView provider={provider} mode="public" /> : <ProviderNotFound backHref="/solutions" />}
    </>
  );
}
