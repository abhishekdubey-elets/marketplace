"use client";

import * as React from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Headline that reveals word by word. */
export function WordReveal({ text, className, delay = 0, wordClassName }: { text: string; className?: string; delay?: number; wordClassName?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={reduce ? false : { y: "105%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Card with a soft light that follows the cursor. */
export function Spotlight({ className, children, dark, as: Tag = "div" }: { className?: string; children: React.ReactNode; dark?: boolean; as?: "div" | "li" }) {
  const ref = React.useRef<HTMLDivElement & HTMLLIElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <Tag ref={ref} onMouseMove={onMove} className={cn("group/spot relative isolate overflow-hidden", className)}>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100",
          dark
            ? "bg-[radial-gradient(380px_circle_at_var(--x,50%)_var(--y,50%),rgb(229_32_46/0.16),transparent_60%)]"
            : "bg-[radial-gradient(380px_circle_at_var(--x,50%)_var(--y,50%),rgb(229_32_46/0.07),rgb(43_75_200/0.05)_35%,transparent_65%)]",
        )}
      />
      {children}
    </Tag>
  );
}

/** Number that counts up when it scrolls into view. */
export function CountUp({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  React.useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = `${to}${suffix}`;
      return;
    }
    const c = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => c.stop();
  }, [inView, to, suffix, reduce]);
  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}

/** Endless horizontal scroller; pauses on hover. */
export function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group/marquee mask-fade-x overflow-hidden", className)}>
      <div className="flex w-max animate-marquee gap-3 group-hover/marquee:[animation-play-state:paused]">
        <div className="flex shrink-0 gap-3">{children}</div>
        <div className="flex shrink-0 gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Slow-moving brand-coloured glow for hero and dark bands. */
export function Aurora({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className={cn("absolute -top-40 left-[8%] size-[520px] animate-aurora rounded-full blur-[110px]", dark ? "bg-flame-600/25" : "bg-flame-400/20")} />
      <div className={cn("absolute -top-24 right-[4%] size-[560px] animate-aurora rounded-full blur-[120px] [animation-delay:-6s]", dark ? "bg-brand-500/30" : "bg-brand-400/20")} />
      <div className={cn("absolute top-40 left-1/3 size-[420px] animate-aurora rounded-full blur-[120px] [animation-delay:-12s]", dark ? "bg-navy-500/30" : "bg-navy-300/25")} />
    </div>
  );
}
