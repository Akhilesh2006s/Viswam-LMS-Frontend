import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAdminPeriods, restudyAdminPeriod, type SchoolPeriod } from '@/lib/periods';
import { fetchProducts, productLabel, type Product } from '@/lib/products';
import { AdminPageShell, AdminPanel, adminPremiumOutlineBtn } from '@/components/admin/admin-ui';
import { SuperAdminEmptyState } from '@/components/super-admin/premium';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, ChevronRight, Layers2, Loader2, RotateCcw } from 'lucide-react';

type Props = {
  readOnly?: boolean;
};

export default function PeriodManagement({ readOnly = false }: Props = {}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('all');
  const [restudyBusyId, setRestudyBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, prods] = await Promise.all([
        fetchAdminPeriods(undefined, productFilter === 'all' ? undefined : productFilter),
        fetchProducts(),
      ]);
      setPeriods(p);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, [productFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const byProduct = useMemo(() => {
    const map = new Map<string, SchoolPeriod[]>();
    for (const p of periods) {
      const code = p.productCode || '_other';
      if (!map.has(code)) map.set(code, []);
      map.get(code)!.push(p);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return map;
  }, [periods]);

  const openPeriod = (periodId: string) => {
    setLocation(`/admin/period/${periodId}`);
  };

  const handleRestudy = async (period: SchoolPeriod) => {
    if (readOnly) return;
    setRestudyBusyId(period.id);
    try {
      const data = await restudyAdminPeriod(period.id);
      setPeriods(data);
      toast({ title: 'Re-study started', description: `${period.label} progress was reset.` });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to reset period',
        variant: 'destructive',
      });
    } finally {
      setRestudyBusyId(null);
    }
  };

  return (
    <AdminPageShell
      variant="premium"
      className="max-w-none w-full"
      title="Learning periods"
      description={
        readOnly
          ? 'Period plans from your licensed products.'
          : 'Open a period from the timetable to view materials and mark progress.'
      }
    >
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <Label className="text-sm text-slate-600 shrink-0">Product</Label>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-56 rounded-xl border-slate-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All licensed products</SelectItem>
            {[...new Set(periods.map((p) => p.productCode).filter(Boolean))].map((code) => (
              <SelectItem key={code} value={code!}>
                {productLabel(code!, products)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
        </div>
      ) : periods.length === 0 ? (
        <AdminPanel variant="premium">
          <SuperAdminEmptyState
            icon={Clock}
            title="No periods configured"
            description="Your platform administrator sets up periods per product under Learning periods."
          />
        </AdminPanel>
      ) : (
        <div className="space-y-8">
          {[...byProduct.entries()].map(([code, list]) => (
            <section key={code} className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers2 className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-lg text-[var(--brand-navy)]">
                  {code === '_other' ? 'Other' : productLabel(code, products)}
                </h3>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Timetable — tap a period to open
                </p>
                <div className="admin-periods-timetable" role="list" aria-label="Periods">
                  {list.map((period) => {
                    const doneSet = new Set((period.completedContentIds || []).map(String));
                    const total = period.contents.length;
                    const doneCount = period.completedCount ?? doneSet.size;
                    const isComplete = !!period.isPeriodComplete;
                    const canRestudy = !readOnly && (isComplete || doneCount > 0);
                    return (
                      <div
                        key={period.id}
                        role="listitem"
                        className={cn(
                          'admin-period-slot admin-period-slot-card',
                          isComplete && 'admin-period-slot-complete',
                        )}
                      >
                        <button
                          type="button"
                          className="admin-period-slot-open admin-period-slot-link"
                          onClick={() => openPeriod(period.id)}
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {productLabel(period.productCode || code, products)}
                          </span>
                          <span className="text-base font-bold text-[var(--brand-navy)] leading-tight">
                            {period.label}
                          </span>
                          <span className="flex items-center justify-between gap-2 text-xs text-slate-600 mt-auto w-full">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Complete
                              </span>
                            ) : (
                              <span>
                                {doneCount}/{total} done
                              </span>
                            )}
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                          </span>
                        </button>
                        {canRestudy ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn('admin-period-slot-restudy w-full', adminPremiumOutlineBtn)}
                            disabled={restudyBusyId === period.id}
                            onClick={() => void handleRestudy(period)}
                          >
                            {restudyBusyId === period.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            )}
                            Re-study
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
