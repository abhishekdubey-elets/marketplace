"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLES: { role: Role; label: string; who: string; icon: React.ElementType }[] = [
  { role: "buyer", label: "Buyer", who: "Hospital group CIO", icon: Building2 },
  { role: "provider", label: "Solution provider", who: "Cloud services company", icon: Briefcase },
];

export function LoginForm() {
  const params = useSearchParams();
  const role = params.get("role") as Role | null;
  const next = params.get("next") ?? undefined;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<"form" | Role | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Enter your email.");
    if (!password) return setError("Enter your password.");
    setLoading("form");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password, next }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(null);
      return setError(j.error ?? "Sign-in failed.");
    }
    // full navigation so the workspace loads fresh with this account's data
    window.location.assign(j.redirect);
  };

  const demo = async (r: Role) => {
    setLoading(r);
    const res = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: r, next }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(null);
      return setError(j.error ?? "Demo sign-in unavailable");
    }
    window.location.assign(j.redirect);
  };

  const signupHref = `/signup${role === "buyer" || role === "provider" || next ? `?${new URLSearchParams({ ...(role === "buyer" || role === "provider" ? { role } : {}), ...(next ? { next } : {}) })}` : ""}`;

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-3">
        {role === "buyer" ? "Sign in to your buyer workspace to request introductions and post requirements." : "Welcome back to the Elets Solution Marketplace."}
      </p>

      {params.has("expired") && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800 ring-1 ring-inset ring-amber-200">Your session has ended. Please sign in again.</p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Work email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.com" />
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

      <p className="mt-4 text-center text-[13px] text-ink-3">
        New to Elets?{" "}
        <Link href={signupHref} className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-4">
        <span className="h-px flex-1 bg-line" /> or explore with a demo account <span className="h-px flex-1 bg-line" />
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
    </div>
  );
}
