import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "emerald" | "gold" | "navy" | "sky";

const accentMap: Record<Accent, { ring: string; icon: string; value: string }> = {
  emerald: {
    ring: "from-emerald-500/20 to-emerald-600/5",
    icon: "bg-emerald-500/10 text-emerald-700",
    value: "text-emerald-700",
  },
  gold: {
    ring: "from-amber-500/20 to-amber-600/5",
    icon: "bg-amber-500/10 text-amber-800",
    value: "text-amber-800",
  },
  navy: {
    ring: "from-slate-700/15 to-slate-900/5",
    icon: "bg-slate-900/8 text-[var(--brand-navy)]",
    value: "text-[var(--brand-navy)]",
  },
  sky: {
    ring: "from-sky-500/20 to-sky-600/5",
    icon: "bg-sky-500/10 text-sky-800",
    value: "text-sky-800",
  },
};

type SuperAdminStatCardProps = {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent?: Accent;
  hint?: string;
  footer?: React.ReactNode;
  className?: string;
};

export function SuperAdminStatCard({
  label,
  value,
  icon: Icon,
  accent = "navy",
  hint,
  footer,
  className,
}: SuperAdminStatCardProps) {
  const a = accentMap[accent];
  return (
    <div
      className={cn(
        "sa-premium-stat group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_20px_rgba(11,31,58,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(11,31,58,0.08)]",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-80 blur-2xl",
          a.ring,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight sm:text-3xl", a.value)}>{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", a.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
      {footer ? <div className="relative mt-4 border-t border-slate-100 pt-3">{footer}</div> : null}
    </div>
  );
}
