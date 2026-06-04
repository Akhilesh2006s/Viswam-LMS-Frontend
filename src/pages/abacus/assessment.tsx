import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { AbacusDashboardSkeleton } from '@/components/abacus/AbacusPortalShell';
import { useAbacusLegacyScripts, useAbacusStylesheet } from '@/hooks/use-abacus-legacy-scripts';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';
import { ABACUS_THEME } from '@/lib/abacus-theme';

function AbacusAssessmentContent() {
  useAbacusStylesheet();
  const [, setLocation] = useLocation();

  useEffect(() => {
    installAbacusBrowserApi();
    void window.AbacusAPI?.ensureSession().then(() => {
      const student = JSON.parse(localStorage.getItem('student') || '{}');
      if (student.role === 'teacher') setLocation(ABACUS_ROUTES.home);
    });
    if (!localStorage.getItem('testStarted')) {
      localStorage.removeItem('resultSaved');
      localStorage.setItem('testStarted', 'true');
      localStorage.setItem('mode', 'assessment');
    }
    window.TOTAL_TIME = 300;
  }, [setLocation]);

  const { loaded, error } = useAbacusLegacyScripts({
    scripts: ['/abacus/js/abacus-question-fetch.js', '/abacus/js/abacus.js', '/abacus/js/generator.js', '/abacus/js/timer.js', '/abacus/js/ui.js'],
    requiredSelector: '#abacus',
  });

  useEffect(() => {
    if (!loaded) return;
    window.initAbacusBoard?.();
    window.loadCategories?.();
  }, [loaded]);

  return (
    <>
      <div className="container">
        <h1 className="page-title">Abacus Assessment</h1>
        <div className="top-controls">
          <select
            id="category"
            onChange={() => {
              (window as any).updateLevels?.();
              (window as any).saveCategory?.();
            }}
          >
            <option value="">Category</option>
            <option value="Star Juniors">Star Juniors</option>
            <option value="Juniors">Juniors</option>
            <option value="Seniors">Seniors</option>
          </select>
          <select id="level" onChange={() => (window as any).saveLevel?.()}>
            <option value="">Level</option>
          </select>
          <button
            type="button"
            id="startAssessmentBtn"
            className="start-btn"
            onClick={() => (window as any).startAssessment?.()}
          >
            Start Assessment
          </button>
          <div id="timer">5:00</div>
        </div>
      </div>

      {!loaded && !error ? <p className="text-center text-sm text-slate-500">Loading assessment…</p> : null}
      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      <div className="main-grid">
        <div className="panel abacus-main-panel">
          <div className="panel-title">Assessment Panel</div>
          <div className="abacus-and-questions-container">
            <div className="abacus-section">
              <div className="abacus-wrapper">
                <div className="abacus-board-wrap">
                  <div className="abacus" id="abacus" />
                </div>
                <div className="below-board">
                  <div id="rodValuesRow" />
                  <div className="abacus-value-box">
                    Value: <span id="totalValue">0</span>
                  </div>
                  <button type="button" className="clear" onClick={() => (window as any).clearAbacus?.()}>
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="questions-section">
              <div id="questions" />
              <button type="button" id="submitBtn" className="start-btn" style={{ display: 'none' }} onClick={() => (window as any).submitTest?.()}>
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AbacusAssessmentPage() {
  usePageTitle('Assessment');
  const { loading, error } = useAbacusPortal({ role: 'student', strict: true });

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
    <AbacusModuleLayout page="assessment" title="Assessment" wide requiredRole="student">
      <AbacusAssessmentContent />
    </AbacusModuleLayout>
  );
}

declare global {
  interface Window {
    TOTAL_TIME?: number;
  }
}
