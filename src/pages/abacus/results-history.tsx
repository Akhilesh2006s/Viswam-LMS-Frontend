import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { usePageTitle } from '@/hooks/use-page-title';
import { fetchAbacusPracticeResults, type AbacusPracticeResult } from '@/lib/abacus-api';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

function formatMode(mode: string) {
  if (mode === 'assessment') return 'Assessment';
  if (mode === 'physical-practice') return 'Physical Practice';
  return 'Digital Practice';
}

export default function AbacusResultsHistoryPage() {
  usePageTitle('My Results');
  const [rows, setRows] = useState<AbacusPracticeResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbacusPracticeResults()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AbacusModuleLayout page="results" title="My Results" wide>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0b1f3a]">My Practice Results</h1>
        <p className="mt-1 text-sm text-slate-600">Scores from practice and assessment sessions.</p>
      </div>

      {loading ? <p className="mt-8 text-center text-slate-500">Loading…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed bg-white p-8 text-center text-slate-500">
          No results found yet.
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-lg font-bold text-[#0b1f3a]">{item.score} / {item.total}</p>
            <p className="mt-1 text-sm text-slate-600">
              {formatMode(item.mode)} · {item.category} · Level {item.level_name}
            </p>
            <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href={ABACUS_ROUTES.home} className="inline-flex rounded-full bg-[#0b1f3a] px-5 py-2 text-sm font-semibold text-white">
          Back to Home
        </Link>
      </div>
    </AbacusModuleLayout>
  );
}
