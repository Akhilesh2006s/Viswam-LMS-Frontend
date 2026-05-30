import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY_NAME } from "@/lib/brand";

type SuperAdminPageHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SuperAdminPageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  className,
}: SuperAdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "sa-premium-header relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_8px_30px_rgba(11,31,58,0.06)] backdrop-blur-sm sm:px-6 sm:py-6",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        aria-hidden
        style={{
          background:
            "linear-gradient(135deg, rgba(0,168,107,0.06) 0%, transparent 42%, rgba(212,175,55,0.05) 100%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div className="sa-premium-icon-ring shrink-0">
              <Icon className="h-5 w-5 text-[var(--brand-emerald)]" strokeWidth={2} />
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {COMPANY_NAME}
              </p>
              {badge ? (
                <span className="sa-premium-badge">{badge}</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
                  <Sparkles className="h-3 w-3 text-[var(--brand-gold)]" />
                  Premium
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
