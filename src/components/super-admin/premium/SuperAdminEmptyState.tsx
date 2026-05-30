import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SuperAdminEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SuperAdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: SuperAdminEmptyStateProps) {
  return (
    <div className={cn("sa-premium-empty flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="sa-premium-icon-ring mb-4 h-14 w-14">
        <Icon className="h-6 w-6 text-[var(--brand-emerald)]" strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
