"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutDashboard, Menu, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/overlay";
import { CommandPalette } from "@/components/shell/command-palette";
import { useSession } from "@/components/providers";

const LINKS = [
  { label: "Solutions", href: "/solutions" },
  { label: "Elets Pro", href: "/pro", pro: true },
  { label: "How it works", href: "/#how" },
  { label: "Industries", href: "/#industries" },
  { label: "Pricing", href: "/pricing" },
];

export function SiteHeader() {
  const user = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [search, setSearch] = React.useState(false);

  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  React.useEffect(() => setMenu(false), [pathname]);

  const active = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(href + "/"));
  const workspace = user ? `/${user.role}` : null;
  // Pages with a dark hero get a light-on-dark header until the user scrolls.
  const dark = pathname === "/pro" && !scrolled;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b transition-colors duration-200",
          scrolled ? "border-line bg-white/80 shadow-[0_1px_0_rgb(16_24_40/0.02)] backdrop-blur-xl" : "border-transparent bg-white/0",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Logo dark={dark} />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition",
                  dark ? (active(l.href) ? "text-white" : "text-navy-300 hover:text-white") : active(l.href) ? "text-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {l.pro && <Sparkles className={cn("size-3.5", dark ? "text-accent-300" : "text-accent-500")} />}
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearch(true)}
              className={cn(
                "hidden h-9 items-center gap-2 rounded-lg border px-3 text-[13px] transition md:flex md:w-56 lg:w-9 lg:justify-center lg:px-0 xl:w-56 xl:justify-start xl:px-3",
                dark ? "border-white/15 bg-white/5 text-navy-300 hover:bg-white/10" : "border-line bg-white/70 text-ink-4 hover:border-line-strong hover:bg-white",
              )}
              aria-label="Search the marketplace"
            >
              <Search className="size-4" />
              <span className="flex-1 text-left lg:hidden xl:inline">Search solutions…</span>
              <Kbd className={cn("lg:hidden xl:inline-flex", dark && "border-white/15 bg-white/10 text-navy-200")}>/</Kbd>
            </button>
            <Button variant="ghost" size="icon-sm" className={cn("md:hidden", dark && "text-white hover:bg-white/10 hover:text-white")} onClick={() => setSearch(true)} aria-label="Search the marketplace">
              <Search />
            </Button>
            {workspace ? (
              <Button size="sm" variant={dark ? "white" : "primary"} asChild className="hidden sm:inline-flex">
                <Link href={workspace}>
                  <LayoutDashboard /> Go to workspace
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className={cn("hidden sm:inline-flex", dark && "text-white hover:bg-white/10 hover:text-white")}>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" variant={dark ? "white" : "primary"} asChild className="hidden sm:inline-flex">
                  <Link href="/login?role=buyer&next=/buyer/requirements/new">
                    Post a requirement <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon-sm" className={cn("lg:hidden", dark && "text-white hover:bg-white/10 hover:text-white")} onClick={() => setMenu(true)} aria-label="Open menu">
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={menu} onOpenChange={setMenu} title="Menu" width="sm">
        <nav className="space-y-1" aria-label="Mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenu(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink-2 transition hover:bg-navy-50 hover:text-ink"
            >
              {l.pro && <Sparkles className="size-4 text-accent-500" />}
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-2 border-t border-line pt-6">
          {workspace ? (
            <Button className="w-full" asChild>
              <Link href={workspace}>
                <LayoutDashboard /> Go to workspace
              </Link>
            </Button>
          ) : (
            <>
              <Button className="w-full" asChild>
                <Link href="/login?role=buyer&next=/buyer/requirements/new">Post a requirement</Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/login?role=provider">List your company</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </Sheet>

      <CommandPalette role={user?.role ?? null} orgId={user?.orgId} open={search} onOpenChange={setSearch} />
    </>
  );
}
