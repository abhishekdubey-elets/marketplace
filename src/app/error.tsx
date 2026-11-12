"use client";

import * as React from "react";
import Link from "next/link";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-raised">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
          <TriangleAlert className="size-5" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">An unexpected error occurred while loading this page. You can try again — changes you&apos;ve already saved are kept.</p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-ink-4">Reference: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw /> Try again
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/">
              <House /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
