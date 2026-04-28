import { cn } from "@/lib/classnames";

interface ActivityRingProps {
  size?: number;
  stroke?: number;
  gap?: number;
  values: [number, number, number];
  colors?: [string, string, string];
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}

const DEFAULT_COLORS: [string, string, string] = [
  "var(--ring-input)",
  "var(--ring-build)",
  "var(--ring-share)",
];

export function ActivityRing({
  size = 280,
  stroke = 22,
  gap = 6,
  values,
  colors = DEFAULT_COLORS,
  centerLabel,
  centerSub,
  className,
}: ActivityRingProps): React.JSX.Element {
  const cx = size / 2;
  const cy = size / 2;
  const rings = values.map((v, i) => {
    const r = cx - stroke / 2 - i * (stroke + gap);
    const circumference = 2 * Math.PI * r;
    const dash = Math.max(circumference * v, v > 0 ? 2 : 0);
    return { r, circumference, dash, color: colors[i] };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("block", className)}
      role="img"
      aria-label={
        centerLabel
          ? `Activity: ${centerLabel}${centerSub ? ", " + centerSub : ""}`
          : "Activity ring"
      }
    >
      {rings.map((ring, i) => (
        <circle
          key={`bg-${i}`}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
      ))}
      {rings.map((ring, i) => (
        <circle
          key={`fg-${i}`}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke={ring.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${ring.dash} ${ring.circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {centerLabel && (
        <g>
          <text
            x={cx}
            y={cy + (centerSub ? 2 : 8)}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight={800}
            fontSize={size * 0.26}
            fill="var(--ink)"
            style={{ letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x={cx}
              y={cy + size * 0.18}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontWeight={600}
              fontSize={size * 0.05}
              fill="var(--muted)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {centerSub}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
