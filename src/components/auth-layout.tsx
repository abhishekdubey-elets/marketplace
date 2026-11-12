import { Logo } from "@/components/brand";
import { BadgeCheck, Handshake, ShieldCheck, Sparkles } from "lucide-react";

/** Two-column layout shared by the sign-in and sign-up pages. */
export function AuthLayout({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)] xl:grid-cols-[1fr_640px]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Logo />
        <div className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${wide ? "max-w-[520px]" : "max-w-[420px]"}`}>{children}</div>
        <p className="text-center text-xs text-ink-4">© Elets Solution Marketplace</p>
      </div>

      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="grid-bg-dark absolute inset-0" />
        <div className="absolute -right-24 -top-24 size-[480px] rounded-full bg-brand-600/30 blur-[120px]" />
        <div className="absolute -bottom-32 -left-16 size-[420px] rounded-full bg-flame-600/20 blur-[120px]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-navy-200">
            <Sparkles className="size-3.5 text-flame-300" /> From relationships to opportunities
          </p>
          <div>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-white text-balance">
              One platform for buyers, providers and the Elets team.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { icon: BadgeCheck, t: "Verified technology providers", d: "Profiles reviewed by the Elets team before they carry a verified badge." },
                { icon: Handshake, t: "Explainable matching", d: "Eight transparent dimensions. Paid listings never influence rankings." },
                { icon: ShieldCheck, t: "Managed with Elets Pro", d: "A relationship manager from requirement discovery to post-award review." },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-flame-300">
                    <x.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">{x.t}</span>
                    <span className="block text-[13px] leading-relaxed text-navy-300">{x.d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-navy-400">© Elets Solution Marketplace</p>
        </div>
      </div>
    </div>
  );
}
