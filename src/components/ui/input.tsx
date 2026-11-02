import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode; invalid?: boolean }>(
  ({ className, icon, invalid, ...props }, ref) => (
    <div className="relative w-full">
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 [&_svg]:size-4">{icon}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-4 hover:border-line-strong focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-subtle disabled:text-ink-3",
          icon && "pl-9",
          invalid && "border-red-400 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-4 hover:border-line-strong focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        invalid && "border-red-400 focus:border-red-400 focus:ring-red-100",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium text-ink-2", className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  optional,
  htmlFor,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-ink-4">Optional</span>}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : hint ? <p className="text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}
