import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_1px_2px_rgb(33_73_232/0.4)] hover:bg-brand-700",
        navy: "bg-navy-900 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] hover:bg-navy-800",
        secondary: "border border-line bg-white text-ink shadow-xs hover:bg-subtle hover:border-line-strong",
        ghost: "text-ink-2 hover:bg-navy-50 hover:text-ink",
        subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
        accent: "bg-accent-500 text-white hover:bg-accent-600",
        danger: "bg-red-600 text-white hover:bg-red-700",
        "danger-ghost": "text-red-600 hover:bg-red-50",
        link: "h-auto px-0 text-brand-600 hover:text-brand-700 hover:underline underline-offset-4",
        white: "bg-white text-navy-900 hover:bg-navy-50 shadow-sm",
        "outline-dark": "border border-white/15 bg-white/5 text-white hover:bg-white/10 backdrop-blur",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md [&_svg]:size-3.5",
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-4",
        lg: "h-11 px-5 text-[15px] rounded-xl",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-md [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
