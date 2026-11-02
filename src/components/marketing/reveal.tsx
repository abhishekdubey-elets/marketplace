"use client";

import * as React from "react";
import { motion } from "framer-motion";

/** Subtle fade/slide-up when a block scrolls into view (runs once). */
export function Reveal({ children, delay = 0, className, y = 14 }: { children: React.ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark,
  action,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  action?: React.ReactNode;
}) {
  const center = align === "center";
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "flex flex-col gap-4 md:flex-row md:items-end md:justify-between"}>
      <div className={center ? "" : "max-w-2xl"}>
        {eyebrow && (
          <p className={`mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${dark ? "text-accent-300" : "text-brand-600"}`}>
            <span className={`h-px w-5 ${dark ? "bg-accent-300/60" : "bg-brand-500/60"}`} />
            {eyebrow}
          </p>
        )}
        <h2 className={`text-[28px] font-semibold leading-[1.15] tracking-tight text-balance sm:text-[34px] ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
        {description && <p className={`mt-3 text-[15px] leading-relaxed ${dark ? "text-navy-300" : "text-ink-3"}`}>{description}</p>}
      </div>
      {action && !center && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
