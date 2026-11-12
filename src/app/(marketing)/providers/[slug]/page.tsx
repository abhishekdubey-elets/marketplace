import type { Metadata } from "next";
import { isDbConfigured, readAll } from "@/lib/db/records";
import { seed } from "@/lib/seed";
import { PublicProfile } from "./public-profile";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  let providers = seed().providers;
  if (isDbConfigured()) providers = (await readAll(["providers"]).catch(() => ({ providers }))).providers ?? [];
  const p = providers.find((x) => x.slug === slug);
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
