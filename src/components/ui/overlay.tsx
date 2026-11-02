"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import * as DM from "@radix-ui/react-dropdown-menu";
import * as T from "@radix-ui/react-tooltip";
import * as P from "@radix-ui/react-popover";
import * as TB from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ Modal

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  icon,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: React.ReactNode;
}) {
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <D.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-line bg-white shadow-overlay outline-none data-[state=open]:animate-slide-up",
            w,
          )}
        >
          <div className="flex items-start gap-3 border-b border-line px-6 py-5">
            {icon && <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 [&_svg]:size-5">{icon}</div>}
            <div className="min-w-0 flex-1">
              <D.Title className="text-base font-semibold tracking-tight text-ink">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</D.Description> : <D.Description className="sr-only">{String(title)}</D.Description>}
            </div>
            <D.Close className="-mr-2 -mt-1 grid size-8 place-items-center rounded-lg text-ink-4 transition hover:bg-navy-50 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </D.Close>
          </div>
          {children && <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle/60 px-6 py-3.5 rounded-b-2xl">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

// ------------------------------------------------------------------ Sheet (slide-over)

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "md",
  header,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  header?: React.ReactNode;
}) {
  const w = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[width];
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-navy-950/30 backdrop-blur-[1px] data-[state=open]:animate-fade-in" />
        <D.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-line bg-white shadow-overlay outline-none transition-transform duration-300 data-[state=open]:animate-[sheet-in_0.3s_cubic-bezier(0.16,1,0.3,1)]",
            w,
          )}
        >
          <div className="flex items-start gap-3 border-b border-line px-6 py-5">
            <div className="min-w-0 flex-1">
              {header}
              <D.Title className="text-base font-semibold tracking-tight text-ink">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-[13px] text-ink-3">{description}</D.Description> : <D.Description className="sr-only">{String(title)}</D.Description>}
            </div>
            <D.Close className="-mr-2 -mt-1 grid size-8 place-items-center rounded-lg text-ink-4 transition hover:bg-navy-50 hover:text-ink" aria-label="Close">
              <X className="size-4" />
            </D.Close>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle/60 px-6 py-3.5">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

// ------------------------------------------------------------------ Dropdown

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ className, align = "end", children, ...props }: DM.DropdownMenuContentProps) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn("z-[60] min-w-48 rounded-xl border border-line bg-white p-1 shadow-overlay animate-fade-in", className)}
        {...props}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function DropdownItem({ className, icon, danger, children, ...props }: DM.DropdownMenuItemProps & { icon?: React.ReactNode; danger?: boolean }) {
  return (
    <DM.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-2 outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-navy-50 data-[highlighted]:text-ink [&_svg]:size-4 [&_svg]:text-ink-4",
        danger && "text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700 [&_svg]:text-red-500",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </DM.Item>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <DM.Label className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-4">{children}</DM.Label>;
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}

// ------------------------------------------------------------------ Tooltip

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <T.Provider delayDuration={250}>{children}</T.Provider>;
}

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  if (!content) return <>{children}</>;
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-[80] max-w-xs rounded-lg bg-navy-950 px-2.5 py-1.5 text-xs leading-relaxed text-white shadow-raised animate-fade-in">
          {content}
          <T.Arrow className="fill-navy-950" />
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

// ------------------------------------------------------------------ Popover

export const Popover = P.Root;
export const PopoverTrigger = P.Trigger;
export function PopoverContent({ className, align = "end", ...props }: P.PopoverContentProps) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={8} className={cn("z-[60] rounded-2xl border border-line bg-white shadow-overlay outline-none animate-fade-in", className)} {...props} />
    </P.Portal>
  );
}

// ------------------------------------------------------------------ Tabs

export const Tabs = TB.Root;
export const TabsContent = (props: TB.TabsContentProps) => <TB.Content {...props} className={cn("outline-none animate-fade-in", props.className)} />;

export function TabsList({ className, children, variant = "underline" }: { className?: string; children: React.ReactNode; variant?: "underline" | "pill" }) {
  return (
    <TB.List
      className={cn(
        "scrollbar-thin flex max-w-full overflow-x-auto",
        variant === "underline" ? "gap-5 border-b border-line" : "inline-flex gap-1 rounded-xl border border-line bg-subtle p-1",
        className,
      )}
    >
      {children}
    </TB.List>
  );
}

export function TabsTrigger({ value, children, count, variant = "underline" }: { value: string; children: React.ReactNode; count?: number; variant?: "underline" | "pill" }) {
  return (
    <TB.Trigger
      value={value}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-medium text-ink-3 outline-none transition hover:text-ink [&_svg]:size-4",
        variant === "underline"
          ? "relative -mb-px border-b-2 border-transparent pb-2.5 pt-1 data-[state=active]:border-brand-600 data-[state=active]:text-ink"
          : "rounded-lg px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-xs",
      )}
    >
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-navy-100 px-1.5 py-px text-[11px] font-semibold text-ink-3 group-data-[state=active]:bg-brand-100 group-data-[state=active]:text-brand-700">{count}</span>
      )}
    </TB.Trigger>
  );
}
