import { cn } from "@/lib/classnames";

export function Hairline({
  vertical = false,
  className,
}: {
  vertical?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "bg-hairline",
        vertical ? "w-px self-stretch" : "h-px w-full",
        className
      )}
    />
  );
}
