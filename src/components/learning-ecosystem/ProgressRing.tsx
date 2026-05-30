import { cn } from "@/lib/utils";

type ProgressRingProps = {
  percent: number;
  size?: number;
  color?: string;
  className?: string;
  label?: string;
};

export function ProgressRing({ percent, size = 52, color = "#00A86B", className, label }: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn("eco-progress-ring shrink-0", className)}
      style={{ "--ring-size": `${size}px`, "--ring-pct": pct, "--ring-color": color } as React.CSSProperties}
    >
      <div className="eco-progress-ring-inner text-white">{label ?? `${Math.round(pct)}%`}</div>
    </div>
  );
}
