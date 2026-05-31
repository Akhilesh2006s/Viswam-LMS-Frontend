import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";
import { productLabel, type Product } from "@/lib/products";

export const adminPrimaryBtn =
  "bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm";
export const adminOutlineBtn = "rounded-lg border-slate-200 text-slate-700";
export const adminPremiumPrimaryBtn =
  "rounded-xl bg-gradient-to-r from-[var(--brand-navy)] to-[#102b4e] text-white shadow-[0_8px_24px_rgba(11,31,58,0.25)] hover:opacity-95";
export const adminPremiumAccentBtn =
  "rounded-xl bg-gradient-to-r from-emerald-500 to-[var(--brand-emerald)] text-white shadow-[0_8px_24px_rgba(0,168,107,0.35)] hover:opacity-95";
export const adminPremiumOutlineBtn =
  "rounded-xl border-emerald-200/80 bg-white text-slate-700 hover:bg-emerald-50/80";
export const adminDestructiveBtn =
  "bg-red-600 hover:bg-red-700 text-white rounded-lg";

type Stat = { label: string; value: string | number; icon?: LucideIcon };

type AdminVariant = "default" | "premium";

type ShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: AdminVariant;
};

export function AdminPageShell({
  title,
  description,
  actions,
  children,
  className,
  variant = "default",
}: ShellProps) {
  const premium = variant === "premium";
  return (
    <div className={cn("space-y-6 max-w-6xl", premium && "sws-admin-page", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={cn(
              "text-xl font-semibold tracking-tight sm:text-2xl",
              premium ? "text-[var(--brand-navy)]" : "text-slate-900",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={cn("text-sm mt-1 max-w-2xl", premium ? "text-slate-600" : "text-slate-500")}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminStatGrid({
  stats,
  variant = "default",
}: {
  stats: Stat[];
  variant?: AdminVariant;
}) {
  const premium = variant === "premium";
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", premium && "sws-stat-grid")}>
      {stats.map((s) => (
        <Card
          key={s.label}
          className={cn(
            premium
              ? "sws-stat-card border-emerald-100/60 bg-white/90 shadow-[0_8px_24px_rgba(11,31,58,0.06)] backdrop-blur-sm"
              : "border-slate-200 shadow-sm",
          )}
        >
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            {s.icon ? (
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  premium ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-100",
                )}
              >
                <s.icon className={cn("h-4 w-4", !premium && "text-slate-600")} />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 truncate">
                {s.label}
              </p>
              <p
                className={cn(
                  "text-xl font-bold tracking-tight",
                  premium ? "text-[var(--brand-navy)]" : "text-slate-900",
                )}
              >
                {s.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: AdminVariant;
}) {
  return (
    <div
      className={cn(
        variant === "premium"
          ? "sws-panel rounded-2xl border border-white/70 bg-white/85 shadow-[0_12px_40px_rgba(11,31,58,0.07)] backdrop-blur-md p-4 sm:p-5"
          : "rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminTabsList({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: AdminVariant;
}) {
  return (
    <TabsList
      className={cn(
        "h-auto w-full flex flex-wrap gap-1 p-1 rounded-xl",
        variant === "premium"
          ? "sws-tabs-list bg-white/60 border border-emerald-100/80 shadow-inner"
          : "bg-slate-100 rounded-lg",
      )}
    >
      {children}
    </TabsList>
  );
}

export function AdminTabsTrigger({
  value,
  children,
  className,
  variant = "default",
}: {
  value: string;
  children: ReactNode;
  className?: string;
  variant?: AdminVariant;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-semibold transition-all",
        variant === "premium"
          ? "text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-[var(--brand-emerald)] data-[state=active]:text-white data-[state=active]:shadow-[0_6px_20px_rgba(0,168,107,0.35)]"
          : "rounded-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600",
        className,
      )}
    >
      {children}
    </TabsTrigger>
  );
}

export function AdminProductBadge({
  productCode,
  products,
  className,
}: {
  productCode?: string;
  products?: Product[];
  className?: string;
}) {
  if (!productCode) {
    return (
      <Badge variant="outline" className={cn("text-slate-500 border-slate-200", className)}>
        Unassigned
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("border-slate-200 bg-slate-50 text-slate-800 font-normal", className)}
    >
      {productLabel(productCode, products)}
    </Badge>
  );
}

export function resolveProductCodeForClassNumber(
  classNumber: string,
  assignments: { productCode: string; classesFrom: string; classesTo: string }[],
): string {
  const n = parseInt(String(classNumber).replace(/\D/g, ""), 10);
  if (!Number.isFinite(n)) return "";
  for (const a of assignments) {
    const from = parseInt(a.classesFrom, 10);
    const to = parseInt(a.classesTo, 10);
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    if (n >= Math.min(from, to) && n <= Math.max(from, to)) return a.productCode;
  }
  return "";
}
