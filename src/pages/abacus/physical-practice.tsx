import { useEffect } from 'react';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { AbacusDashboardSkeleton } from '@/components/abacus/AbacusPortalShell';
import { useAbacusLegacyScripts, useAbacusStylesheet } from '@/hooks/use-abacus-legacy-scripts';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';
import { ABACUS_THEME } from '@/lib/abacus-theme';

function AbacusPhysicalPracticeContent() {
  useAbacusStylesheet();

  useEffect(() => {
    installAbacusBrowserApi();
    void window.AbacusAPI?.ensureSession();
    if (!localStorage.getItem('testStarted')) {
      localStorage.removeItem('resultSaved');
      localStorage.setItem('testStarted', 'true');
    }
  }, []);

  const { loaded, error } = useAbacusLegacyScripts({
    scripts: ['/abacus/js/abacus-question-fetch.js', '/abacus/js/physical-practice.js'],
    requiredSelector: '#questions',
  });

  useEffect(() => {
    if (!loaded) return;
    window.initPhysicalPractice?.();
  }, [loaded]);

  return (
    <>
      <div className="container">
        <h1 className="page-title text-center text-2xl font-bold text-[#0b1f3a]">
          Physical Abacus / Visualization Practice
        </h1>
      </div>

      {!loaded && !error ? <p className="text-center text-sm text-slate-500">Loading…</p> : null}
      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      <div className="main-grid px-4 pb-8 max-md:pb-24">
        <div className="panel rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xl font-semibold text-[#0b1f3a]">Exercise Sheet</div>
            <div className="controls flex flex-wrap gap-2">
              <select
                id="category"
                className="rounded-lg border px-3 py-2"
                defaultValue=""
                onChange={() => (window as any).updateLevels?.()}
              />
              <select
                id="level"
                className="rounded-lg border px-3 py-2"
                defaultValue=""
                onChange={() => (window as any).generateQuestions?.()}
              />
              <button type="button" className="start-btn rounded-full px-4 py-2" onClick={() => (window as any).generateQuestions?.()}>
                New Set
              </button>
            </div>
          </div>
          <div id="questions" className="physical-questions-grid">
            <p className="physical-questions-empty">
              Please select a Category and Level to load questions.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3 border-t pt-4">
            <button type="button" className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white" onClick={() => (window as any).checkAnswers?.()}>
              Check Answers
            </button>
            <button type="button" className="rounded-lg bg-slate-400 px-4 py-2 font-semibold text-white" onClick={() => (window as any).resetAnswers?.()}>
              Clear Answers
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AbacusPhysicalPracticePage() {
  usePageTitle('Physical Practice');
  const { loading, profile, error } = useAbacusPortal({ strict: false });

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: ABACUS_THEME.pageBg }}>
        <AbacusDashboardSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-red-600">
        {error || 'Unable to load abacus session'}
      </div>
    );
  }

  return (
    <AbacusModuleLayout page="physical" title="Physical Practice" wide>
      <AbacusPhysicalPracticeContent />
    </AbacusModuleLayout>
  );
}
