"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function OpsLoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setLoading(true);
    const res = await fetch("/api/auth/ops-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setPassword("");
      return setError(j.error ?? "Sign-in failed.");
    }
    window.location.assign(j.redirect);
  };

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-navy-50 text-navy-700">
          <ShieldCheck className="size-4" />
        </span>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Elets operations</h1>
          <p className="text-xs text-ink-3">Staff sign-in</p>
        </div>
      </div>

      {params.has("expired") && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800 ring-1 ring-inset ring-amber-200">Your session has ended. Please sign in again.</p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <Field label="Email" htmlFor="ops-email">
          <Input id="ops-email" type="email" autoComplete="username" icon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="ops-password" error={error ?? undefined}>
          <div className="relative">
            <Input
              id="ops-password"
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
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in <ArrowRight />
        </Button>
      </form>
    </div>
  );
}
