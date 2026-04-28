import { cn } from "@/lib/classnames";

export function Checkbox({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors",
        checked
          ? "border-primary bg-primary"
          : "border-[#C7CCD1] bg-surface",
        className
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
