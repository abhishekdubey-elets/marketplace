"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, Eye, EyeOff, Globe, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BuyerType, CompanySize } from "@/lib/types";

type SignupRole = "buyer" | "provider";

const ROLES: { role: SignupRole; label: string; blurb: string; icon: React.ElementType }[] = [
  { role: "buyer", label: "I'm looking for technology", blurb: "Post requirements, discover verified providers and request introductions.", icon: Building2 },
  { role: "provider", label: "I offer technology solutions", blurb: "List your company, get verified and receive matched opportunities.", icon: Briefcase },
];

const BUYER_TYPES: BuyerType[] = [
  "Government Department",
  "Public Sector Undertaking",
  "Hospital / Health System",
  "University / Institute",
  "School Network",
  "Bank / NBFC",
  "Insurance",
  "Urban Local Body",
];

const SIZES: { value: CompanySize; label: string }[] = [
  { value: "1-50", label: "1–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "201-1000", label: "201–1,000 people" },
  { value: "1000+", label: "1,000+ people" },
];

export function SignupForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? undefined;
  const [role, setRole] = React.useState<SignupRole>(params.get("role") === "provider" ? "provider" : "buyer");
  const [f, setF] = React.useState({ name: "", title: "", email: "", password: "", orgName: "", buyerType: "", city: "", state: "", size: "", website: "" });
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof typeof f | "form", string>>>({});
  const [loading, setLoading] = React.useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const validate = () => {
    const e: typeof errors = {};
    if (f.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid work email.";
    if (f.password.length < 8) e.password = "Use at least 8 characters.";
    if (f.orgName.trim().length < 2) e.orgName = role === "buyer" ? "Enter your organisation's name." : "Enter your company's name.";
    if (role === "buyer" && !f.buyerType) e.buyerType = "Choose your organisation type.";
    if (!f.size) e.size = "Choose a size.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, role, buyerType: role === "buyer" ? f.buyerType : undefined, website: role === "provider" ? f.website : undefined, next }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      return setErrors({ form: j.error ?? "Couldn't create your account." });
    }
    // full navigation so the workspace loads fresh with the new account's data
    window.location.assign(j.redirect);
  };

  const loginHref = `/login${next || role ? `?${new URLSearchParams({ ...(role ? { role } : {}), ...(next ? { next } : {}) })}` : ""}`;

  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-3">Join the Elets Solution Marketplace. It takes about a minute.</p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
        {ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            role="radio"
            aria-checked={role === r.role}
            onClick={() => {
              setRole(r.role);
              setErrors({});
            }}
            className={cn(
              "rounded-xl border p-3 text-left transition",
              role === r.role ? "border-brand-500 bg-brand-50/60 ring-4 ring-brand-100" : "border-line bg-white hover:border-line-strong",
            )}
          >
            <r.icon className={cn("size-4", role === r.role ? "text-brand-600" : "text-ink-4")} />
            <p className="mt-2 text-[13px] font-medium leading-tight text-ink">{r.label}</p>
            <p className="mt-1 text-xs leading-snug text-ink-3">{r.blurb}</p>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <Input id="name" autoComplete="name" icon={<User />} value={f.name} onChange={set("name")} invalid={!!errors.name} />
          </Field>
          <Field label="Job title" htmlFor="title" optional>
            <Input id="title" autoComplete="organization-title" value={f.title} onChange={set("title")} />
          </Field>
        </div>
        <Field label="Work email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" icon={<Mail />} value={f.email} onChange={set("email")} invalid={!!errors.email} placeholder="you@organisation.com" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint={errors.password ? undefined : "At least 8 characters."}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="new-password" icon={<Lock />} value={f.password} onChange={set("password")} invalid={!!errors.password} className="pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-4 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <div className="h-px bg-line" />

        <Field label={role === "buyer" ? "Organisation name" : "Company name"} htmlFor="orgName" error={errors.orgName}>
          <Input id="orgName" autoComplete="organization" icon={role === "buyer" ? <Building2 /> : <Briefcase />} value={f.orgName} onChange={set("orgName")} invalid={!!errors.orgName} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {role === "buyer" ? (
            <Field label="Organisation type" error={errors.buyerType}>
              <Select value={f.buyerType || undefined} onValueChange={(v) => setF((x) => ({ ...x, buyerType: v }))} options={BUYER_TYPES.map((t) => ({ value: t, label: t }))} placeholder="Choose…" ariaLabel="Organisation type" />
            </Field>
          ) : (
            <Field label="Website" htmlFor="website" optional>
              <Input id="website" autoComplete="url" icon={<Globe />} value={f.website} onChange={set("website")} placeholder="example.com" />
            </Field>
          )}
          <Field label={role === "buyer" ? "Organisation size" : "Company size"} error={errors.size}>
            <Select value={f.size || undefined} onValueChange={(v) => setF((x) => ({ ...x, size: v }))} options={SIZES} placeholder="Choose…" ariaLabel="Size" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" htmlFor="city" optional>
            <Input id="city" autoComplete="address-level2" value={f.city} onChange={set("city")} />
          </Field>
          <Field label="State" htmlFor="state" optional>
            <Input id="state" autoComplete="address-level1" value={f.state} onChange={set("state")} />
          </Field>
        </div>

        {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 ring-1 ring-inset ring-red-200">{errors.form}</p>}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account <ArrowRight />
        </Button>
        <p className="text-center text-xs leading-relaxed text-ink-4">
          {role === "provider"
            ? "Your profile stays private until you complete it, and Elets verifies your company before you appear in matching."
            : "Elets reviews each requirement you post before providers see it. Your organisation's identity is shared only after an introduction."}
        </p>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-3">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
