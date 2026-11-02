import Link from "next/link";
import { ArrowLeft, Compass, Search } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-white">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_50%_at_50%_40%,black,transparent)]" />
      <header className="relative mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Logo />
      </header>
      <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 -m-6 rounded-full bg-brand-50" />
          <div className="relative grid size-16 place-items-center rounded-2xl border border-line bg-white text-brand-600 shadow-raised">
            <Compass className="size-7" />
          </div>
        </div>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-ink-4">Error 404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">This page isn&apos;t on the map</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3">The page you&apos;re looking for doesn&apos;t exist or may have moved. Try exploring solutions or head back to the homepage.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/">
              <ArrowLeft /> Back to home
            </Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/solutions">
              <Search /> Explore solutions
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
