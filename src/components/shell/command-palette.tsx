"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as D from "@radix-ui/react-dialog";
import { ArrowRight, Building2, ClipboardList, Clock, CornerDownLeft, Layers, Package, Search, Sparkles, Tags, Wrench } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { providerHref } from "@/lib/hooks";
import { NAV } from "./nav";
import { ProviderLogo, VerificationBadge, Kbd } from "@/components/ui/misc";
import { DynIcon } from "@/components/ui/icon";

const ITEM =
  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink-2 outline-none data-[selected=true]:bg-navy-50 data-[selected=true]:text-ink [&_svg]:size-4 [&_svg]:shrink-0";
const GROUP = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink-4";

export function CommandPalette({ role, orgId, open, onOpenChange }: { role: Role | null; orgId?: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const providers = useStore((s) => s.providers);
  const categories = useStore((s) => s.categories);
  const industries = useStore((s) => s.industries);
  const requirements = useStore((s) => s.requirements);
  const recently = useStore((s) => s.recentlyViewed);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const listed = providers.filter((p) => p.accountStatus === "active" || role === "admin");
  const discover = role === "buyer" ? "/buyer/discover" : "/solutions";
  const solutions = listed.flatMap((p) => p.solutions.map((s) => ({ ...s, provider: p })));
  const capabilities = Array.from(new Set(listed.flatMap((p) => p.capabilities))).sort();
  const reqs =
    role === "admin" ? requirements : role === "buyer" ? requirements.filter((r) => r.buyerId === orgId) : [];
  const pages = role ? NAV[role].flatMap((g) => g.items) : [];
  const recent = recently.map((id) => providers.find((p) => p.id === id)).filter(Boolean) as typeof providers;
  const showAll = q.trim().length > 0;

  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[90] bg-navy-950/40 backdrop-blur-[2px] animate-fade-in" />
        <D.Content className="fixed left-1/2 top-[12vh] z-[90] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-white shadow-overlay animate-slide-up outline-none">
          <D.Title className="sr-only">Search the marketplace</D.Title>
          <D.Description className="sr-only">Search providers, solutions, capabilities, categories and requirements</D.Description>
          <Command label="Global search" loop>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-ink-4" />
              <Command.Input
                value={q}
                onValueChange={setQ}
                placeholder="Search companies, solutions, capabilities, categories…"
                className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-4"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-4 py-10 text-center text-sm text-ink-3">
                No matches for “{q}”.{" "}
                <button className="font-medium text-brand-600 hover:underline" onClick={() => go(`${discover}?q=${encodeURIComponent(q)}`)}>
                  Search all providers
                </button>
              </Command.Empty>

              {!showAll && recent.length > 0 && (
                <Command.Group heading="Recently viewed" className={GROUP}>
                  {recent.slice(0, 4).map((p) => (
                    <Command.Item key={p.id} value={`recent ${p.name}`} onSelect={() => go(providerHref(role, p))} className={ITEM}>
                      <Clock className="text-ink-4" />
                      <span className="flex-1 truncate">{p.name}</span>
                      <ArrowRight className="text-ink-4" />
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Companies" className={GROUP}>
                {(showAll ? listed : listed.slice(0, 5)).map((p) => (
                  <Command.Item key={p.id} value={`company ${p.name} ${p.tagline} ${p.hq}`} onSelect={() => go(providerHref(role, p))} className={ITEM}>
                    <ProviderLogo provider={p} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{p.name}</span>
                      <span className="block truncate text-xs text-ink-3">{p.tagline}</span>
                    </span>
                    <VerificationBadge status={p.verification} compact />
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Technology categories" className={GROUP}>
                {categories
                  .filter((c) => c.active)
                  .slice(0, showAll ? undefined : 4)
                  .map((c) => (
                    <Command.Item key={c.id} value={`category ${c.name} ${c.description}`} onSelect={() => go(`${discover}?category=${c.id}`)} className={ITEM}>
                      <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <DynIcon name={c.icon} className="size-4" />
                      </span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <Tags className="text-ink-4" />
                    </Command.Item>
                  ))}
              </Command.Group>

              {showAll && (
                <>
                  <Command.Group heading="Solutions & products" className={GROUP}>
                    {solutions.map((s) => (
                      <Command.Item key={s.provider.id + s.id} value={`solution ${s.name} ${s.summary} ${s.provider.name}`} onSelect={() => go(providerHref(role, s.provider))} className={ITEM}>
                        <Package className="text-ink-4" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink">{s.name}</span>
                          <span className="block truncate text-xs text-ink-3">by {s.provider.name}</span>
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Group heading="Capabilities & services" className={GROUP}>
                    {capabilities.map((c) => (
                      <Command.Item key={c} value={`capability ${c}`} onSelect={() => go(`${discover}?q=${encodeURIComponent(c)}`)} className={ITEM}>
                        <Wrench className="text-ink-4" />
                        <span className="flex-1 truncate">{c}</span>
                        <span className="text-xs text-ink-4">{listed.filter((p) => p.capabilities.includes(c)).length} providers</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Group heading="Industries" className={GROUP}>
                    {industries.map((i) => (
                      <Command.Item key={i.id} value={`industry ${i.name}`} onSelect={() => go(`${discover}?industry=${i.id}`)} className={ITEM}>
                        <Building2 className="text-ink-4" />
                        <span className="flex-1 truncate">{i.name}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}

              {reqs.length > 0 && (
                <Command.Group heading="Requirements" className={GROUP}>
                  {(showAll ? reqs : reqs.slice(0, 3)).map((r) => (
                    <Command.Item key={r.id} value={`requirement ${r.code} ${r.title}`} onSelect={() => go(`/${role}/requirements/${r.id}`)} className={ITEM}>
                      <ClipboardList className="text-ink-4" />
                      <span className="w-28 shrink-0 font-mono text-xs text-ink-3">{r.code}</span>
                      <span className="flex-1 truncate">{r.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {pages.length > 0 && (
                <Command.Group heading="Go to" className={GROUP}>
                  {pages.map((p) => (
                    <Command.Item key={p.href} value={`page ${p.label}`} onSelect={() => go(p.href)} className={ITEM}>
                      <p.icon className="text-ink-4" />
                      <span className="flex-1">{p.label}</span>
                    </Command.Item>
                  ))}
                  {role !== "admin" && (
                    <Command.Item value="page elets pro managed" onSelect={() => go("/pro")} className={ITEM}>
                      <Sparkles className="text-flame-600" />
                      <span className="flex-1">About Elets Pro</span>
                    </Command.Item>
                  )}
                </Command.Group>
              )}
              {!role && (
                <Command.Group heading="Go to" className={GROUP}>
                  <Command.Item value="page explore solutions" onSelect={() => go("/solutions")} className={ITEM}>
                    <Layers className="text-ink-4" /> Explore solutions
                  </Command.Item>
                  <Command.Item value="page elets pro" onSelect={() => go("/pro")} className={ITEM}>
                    <Sparkles className="text-flame-600" /> Elets Pro
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
            <div className="flex items-center gap-4 border-t border-line bg-subtle/60 px-4 py-2 text-[11px] text-ink-3">
              <span className="inline-flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft className="size-2.5" />
                </Kbd>{" "}
                open
              </span>
              <span className="ml-auto">Search covers companies, products, services, capabilities, industries and categories</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
