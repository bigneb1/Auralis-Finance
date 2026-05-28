import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../lib";

type Tone = "neutral" | "teal" | "emerald" | "amber" | "rose" | "ink";

const pillTone: Record<Tone, string> = {
  neutral: "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]",
  teal: "border-transparent bg-[var(--teal-wash)] text-[var(--teal)]",
  emerald: "border-transparent bg-[#E6F5EC] text-[var(--emerald)]",
  amber: "border-transparent bg-[#FBF1DC] text-[var(--amber)]",
  rose: "border-transparent bg-[#FBE7E8] text-[var(--rose)]",
  ink: "border-transparent bg-[var(--ink)] text-[var(--paper)]",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone };
export const Badge = ({ className, tone = "neutral", ...props }: BadgeProps) => (
  <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 font-sans text-xs font-medium leading-none whitespace-nowrap", pillTone[tone], className)} {...props} />
);

export type StatusPillProps = BadgeProps & { status?: "operational" | "degraded" | "down" | "eligible" | "restricted" | "denied" | "pending" };
export const StatusPill = ({ status = "pending", tone, className, ...props }: StatusPillProps) => {
  const mappedTone = tone ?? ({ operational: "emerald", eligible: "emerald", degraded: "amber", restricted: "amber", down: "rose", denied: "rose", pending: "neutral" } satisfies Record<NonNullable<StatusPillProps["status"]>, Tone>)[status];
  return <Badge tone={mappedTone} className={className} {...props} />;
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => <input ref={ref} className={cn("h-10 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 font-sans text-sm text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]", className)} {...props} />);
Input.displayName = "Input";
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("animate-pulse rounded-md bg-[var(--surface-muted)]", className)} {...props} />;
export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
export const ProgressBar = ({ value = 0 }: { value?: number }) => <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]"><div className="h-full bg-[var(--teal)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;

export type SliderProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { min?: number; max?: number; value: number | string };
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ className, min = 0, max = 100, value, style, ...props }, ref) => {
  const numericValue = Number(value);
  const minNumber = Number(min);
  const maxNumber = Number(max);
  const percent = maxNumber === minNumber ? 0 : ((numericValue - minNumber) / (maxNumber - minNumber)) * 100;
  return (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      value={value}
      className={cn("auralis-slider", className)}
      style={{ ...style, "--slider-percent": `${Math.max(0, Math.min(100, percent))}%` } as React.CSSProperties}
      {...props}
    />
  );
});
Slider.displayName = "Slider";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, ...props }, ref) => (
  <span className={cn("relative inline-grid h-5 w-5 shrink-0 place-items-center", className)}>
    <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
    <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-transparent transition-colors peer-checked:border-[var(--teal)] peer-checked:bg-[var(--teal)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--teal)]">
      <Check size={13} strokeWidth={2} />
    </span>
  </span>
));
Checkbox.displayName = "Checkbox";

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <span className={cn("relative inline-flex h-6 w-11 shrink-0 items-center", className)}>
    <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
    <span aria-hidden="true" className="absolute inset-0 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] transition-colors peer-checked:border-[var(--teal)] peer-checked:bg-[var(--teal)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--teal)]" />
    <span aria-hidden="true" className="relative ml-0.5 h-5 w-5 rounded-full bg-[var(--surface)] shadow-[0_1px_3px_rgba(11,18,32,0.18)] transition-transform peer-checked:translate-x-5" />
  </span>
));
Switch.displayName = "Switch";

export function SectionHeading({ eyebrow, title, children, className }: { eyebrow?: string; title: string; children?: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-3", className)}>{eyebrow && <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">{eyebrow}</p>}<h1 className="font-display text-4xl font-normal leading-tight tracking-[-0.015em] text-[var(--ink)] md:text-5xl">{title}</h1>{children && <div className="max-w-2xl text-[var(--text-secondary)]">{children}</div>}</div>;
}
