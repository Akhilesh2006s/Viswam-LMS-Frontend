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
export const adminDestructiveBtn =
  "bg-red-600 hover:bg-red-700 text-white rounded-lg";

type Stat = { label: string; value: string | number; icon?: LucideIcon };

type ShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminPageShell({
  title,
  description,
  actions,
  children,
  className,
}: ShellProps) {
  return (
    <div className={cn("space-y-6 max-w-6xl", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminStatGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-slate-200 shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            {s.icon ? (
              <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-slate-600" />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{s.label}</p>
              <p className="text-lg font-semibold text-slate-900">{s.value}</p>
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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminTabsList({ children }: { children: ReactNode }) {
  return (
    <TabsList className="h-auto w-full flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
      {children}
    </TabsList>
  );
}

export function AdminTabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-600",
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
