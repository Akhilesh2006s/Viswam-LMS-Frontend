import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeriodDetailPanel } from "@/components/admin/period-detail-panel";
import { fetchProducts, productLabel } from "@/lib/products";
import { fetchTeacherPeriods } from "@/lib/teacher-api";
import type { SchoolPeriod } from "@/lib/periods";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TeacherPeriodDetailPage() {
  const [, params] = useRoute("/teacher/period/:id");
  const periodId = params?.id || "";
  usePageTitle("Period");

  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [products, setProducts] = useState<Awaited<ReturnType<typeof fetchProducts>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [rows, catalog] = await Promise.all([fetchTeacherPeriods(), fetchProducts()]);
    setPeriods(rows);
    setProducts(catalog);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const period = useMemo(
    () => periods.find((p) => p.id === periodId) || null,
    [periods, periodId],
  );

  const doneSet = useMemo(
    () => new Set((period?.completedContentIds || []).map(String)),
    [period],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto rounded-xl border bg-white p-8 text-center">
          <p className="text-slate-700 font-medium">Period not found or not in your assignment.</p>
          <Link href="/teacher/dashboard?tab=periods">
            <Button className="mt-4" variant="outline">
              Back to portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/teacher/dashboard?tab=periods">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Portal
            </Button>
          </Link>
          <div>
            <p className="text-xs text-slate-500">
              {period.productCode ? productLabel(period.productCode, products) : "Period"}
            </p>
            <h1 className="font-semibold text-slate-900">{period.label}</h1>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <PeriodDetailPanel
          period={period}
          doneSet={doneSet}
          readOnly
          busyId={null}
          onToggleItem={() => {}}
          onMarkPeriod={() => {}}
          onRestudy={() => {}}
        />
      </main>
    </div>
  );
}
