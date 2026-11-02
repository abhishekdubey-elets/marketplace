"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; label: string; who: string; email: string; icon: React.ElementType }[] = [
  { role: "buyer", label: "Buyer", who: "Hospital group CIO", email: "buyer@elets.demo", icon: Building2 },
  { role: "provider", label: "Solution provider", who: "Cloud services company", email: "provider@elets.demo", icon: Briefcase },
  { role: "admin", label: "Elets operations", who: "Marketplace operations", email: "admin@elets.demo", icon: ShieldCheck },
];

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) || "buyer";
  const next = params.get("next") ?? undefined;
  const [role, setRole] = React.useState<Role>(ROLES.some((r) => r.role === initialRole) ? initialRole : "buyer");
  const [email, setEmail] = React.useState(ROLES.find((r) => r.role === role)!.email);
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<"form" | Role | null>(null);

  const pick = (r: Role) => {
    setRole(r);
    setEmail(ROLES.find((x) => x.role === r)!.email);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) return setError("Enter your password.");
    setLoading("form");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, next }) });
    const j = await res.json();
    setLoading(null);
    if (!res.ok) return setError(j.error ?? "Sign-in failed.");
    toast.success("Signed in");
    router.push(j.redirect);
    router.refresh();
  };

  const demo = async (r: Role) => {
    setLoading(r);
    const res = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: r }) });
    const j = await res.json();
    if (!res.ok) {
      setLoading(null);
      return toast.error(j.error ?? "Demo sign-in unavailable");
    }
    router.push(j.redirect);
    router.refresh();
  };

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in to your workspace</h1>
      <p className="mt-1.5 text-sm text-ink-3">Choose a portal, then sign in with your account.</p>

      <div className="mt-6 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Portal">
        {ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            role="radio"
            aria-checked={role === r.role}
            onClick={() => pick(r.role)}
            className={cn(
              "rounded-xl border p-3 text-left transition",
              role === r.role ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-100" : "border-line bg-white hover:border-line-strong",
            )}
          >
            <r.icon className={cn("size-4", role === r.role ? "text-brand-600" : "text-ink-4")} />
            <p className="mt-2 text-[13px] font-medium leading-tight text-ink">{r.label}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Work email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password" error={error ?? undefined}>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              icon={<Lock />}
              value={password}
              invalid={!!error}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-4 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading === "form"}>
          Sign in <ArrowRight />
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-4">
        <span className="h-px flex-1 bg-line" /> or explore instantly <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        {ROLES.map((r) => (
          <button
            key={r.role}
            onClick={() => demo(r.role)}
            disabled={loading !== null}
            className="group flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-xs transition hover:border-brand-300 hover:shadow-raised disabled:opacity-60"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-navy-50 text-navy-600 transition group-hover:bg-brand-600 group-hover:text-white">
              <r.icon className="size-4" />
            </span>
            <span className="flex-1">
              <span className="block text-[13px] font-medium text-ink">Continue as demo {r.label.toLowerCase()}</span>
              <span className="block text-xs text-ink-3">{r.who}</span>
            </span>
            <ArrowRight className={cn("size-4 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-brand-600", loading === r.role && "animate-pulse")} />
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-[13px] text-ink-3">
        New to Elets?{" "}
        <Link href="/#cta" className="font-medium text-brand-600 hover:underline">
          Request access
        </Link>
      </p>
    </div>
  );
}
