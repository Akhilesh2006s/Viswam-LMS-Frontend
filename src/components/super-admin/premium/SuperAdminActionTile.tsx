import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "navy" | "emerald" | "gold" | "sky";

const variants: Record<Variant, string> = {
  navy: "sa-premium-tile-navy",
  emerald: "sa-premium-tile-emerald",
  gold: "sa-premium-tile-gold",
  sky: "sa-premium-tile-sky",
};

type SuperAdminActionTileProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: Variant;
  className?: string;
};

export function SuperAdminActionTile({
  title,
  subtitle,
  icon: Icon,
  onClick,
  variant = "navy",
  className,
}: SuperAdminActionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "sa-premium-tile group w-full text-left",
        variants[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h3>
          <p className="mt-1 text-sm text-white/80">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
            <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
            Open
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
