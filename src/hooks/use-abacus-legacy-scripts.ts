import { useEffect, useState } from 'react';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';

/** Legacy scripts use top-level const — must not execute the same file twice per page load. */
const executedLegacyScripts = new Set<string>();
const LEGACY_SCRIPT_VERSION = '11';

const BEAD_SOUNDS_SCRIPT = '/abacus/js/bead-sounds.js';
const BEAD_CURSOR_SCRIPT = '/abacus/js/bead-cursor.js';
const STUDENT_ABACUS_SCRIPT = '/abacus/js/abacus.js';
const TEACHER_ABACUS_SCRIPT = '/abacus/js/Teacherabacus.js';
const PHYSICAL_PRACTICE_SCRIPT = '/abacus/js/physical-practice.js';

const BEAD_FEEDBACK_SCRIPTS = [BEAD_SOUNDS_SCRIPT, BEAD_CURSOR_SCRIPT];

function loadScript(src: string, id: string): Promise<void> {
  const versionedSrc = `${src}?v=${LEGACY_SCRIPT_VERSION}`;

  if (executedLegacyScripts.has(src)) {
    return Promise.resolve();
  }

  const existing = document.getElementById(id);
  if (existing) {
    executedLegacyScripts.add(src);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.id = id;
    el.src = versionedSrc;
    el.async = false;
    el.onload = () => {
      executedLegacyScripts.add(src);
      resolve();
    };
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(el);
  });
}

async function waitForSelectors(selectors: string[], attempts = 120): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    if (selectors.every((selector) => document.querySelector(selector))) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`Required elements not found: ${selectors.join(', ')}`);
}

type UseAbacusLegacyScriptsOptions = {
  scripts: string[];
  requiredSelector?: string;
  requiredSelectors?: string[];
  ready?: boolean;
  onReady?: () => void;
};

function remountLegacyBoard(initName: 'initAbacusBoard' | 'initTeacherAbacusBoard', attempt = 0) {
  const init = window[initName];
  if (typeof init !== 'function') return;

  init();

  const abacus = document.getElementById('abacus');
  const hasRods = Boolean(abacus && abacus.children.length > 0);
  if (!hasRods && attempt < 12) {
    requestAnimationFrame(() => remountLegacyBoard(initName, attempt + 1));
  }
}

export function useAbacusLegacyScripts({
  scripts,
  requiredSelector = '#abacus',
  requiredSelectors = [],
  ready = true,
  onReady,
}: UseAbacusLegacyScriptsOptions) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usesStudentBoard = scripts.includes(STUDENT_ABACUS_SCRIPT);
  const usesTeacherBoard = scripts.includes(TEACHER_ABACUS_SCRIPT);
  const usesPhysicalPractice = scripts.includes(PHYSICAL_PRACTICE_SCRIPT);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    installAbacusBrowserApi();

    (async () => {
      try {
        const selectors = [
          ...(requiredSelector ? [requiredSelector] : []),
          ...requiredSelectors,
          ...(usesStudentBoard || usesTeacherBoard ? ['#rodValuesRow', '#totalValue'] : []),
        ];
        if (selectors.length > 0) {
          await waitForSelectors(Array.from(new Set(selectors)));
        }
        if (cancelled) return;

        const scriptQueue =
          usesStudentBoard || usesTeacherBoard
            ? [
                ...BEAD_FEEDBACK_SCRIPTS.filter((src) => !scripts.includes(src)),
                ...scripts,
              ]
            : scripts;

        for (const src of scriptQueue) {
          if (cancelled) return;
          const id = `abacus-script-${src.replace(/[^\w]/g, '-')}`;
          await loadScript(src, id);
        }
        if (cancelled) return;

        if (usesStudentBoard) {
          remountLegacyBoard('initAbacusBoard');
        }
        if (usesTeacherBoard) {
          remountLegacyBoard('initTeacherAbacusBoard');
        }
        if (usesPhysicalPractice) {
          window.initPhysicalPractice?.();
        }

        onReady?.();
        if (!cancelled) setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Script load failed');
        }
      }
    })();

    return () => {
      cancelled = true;
      setLoaded(false);
    };
  }, [
    ready,
    requiredSelector,
    requiredSelectors.join('|'),
    scripts.join('|'),
    usesStudentBoard,
    usesTeacherBoard,
    usesPhysicalPractice,
  ]);

  return { loaded, error };
}

export function useAbacusStylesheet() {
  useEffect(() => {
    const href = '/abacus/style.css';
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, []);
}

declare global {
  interface Window {
    AbacusBeadSounds?: {
      playBeadSound: (direction: 'up' | 'down') => void;
    };
    AbacusBeadCursor?: {
      feedback: (direction: 'up' | 'down') => void;
      bindBead: (el: HTMLElement) => void;
      bindBoard: (el: HTMLElement) => void;
      resetBoardBinding?: () => void;
    };
    initAbacusBoard?: () => void;
    initTeacherAbacusBoard?: () => void;
    clearAbacus?: () => void;
    getAbacusValue?: () => number;
    loadCategories?: () => void;
    startSolve?: (showAnswer?: boolean) => void;
    nextStep?: () => void;
    clearQuestion?: () => void;
    initPhysicalPractice?: () => void;
    fetchAbacusQuestionSet?: (
      category: string,
      levelName: string,
      mode?: string,
    ) => Promise<{ id: string; problems: unknown[]; answers: number[] }>;
  }
}
