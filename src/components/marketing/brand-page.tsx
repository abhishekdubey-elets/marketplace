import { Download } from "lucide-react";
import { BRAND, LogoMark, LogoMarkHandshake, Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const FILES = [
  { title: "Primary logo", desc: "Geometric E. Use this by default.", light: "/brand/elets-logo.svg", dark: "/brand/elets-logo-white.svg", mark: "/brand/elets-mark.svg", variant: "primary" as const },
  { title: "Handshake logo", desc: "For partnership and events material.", light: "/brand/elets-logo-handshake.svg", dark: "/brand/elets-logo-handshake-white.svg", mark: "/brand/elets-mark-handshake.svg", variant: "handshake" as const },
];

function Lockup({ variant, dark }: { variant: "primary" | "handshake"; dark?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      {variant === "primary" ? <LogoMark variant="plain" inverted={dark} size={64} /> : <LogoMarkHandshake inverted={dark} size={64} />}
      <span className={cn("h-14 w-px", dark ? "bg-white/15" : "bg-line-strong")} />
      <div>
        <Wordmark dark={dark} size="lg" />
        <p className={cn("mt-1.5 text-[11px] font-medium tracking-wide", dark ? "text-navy-300" : "text-ink-3")}>
          Connect <span className="text-flame-600">•</span> Collaborate <span className="text-flame-600">•</span> Grow
        </p>
      </div>
    </div>
  );
}

function Dl({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} download className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-line-strong hover:text-ink">
      <Download className="size-3.5" /> {children}
    </a>
  );
}

export function BrandPage() {
  return (
    <div className={cn(CONTAINER, "py-16 sm:py-20")}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-flame-600">Brand</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Logo and colours</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-3">Two versions of the Elets Solution Marketplace logo, as SVG files. Keep clear space around the logo of at least the height of the &ldquo;e&rdquo;.</p>

      <div className="mt-12 space-y-8">
        {FILES.map((f) => (
          <section key={f.title} className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{f.title}</h2>
                <p className="text-[13px] text-ink-3">{f.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dl href={f.light}>Logo</Dl>
                <Dl href={f.dark}>Logo, white</Dl>
                <Dl href={f.mark}>Mark only</Dl>
              </div>
            </div>
            <div className="grid md:grid-cols-2">
              <div className="grid place-items-center bg-white px-6 py-14">
                <Lockup variant={f.variant} />
              </div>
              <div className="grid place-items-center bg-navy-950 px-6 py-14">
                <Lockup variant={f.variant} dark />
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-base font-semibold text-ink">Colours</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { name: "Elets red", hex: BRAND.red, cls: "bg-flame-600" },
            { name: "Elets navy", hex: BRAND.navy, cls: "bg-navy-900" },
            { name: "Royal blue", hex: "#2B4BC8", cls: "bg-brand-600" },
          ].map((c) => (
            <div key={c.name} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className={cn("h-24", c.cls)} />
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="font-mono text-xs uppercase text-ink-3">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-8 text-xs text-ink-4">The wordmark is set in Geist. The handshake glyph is from Lucide (ISC licence). Outline the text before sending files to print.</p>
    </div>
  );
}
