import { cn } from "@/lib/classnames";

type PillVariant = "default" | "blue" | "soft" | "outline";

export function Pill({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}): React.JSX.Element {
  const variants: Record<PillVariant, string> = {
    default: "bg-[#EFF1F4] text-ink-2 border border-hairline",
    blue: "bg-primary text-white border border-primary",
    soft: "bg-primary-soft text-primary border border-[#D6E6FB]",
    outline: "bg-surface text-ink-2 border border-card-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[3px] font-display text-[10px] font-bold uppercase tracking-[0.1em] leading-tight",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
