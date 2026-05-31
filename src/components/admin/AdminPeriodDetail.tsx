import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  fetchAdminPeriods,
  toggleAdminPeriodContent,
  markAdminPeriodComplete,
  restudyAdminPeriod,
  type SchoolPeriod,
} from '@/lib/periods';
import { fetchProducts, productLabel, type Product } from '@/lib/products';
import { AdminPageShell } from '@/components/admin/admin-ui';
import { SuperAdminEmptyState } from '@/components/super-admin/premium';
import { useToast } from '@/hooks/use-toast';
import { viswamOttAdminUrl, type LearningPathItem } from '@/lib/learning-path-content';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { PeriodDetailPanel } from '@/components/admin/period-detail-panel';

type Props = {
  periodId: string;
  readOnly?: boolean;
};

export default function AdminPeriodDetail({ periodId, readOnly = false }: Props) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, prods] = await Promise.all([fetchAdminPeriods(), fetchProducts()]);
      setPeriods(p);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
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

  const openOttVideo = (item: LearningPathItem) => {
    const id = String(item._id || '');
    if (!id) return;
    setLocation(viswamOttAdminUrl(id));
  };

  const handleToggleItem = async (p: SchoolPeriod, contentId: string, completed: boolean) => {
    if (readOnly) return;
    setBusyId(`${p.id}-${contentId}`);
    try {
      const data = await toggleAdminPeriodContent(p.id, contentId, completed);
      setPeriods(data);
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkDone = async (p: SchoolPeriod) => {
    if (readOnly) return;
    setBusyId(`done-${p.id}`);
    try {
      const data = await markAdminPeriodComplete(p.id);
      setPeriods(data);
      toast({ title: 'Period marked complete', description: p.label });
    } catch (e: unknown) {
      toast({
        title: 'Not ready yet',
        description: e instanceof Error ? e.message : 'Complete every item first',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRestudy = async (p: SchoolPeriod) => {
    if (readOnly) return;
    setBusyId(`restudy-${p.id}`);
    try {
      const data = await restudyAdminPeriod(p.id);
      setPeriods(data);
      toast({ title: 'Re-study started', description: `${p.label} progress was reset.` });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const backHref = '/admin/dashboard?tab=periods';

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
      </div>
    );
  }

  if (!period) {
    return (
      <AdminPageShell variant="premium" className="max-w-none w-full" title="Period not found">
        <SuperAdminEmptyState
          icon={Clock}
          title="Period not found"
          description="It may have been removed or you no longer have access."
        />
        <Button variant="outline" className="mt-4" onClick={() => setLocation(backHref)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to periods
        </Button>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      variant="premium"
      className="max-w-none w-full"
      title={period.label}
      description={
        period.productCode
          ? `${productLabel(period.productCode, products)} · Work through materials and mark each item done.`
          : 'Work through materials and mark each item done.'
      }
    >
      <Button
        type="button"
        variant="ghost"
        className="-mt-2 mb-2 text-slate-600 hover:text-slate-900 px-0"
        onClick={() => setLocation(backHref)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to timetable
      </Button>

      <PeriodDetailPanel
        period={period}
        doneSet={doneSet}
        readOnly={readOnly}
        busyId={busyId}
        onOpenOttVideo={openOttVideo}
        onToggleItem={handleToggleItem}
        onMarkPeriod={() => void handleMarkDone(period)}
        onRestudy={() => void handleRestudy(period)}
      />
    </AdminPageShell>
  );
}
