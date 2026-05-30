import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/lib/api-config';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  IndianRupee,
  Repeat,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import {
  SuperAdminInnerPage,
  SuperAdminToolbar,
  SuperAdminStatCard,
  SuperAdminEmptyState,
  SA_BTN_PRIMARY,
  SA_BTN_OUTLINE,
} from '@/components/super-admin/premium';

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  email: string;
  contact: string;
  createdAt: string | null;
  description?: string;
  orderId?: string | null;
};

type SubscriptionRow = {
  id: string;
  status: string;
  planId: string;
  customerId: string;
  currentStart: string | null;
  currentEnd: string | null;
  paidCount?: number;
  remainingCount?: number;
};

type BillingPayload = {
  razorpayConfigured: boolean;
  razorpayError: string | null;
  summary: {
    paymentsListed: number;
    subscriptionsListed: number;
    capturedAmountInr: number;
    activeSubscriptions: number;
  };
  payments: PaymentRow[];
  subscriptions: SubscriptionRow[];
};

const emptyBillingPayload = (): BillingPayload => ({
  razorpayConfigured: false,
  razorpayError: null,
  summary: {
    paymentsListed: 0,
    subscriptionsListed: 0,
    capturedAmountInr: 0,
    activeSubscriptions: 0,
  },
  payments: [],
  subscriptions: [],
});

/** Handles legacy array responses and partial objects from the API. */
function normalizeBillingPayload(raw: unknown): BillingPayload {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyBillingPayload();
  }
  const r = raw as Partial<BillingPayload> & { summary?: Partial<BillingPayload['summary']> };
  const s = r.summary;
  return {
    razorpayConfigured: Boolean(r.razorpayConfigured),
    razorpayError: r.razorpayError ?? null,
    summary: {
      paymentsListed: Number(s?.paymentsListed ?? 0),
      subscriptionsListed: Number(s?.subscriptionsListed ?? 0),
      capturedAmountInr: Number(s?.capturedAmountInr ?? 0),
      activeSubscriptions: Number(s?.activeSubscriptions ?? 0),
    },
    payments: Array.isArray(r.payments) ? r.payments : [],
    subscriptions: Array.isArray(r.subscriptions) ? r.subscriptions : [],
  };
}

function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'captured' || s === 'active' || s === 'authenticated')
    return <Badge className="bg-emerald-600 hover:bg-emerald-600"> {status}</Badge>;
  if (s === 'failed' || s === 'cancelled' || s === 'halted')
    return <Badge variant="destructive">{status}</Badge>;
  if (s === 'authorized' || s === 'created' || s === 'pending')
    return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function SubscriptionManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/super-admin/subscriptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || `Request failed (${res.status})`);
      }
      if (json.success) {
        setData(normalizeBillingPayload(json.data));
      } else {
        throw new Error(json.message || 'Invalid response');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load billing data';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SuperAdminInnerPage
      toolbar={
        <SuperAdminToolbar>
          <p className="text-sm text-slate-600">
            Live Razorpay data — configure <code className="rounded bg-slate-100 px-1 text-xs">RAZORPAY_*</code> in backend .env
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className={SA_BTN_OUTLINE} onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <Button size="sm" className={SA_BTN_PRIMARY} asChild>
              <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                Razorpay dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </SuperAdminToolbar>
      }
    >
      {loading && !data ? (
        <SuperAdminEmptyState icon={Wallet} title="Loading billing" description="Fetching payments and subscriptions…" />
      ) : data ? (
        <>
          {!data.razorpayConfigured && (
            <Alert>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertTitle>Razorpay not connected</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm mt-1">
                Add <code className="rounded bg-muted px-1">RAZORPAY_KEY_ID</code> and{' '}
                <code className="rounded bg-muted px-1">RAZORPAY_KEY_SECRET</code> to your server environment (from the
                Razorpay Dashboard → API Keys), then restart the API. Tables will fill with live data.
              </AlertDescription>
            </Alert>
          )}

          {data.razorpayError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <AlertTitle>Razorpay error</AlertTitle>
              <AlertDescription>{data.razorpayError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SuperAdminStatCard label="Captured revenue" value={formatInr(data.summary.capturedAmountInr)} icon={IndianRupee} accent="emerald" hint="Latest 50 payments" />
            <SuperAdminStatCard label="Payments listed" value={data.summary.paymentsListed} icon={CreditCard} accent="sky" />
            <SuperAdminStatCard label="Subscriptions" value={data.summary.subscriptionsListed} icon={Repeat} accent="gold" />
            <SuperAdminStatCard label="Active subs" value={data.summary.activeSubscriptions} icon={Wallet} accent="navy" />
          </div>

          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="payments">Payments &amp; billing</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>
            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent payments</CardTitle>
                  <CardDescription>Card, UPI, netbanking, wallet — as reported by Razorpay.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {data.payments.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 lg:py-6 text-center">
                      No payments returned. Complete a test payment in Razorpay test mode or widen the date range in the
                      Razorpay dashboard.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Customer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="whitespace-nowrap text-xs">{formatDate(p.createdAt)}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[140px] truncate" title={p.id}>
                              {p.id}
                            </TableCell>
                            <TableCell>{formatInr(p.amount)}</TableCell>
                            <TableCell>{statusBadge(p.status)}</TableCell>
                            <TableCell className="capitalize">{p.method}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div>{p.email}</div>
                              <div className="text-muted-foreground text-xs">{p.contact}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="subscriptions" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>Recurring plans managed in Razorpay.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {data.subscriptions.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4 lg:py-6 text-center">
                      No subscriptions yet. Create plans and subscriptions in the Razorpay dashboard, or via your app’s
                      checkout flow.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subscription ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Current period</TableHead>
                          <TableHead>Paid / left</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.subscriptions.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs max-w-[160px] truncate" title={s.id}>
                              {s.id}
                            </TableCell>
                            <TableCell>{statusBadge(s.status)}</TableCell>
                            <TableCell className="font-mono text-xs">{s.planId}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[120px] truncate">{s.customerId}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              <div>{formatDate(s.currentStart)}</div>
                              <div className="text-muted-foreground">→ {formatDate(s.currentEnd)}</div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {s.paidCount ?? '—'} / {s.remainingCount ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </SuperAdminInnerPage>
  );
}
