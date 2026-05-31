import { useEffect, useState } from 'react';
import { Users, Clock, Film, TrendingUp, ChevronDown } from 'lucide-react';
import { fetchAdminOttAnalytics, type AdminOttAnalytics } from '@/lib/ott/api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Props = {
  variant?: 'light' | 'dark';
  /** Single compact row for admin OTT theater layout */
  compact?: boolean;
};

export function AdminOttAnalyticsPanel({ variant = 'light', compact = false }: Props) {
  const [data, setData] = useState<AdminOttAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const isDark = variant === 'dark';

  useEffect(() => {
    fetchAdminOttAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className={cn(isDark && 'ott-admin-stats-bar ott-admin-stats-bar--inline')}>
        <div className={cn(compact ? 'flex gap-3' : 'grid grid-cols-2 gap-3 md:grid-cols-4')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={cn(compact ? 'h-12 flex-1' : 'h-20', isDark && 'bg-slate-800')} />
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  const active = data.activeStudents ?? 0;
  const total = data.totalStudents ?? 0;
  const watchMin = data.totalWatchMinutes ?? 0;
  const completed = data.videosCompleted ?? 0;
  const engagement = data.engagementRate ?? 0;

  const metrics = [
    { icon: Users, label: 'Active', value: `${active}/${total}` },
    { icon: Clock, label: 'Watch time', value: `${watchMin}m` },
    { icon: Film, label: 'Completed', value: String(completed) },
    { icon: TrendingUp, label: 'Engagement', value: `${engagement}%` },
  ];

  if (compact && !isDark) {
    return (
      <section className="ott-admin-stats-bar ott-admin-stats-bar--inline">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1.5">
          School analytics
        </p>
        <div className="ott-admin-stats-row ott-admin-stats-row--grid">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="ott-admin-stat-pill">
              <Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold tabular-nums">{value}</span>
              <span className="text-[10px]">{label}</span>
            </div>
          ))}
        </div>
        {total === 0 ? (
          <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">No watch activity yet.</p>
        ) : null}
      </section>
    );
  }

  if (isDark && compact) {
    return (
      <section className="ott-admin-stats-bar ott-admin-stats-bar--inline">
        <button
          type="button"
          className="ott-admin-stats-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">
            School analytics
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-slate-400 transition-transform', expanded && 'rotate-180')}
          />
        </button>
        <div className="ott-admin-stats-row">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="ott-admin-stat-pill">
              <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-sm font-bold text-white tabular-nums">{value}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
        {expanded && data.topLearners.length > 0 ? (
          <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-300">
            {data.topLearners.slice(0, 5).map((s, i) => (
              <li key={s.studentId} className="flex justify-between gap-2">
                <span>
                  {i + 1}. {s.name}
                </span>
                <span className="text-slate-500 shrink-0">
                  {s.watchMinutes}m · {s.videosCompleted} done
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {!expanded && total === 0 ? (
          <p className="text-[11px] text-slate-500 mt-2">No student watch activity yet.</p>
        ) : null}
      </section>
    );
  }

  if (isDark) {
    return (
      <section className="ott-admin-analytics mx-4 mb-6">
        <div className="ott-admin-stats-row mb-2">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="ott-admin-stat-pill">
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-white">{value}</span>
              <span className="text-[10px] text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-5">
      <h3 className="text-lg font-bold text-slate-900">School analytics</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mt-4">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-white p-3">
            <Icon className="h-4 w-4 text-emerald-600 mb-1" />
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
