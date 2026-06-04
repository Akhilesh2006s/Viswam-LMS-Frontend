import { useEffect } from 'react';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { AbacusDashboardSkeleton } from '@/components/abacus/AbacusPortalShell';
import { useAbacusLegacyScripts, useAbacusStylesheet } from '@/hooks/use-abacus-legacy-scripts';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';
import { ABACUS_THEME } from '@/lib/abacus-theme';

function AbacusPracticeContent() {
  useAbacusStylesheet();

  useEffect(() => {
    installAbacusBrowserApi();
    void window.AbacusAPI?.ensureSession();
  }, []);

  const { loaded, error } = useAbacusLegacyScripts({
    scripts: ['/abacus/js/abacus-question-fetch.js', '/abacus/js/abacus.js', '/abacus/js/generator.js', '/abacus/js/ui.js'],
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
        <h1 className="page-title">Digital Abacus Practice</h1>
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
            id="startPracticeBtn"
            type="button"
            className="start-btn"
            onClick={() => {
              localStorage.setItem('startTime', String(Date.now()));
              (window as any).startPractice?.();
            }}
          >
            Start Practice
          </button>
          <div id="timer" style={{ display: 'none' }}>
            0:00
          </div>
        </div>
      </div>

      {!loaded && !error ? <p className="text-center text-sm text-slate-500">Loading abacus…</p> : null}
      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}

      <div className="main-grid">
        <div className="panel abacus-main-panel">
          <div className="panel-title">Interactive Soroban</div>
          <div className="abacus-and-questions-container">
            <div className="abacus-section">
              <div className="abacus-wrapper">
                <div className="abacus-board-wrap">
                  <div className="abacus" id="abacus" />
                </div>
                <div className="below-board">
                  <div className="rod-values-row" id="rodValuesRow" />
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
              <div id="questions" className="no-border" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AbacusPracticePage() {
  usePageTitle('Digital Practice');
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
    <AbacusModuleLayout page="practice" title="Digital Practice" wide>
      <AbacusPracticeContent />
    </AbacusModuleLayout>
  );
}
