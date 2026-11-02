"use client";

import * as React from "react";
import * as CB from "@radix-ui/react-checkbox";
import * as SW from "@radix-ui/react-switch";
import * as RG from "@radix-ui/react-radio-group";
import * as PR from "@radix-ui/react-progress";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  className,
  id,
  indeterminate,
  ...rest
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
  id?: string;
  indeterminate?: boolean;
  "aria-label"?: string;
}) {
  return (
    <CB.Root
      id={id}
      aria-label={rest["aria-label"]}
      checked={indeterminate ? "indeterminate" : checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[5px] border border-line-strong bg-white shadow-xs transition data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600",
        className,
      )}
    >
      <CB.Indicator className="text-white">{indeterminate ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}</CB.Indicator>
    </CB.Root>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  ...rest
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <SW.Root
      id={id}
      aria-label={rest["aria-label"]}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-navy-200 transition data-[state=checked]:bg-brand-600 disabled:opacity-50"
    >
      <SW.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
    </SW.Root>
  );
}

export function RadioCards<T extends string>({
  value,
  onValueChange,
  options,
  columns = 2,
}: {
  value: T | undefined;
  onValueChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode }[];
  columns?: 1 | 2 | 3 | 4;
}) {
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <RG.Root value={value} onValueChange={(v) => onValueChange(v as T)} className={cn("grid gap-2.5", cols)}>
      {options.map((o) => (
        <RG.Item
          key={o.value}
          value={o.value}
          className="group relative flex items-start gap-3 rounded-xl border border-line bg-white p-3.5 text-left shadow-xs transition hover:border-line-strong data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-50/50 data-[state=checked]:ring-4 data-[state=checked]:ring-brand-100"
        >
          {o.icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600 transition group-data-[state=checked]:bg-brand-600 group-data-[state=checked]:text-white [&_svg]:size-[18px]">
              {o.icon}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">{o.label}</span>
            {o.description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{o.description}</span>}
          </span>
          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line-strong bg-white group-data-[state=checked]:border-brand-600 group-data-[state=checked]:bg-brand-600">
            <span className="size-1.5 rounded-full bg-white opacity-0 group-data-[state=checked]:opacity-100" />
          </span>
        </RG.Item>
      ))}
    </RG.Root>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "accent" | "amber" | "green" }) {
  const bar = { brand: "bg-brand-600", accent: "bg-accent-500", amber: "bg-amber-500", green: "bg-emerald-500" }[tone];
  return (
    <PR.Root value={value} className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-navy-100", className)}>
      <PR.Indicator className={cn("h-full rounded-full transition-all duration-500", bar)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </PR.Root>
  );
}

/** Toggleable chip used for multi-select filters and tag pickers. */
export function Chip({
  selected,
  onClick,
  children,
  className,
  icon,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition [&_svg]:size-3.5",
        selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:border-line-strong hover:bg-subtle",
        className,
      )}
    >
      {selected ? <Check /> : icon}
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-line bg-subtle p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium transition [&_svg]:size-3.5",
            value === o.value ? "bg-white text-ink shadow-xs" : "text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
