import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViswamStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
};

export function ViswamStatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: ViswamStatCardProps) {
  return (
    <div className={cn("viswam-stat-card", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            {label}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p> : null}
          {trend ? (
            <p
              className={cn(
                "mt-2 text-xs font-semibold",
                trend.positive ? "text-[var(--success)]" : "text-[var(--warning)]"
              )}
            >
              {trend.value}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-navy)]/5 border border-[var(--border)]">
            <Icon className="h-5 w-5 text-[var(--brand-navy)]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ViswamStatCard;
