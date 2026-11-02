import type { Metadata } from "next";
import { PROVIDERS } from "@/lib/data/providers";
import { PublicProfile } from "./public-profile";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PROVIDERS.find((x) => x.slug === slug);
  return { title: p ? p.name : "Provider", description: p?.tagline };
}

export default async function ProviderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <PublicProfile slug={slug} />
    </div>
  );
}
