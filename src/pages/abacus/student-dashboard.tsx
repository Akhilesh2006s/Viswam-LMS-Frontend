import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import {
  BarChart3,
  Trophy,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AbacusStatCard } from '@/components/abacus/AbacusActionCard';
import { AbacusStudentChrome } from '@/components/abacus/AbacusStudentChrome';
import {
  AbacusDashboardSkeleton,
  AbacusWelcomeBanner,
} from '@/components/abacus/AbacusPortalShell';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import { abacusStudentDashboardTab, abacusStudentNavActiveId } from '@/lib/abacus-student-nav';
import {
  fetchAbacusPracticeResults,
  type AbacusPracticeResult,
} from '@/lib/abacus-api';

function formatMode(mode: string) {
  if (mode === 'assessment') return 'Assessment';
  if (mode === 'physical-practice') return 'Physical Practice';
  return 'Digital Practice';
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

export default function AbacusStudentDashboard() {
  usePageTitle('Abacus Student');
  const { loading, profile, error } = useAbacusPortal({ role: 'student' });
  const [pathname] = useLocation();
  const search = useSearch();
  const activeTab = abacusStudentDashboardTab(pathname, search);
  const activeNavId = abacusStudentNavActiveId(pathname, search);
  const [results, setResults] = useState<AbacusPracticeResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    setResultsLoading(true);
    fetchAbacusPracticeResults()
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setResultsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const stats = useMemo(() => {
    const totalAttempts = results.length;
    const assessments = results.filter((r) => r.mode === 'assessment').length;
    const latest = results[0];
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            results.reduce((sum, r) => sum + (r.total ? (r.score / r.total) * 100 : 0), 0) /
              totalAttempts,
          )
        : 0;
    return { totalAttempts, assessments, latest, avgScore };
  }, [results]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <AbacusDashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <AbacusStudentChrome activeId={activeNavId} profile={profile}>
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <AbacusWelcomeBanner profile={profile} roleLabel="Student Portal" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AbacusStatCard label="Total Attempts" value={stats.totalAttempts} hint="Practice & assessment" />
            <AbacusStatCard label="Assessments" value={stats.assessments} hint="Timed tests completed" />
            <AbacusStatCard label="Average Score" value={`${stats.avgScore}%`} hint="Across all sessions" />
            <AbacusStatCard
              label="Latest Score"
              value={
                stats.latest ? `${stats.latest.score}/${stats.latest.total}` : '—'
              }
              hint={stats.latest ? formatMode(stats.latest.mode) : 'No attempts yet'}
            />
          </div>

          {!resultsLoading && results.length > 0 ? (
            <Card className="border-slate-200/80 bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatMode(item.mode)} · {item.category} {item.level_name}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800">
                      {item.score}/{item.total}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My Results</h2>
            <p className="text-sm text-slate-600">Your saved practice and assessment scores.</p>
          </div>

          {resultsLoading ? (
            <AbacusDashboardSkeleton />
          ) : results.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-white/80">
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-900">No results yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Start with digital practice or take an assessment to see scores here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {results.map((item) => (
                <Card key={item.id} className="border-slate-200/80 bg-white/90">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {item.score}/{item.total}
                        </span>
                        <Badge variant="outline">{formatMode(item.mode)}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {item.category} · Level {item.level_name}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                    </div>
                    {item.time_taken != null ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        {Math.floor(item.time_taken / 60)}m {item.time_taken % 60}s
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </AbacusStudentChrome>
  );
}
