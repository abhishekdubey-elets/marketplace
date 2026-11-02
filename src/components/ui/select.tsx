"use client";

import * as React from "react";
import * as S from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  size = "md",
  ariaLabel,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange}>
      <S.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-sm text-ink shadow-xs outline-none transition hover:border-line-strong focus:border-brand-400 focus:ring-4 focus:ring-brand-100 data-[placeholder]:text-ink-4",
          size === "sm" ? "h-8 text-[13px]" : "h-9",
          className,
        )}
      >
        <span className="truncate">
          <S.Value placeholder={placeholder} />
        </span>
        <S.Icon>
          <ChevronDown className="size-4 text-ink-4" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className="z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-overlay animate-fade-in"
        >
          <S.Viewport className="scrollbar-thin">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-ink-2 outline-none data-[highlighted]:bg-navy-50 data-[highlighted]:text-ink data-[state=checked]:font-medium data-[state=checked]:text-ink"
              >
                <S.ItemIndicator className="absolute left-2.5">
                  <Check className="size-4 text-brand-600" />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
