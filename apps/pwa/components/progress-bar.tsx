import { cn } from "@/lib/classnames";

export function ProgressBar({
  value,
  color = "var(--primary)",
  height = 3,
  width = 80,
  className,
}: {
  value: number;
  color?: string;
  height?: number;
  width?: number | string;
  className?: string;
}): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, value));
  const widthStyle = typeof width === "number" ? `${width}px` : width;
  return (
    <div
      className={cn("rounded-full overflow-hidden bg-[#EDEFF2]", className)}
      style={{ width: widthStyle, height }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${clamped * 100}%`, background: color }}
      />
    </div>
  );
}
