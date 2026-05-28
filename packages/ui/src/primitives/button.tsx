import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-5 font-sans text-sm font-medium leading-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--ink)] text-[var(--paper)] hover:bg-[#16203A]",
        secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--border-strong)] hover:bg-[var(--surface)]",
        ghost: "bg-transparent px-2 text-[var(--teal)] hover:text-[#0A8474]",
      },
      size: { sm: "h-8 px-3 text-[13px]", md: "h-10", lg: "h-11 px-6 text-[15px]" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
