"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Lock, Mail, Phone, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useUser } from "@/components/providers";
import { useBuyerPlan } from "@/lib/use-plan";
import { GATE_COPY, type GateReason } from "@/lib/plans";
import { pricingOf, priceLabel } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";

const FREE = [
  { text: "Post and track technology requirements", on: true },
  { text: "Matching runs automatically, with results straight away", on: true },
  { text: "Match explanations across eight dimensions", on: true },
  { text: "Browse, save and compare providers", on: true },
  { text: "Introductions and conversations with suppliers", on: false },
  { text: "Meetings with suppliers", on: false },
];

const PREMIUM = [
  "Everything in Free",
  "The Elets team runs and reviews matching for you",
  "Introductions to the suppliers you choose",
  "Meetings with suppliers, arranged by Elets",
  "A dedicated relationship manager",
  "Managed procurement through Elets Pro, from discovery to post-award",
];

export function UpgradePage() {
  const params = useSearchParams();
  const user = useUser();
  const plan = useBuyerPlan();
  const content = useStore((s) => s.content);
  const requirements = useStore((s) => s.requirements);
  const proRequests = useStore((s) => s.proRequests);
  const requestPro = useStore((s) => s.requestPro);
  const [note, setNote] = React.useState("");

  const raw = params.get("reason");
  const reason: GateReason | null = raw === "contact" || raw === "meeting" ? raw : null;
  const reqId = params.get("requirement");
  const req = requirements.find((r) => r.id === reqId && r.buyerId === user.orgId);
  const back = req ? `/buyer/requirements/${req.id}?tab=matches` : "/buyer/requirements";
  const proPlan = pricingOf(content).plans.find((p) => p.id === "pro");
  const pending = proRequests.find((r) => r.buyerId === user.orgId && r.status !== "converted");

  if (plan === "premium") {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent-50 text-accent-600">
          <CheckCircle2 className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">You&apos;re on Premium</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">The Elets team runs matching for your requirements, and you can request introductions and meetings with suppliers.</p>
        <Button className="mt-6" asChild>
          <Link href={back}>
            Back to {req ? req.code : "your requirements"} <ArrowRight />
          </Link>
        </Button>
      </Card>
    );
  }

  const submit = () => {
    requestPro({
      buyerId: user.orgId!,
      requirementId: req?.id ?? null,
      services: ["Premium plan"],
      note: note.trim() || (reason === "meeting" ? "Wants to schedule meetings with suppliers." : reason === "contact" ? "Wants to talk to suppliers." : "Wants to upgrade to Premium."),
    });
    setNote("");
    toast.success("Upgrade requested", { description: "The Elets team will contact you to set up Premium." });
  };

  return (
    <div className="space-y-6">
      <Link href={back} className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> {req ? `Back to ${req.code}` : "Back to requirements"}
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-navy-950 p-6 text-white shadow-raised sm:p-8">
        <div className="grid-bg-dark absolute inset-0 opacity-70" />
        <div className="absolute -right-20 -top-24 size-80 rounded-full bg-brand-600/30 blur-[100px]" />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-accent-200">
            <Lock className="size-3.5 text-accent-300" /> {reason ? "Premium feature" : "Upgrade"}
          </p>
          <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-[28px]">{reason ? GATE_COPY[reason].title : "Upgrade to Premium"}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-navy-200">
            {reason ? GATE_COPY[reason].body : "Let the Elets team run matching, make introductions and arrange meetings with suppliers for you."}
          </p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="flex flex-col p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Free</h2>
            <span className="rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-ink-3 ring-1 ring-inset ring-line">Your plan</span>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-3">Self-serve matching.</p>
          <ul className="mt-5 space-y-2.5">
            {FREE.map((f) => (
              <li key={f.text} className={cn("flex items-start gap-2.5 text-[13px] leading-snug", f.on ? "text-ink-2" : "text-ink-4")}>
                {f.on ? <Check className="mt-0.5 size-4 shrink-0 text-accent-600" /> : <Lock className="mt-0.5 size-4 shrink-0" />} {f.text}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col border-brand-300 p-6 ring-4 ring-brand-50">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-ink">
              <Sparkles className="size-4 text-brand-600" /> Premium
            </h2>
            {proPlan && (
              <span className="text-sm font-semibold text-ink">
                {priceLabel(proPlan)}
                {proPlan.price.trim() && proPlan.period.trim() && <span className="ml-1 font-normal text-ink-3">{proPlan.period}</span>}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] text-ink-3">Managed by the Elets team, with Elets Pro.</p>
          <ul className="mt-5 flex-1 space-y-2.5">
            {PREMIUM.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] leading-snug text-ink-2">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-600" /> {f}
              </li>
            ))}
          </ul>

          {pending ? (
            <p className="mt-6 flex items-start gap-2.5 rounded-xl bg-accent-50 px-4 py-3 text-[13px] leading-relaxed text-accent-700">
              <Clock className="mt-0.5 size-4 shrink-0" /> You&apos;ve asked to upgrade. The Elets team will contact you to set up Premium.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              <Field label="Anything we should know?" optional>
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. We'd like to meet two of our matched suppliers this month." />
              </Field>
              <Button className="w-full" onClick={submit}>
                <Send /> Request Premium
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 text-sm shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink-2">Prefer to talk first? Contact the Elets team.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" size="sm" asChild>
            <a href="mailto:info@elets.in?subject=Premium%20plan">
              <Mail /> info@elets.in
            </a>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href="tel:+919910998068">
              <Phone /> +91 99109 98068
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
