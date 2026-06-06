import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchProducts, productLabel, type Product } from "@/lib/products";
import { fetchTeacherPeriods, type TeacherProductScope } from "@/lib/teacher-api";
import type { SchoolPeriod } from "@/lib/periods";
import { cn } from "@/lib/utils";

type Props = {
  productScope: TeacherProductScope | null;
  selectedProduct: string;
};

export function TeacherPeriodsPanel({ productScope, selectedProduct }: Props) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [rows, catalog] = await Promise.all([
      fetchTeacherPeriods(selectedProduct === "all" ? undefined : selectedProduct),
      fetchProducts(),
    ]);
    setPeriods(rows);
    setProducts(catalog);
    setLoading(false);
  }, [selectedProduct]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, SchoolPeriod[]>();
    for (const period of periods) {
      const code = period.productCode || "general";
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(period);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return map;
  }, [periods]);

  const assignedProductCodes = useMemo(
    () => productScope?.products?.map((p) => p.productCode) || [],
    [productScope?.products],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
        Loading periods…
      </div>
    );
  }

  if (!assignedProductCodes.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        No products assigned yet. Periods appear after your school admin assigns book products to
        you.
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No periods for your products yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Your platform administrator configures learning periods per product. Once periods are set
          up and contain materials for your classes, they will show here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {[...grouped.entries()].map(([code, list]) => (
        <section key={code} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {productLabel(code, products)}
            </h3>
            <Badge variant="secondary">{list.length} periods</Badge>
          </div>
          <div className="admin-periods-timetable grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((period) => {
              const total = period.contents?.length || 0;
              return (
                <div
                  key={period.id}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md",
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setLocation(`/teacher/period/${period.id}`)}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                      {productLabel(period.productCode || code, products)}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{period.label}</p>
                    {period.description ? (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{period.description}</p>
                    ) : null}
                    <p className="mt-3 text-xs text-slate-600">
                      {total} material{total === 1 ? "" : "s"} in this period
                    </p>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                    onClick={() => setLocation(`/teacher/period/${period.id}`)}
                  >
                    Open period
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
