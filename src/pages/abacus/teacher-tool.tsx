import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Calculator, Lightbulb, RotateCcw, Wrench } from 'lucide-react';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { AbacusDashboardSkeleton } from '@/components/abacus/AbacusPortalShell';
import { useAbacusLegacyScripts, useAbacusStylesheet } from '@/hooks/use-abacus-legacy-scripts';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';
import { ABACUS_THEME } from '@/lib/abacus-theme';
import '@/styles/abacus-teacher-tool.css';

function AbacusTeacherToolContent() {
  useAbacusStylesheet();
  const [, setLocation] = useLocation();

  useEffect(() => {
    installAbacusBrowserApi();
    void window.AbacusAPI?.ensureSession().then(() => {
      const student = JSON.parse(localStorage.getItem('student') || '{}');
      if (student.role !== 'teacher') setLocation(ABACUS_ROUTES.home);
    });
  }, [setLocation]);

  const { loaded, error } = useAbacusLegacyScripts({
    scripts: ['/abacus/js/Teacherabacus.js'],
    requiredSelector: '#abacus',
  });

  useEffect(() => {
    if (!loaded) return;
    window.initTeacherAbacusBoard?.();
  }, [loaded]);

  return (
    <div className="abacus-teacher-tool">
      <header className="att-hero">
        <div className="att-hero-text">
          <span className="att-hero-badge">
            <Wrench className="h-3 w-3" aria-hidden />
            Classroom demo
          </span>
          <h1>Teacher Tool</h1>
          <p>
            Use the interactive soroban to demonstrate problems live. Enter a math expression and
            step through the solution with your students.
          </p>
          <div className="att-hero-tips">
            <span className="att-tip">125+47</span>
            <span className="att-tip">200-38</span>
            <span className="att-tip">15*4</span>
            <span className="att-tip">84/7</span>
          </div>
        </div>
      </header>

      {!loaded && !error ? (
        <p className="att-loading text-slate-500">Loading teacher tool…</p>
      ) : null}
      {error ? <p className="att-load-error">{error}</p> : null}

      <div className="att-workspace">
        <div className="att-grid">
          <section className="att-card att-abacus-card" aria-label="Interactive soroban">
            <div className="att-card-head">
              <h2>
                <Calculator className="mr-1.5 inline h-4 w-4 align-text-bottom" aria-hidden />
                Interactive Soroban
              </h2>
              <button
                type="button"
                className="att-btn att-btn-ghost"
                onClick={() => window.clearAbacus?.()}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Reset board
              </button>
            </div>

            <div className="abacus-wrapper">
              <div className="abacus-board-wrap">
                <div className="abacus" id="abacus" />
              </div>
              <div className="below-board">
                <div className="rod-values-row" id="rodValuesRow" />
                <div className="abacus-value-box">
                  Board value: <span id="totalValue">0</span>
                </div>
              </div>
            </div>
          </section>

          <section className="att-card att-question-card" aria-label="Question workspace">
            <div className="att-card-head">
              <h2>Write your question</h2>
              <span>Use + − × ÷ or words</span>
            </div>

            <div id="errorBox" className="att-error" role="alert" />

            <textarea
              id="question_box"
              placeholder="e.g. 125 + 47  or  50 times 3"
              aria-label="Math question input"
            />

            <div className="att-actions">
              <button
                type="button"
                className="att-btn att-btn-primary"
                onClick={() => window.startSolve?.()}
              >
                Show answer
              </button>
              <button
                type="button"
                className="att-btn att-btn-secondary"
                onClick={() => window.nextStep?.()}
              >
                Next step
              </button>
              <button
                type="button"
                className="att-btn att-btn-outline"
                onClick={() => window.clearQuestion?.()}
              >
                Clear
              </button>
            </div>

            <div className="att-status-row">
              <div className="att-technique-box">
                <Lightbulb className="mr-1.5 inline h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span id="techniqueResult">Ready</span>
              </div>
              <div className="att-answer-box">
                Answer: <span id="answerResult">0</span>
              </div>
            </div>
          </section>
        </div>

        <section className="att-card att-steps-card" aria-label="Solution steps">
          <div className="att-card-head">
            <h2>Step-by-step solution</h2>
            <span>Click Show answer, then Next step</span>
          </div>
          <div className="steps-panel" id="stepList" />
        </section>
      </div>
    </div>
  );
}

export default function AbacusTeacherToolPage() {
  usePageTitle('Teacher Tool');
  const { loading, error } = useAbacusPortal({ role: 'teacher', strict: true });

  if (loading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: ABACUS_THEME.pageBg }}>
        <AbacusDashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <AbacusModuleLayout page="teacher" title="Teacher Tool" wide requiredRole="teacher">
      <AbacusTeacherToolContent />
    </AbacusModuleLayout>
  );
}
