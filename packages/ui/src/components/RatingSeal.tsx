import { cn } from "../lib";

const sizeClass = {
  sm: "h-[42px] w-[42px] text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-[72px] w-[72px] text-2xl",
};

export function RatingSeal({ grade = "A", size = "md", className }: { grade?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return <div className={cn("inline-flex items-center justify-center rounded-full border bg-[var(--surface)] font-display font-semibold leading-none tracking-[-0.01em] text-[var(--brass)] shadow-[var(--shadow-soft)]", sizeClass[size], className)} style={{ borderColor: "var(--brass)" }}>{grade}</div>;
}
