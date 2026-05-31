import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';

type Problem = {
  type?: string;
  numbers: number[];
  ops?: string[];
};

function renderQuestionHtml(p: Problem) {
  if (p.type === 'mul') return `${p.numbers[0]} × ${p.numbers[1]}`;
  if (p.type === 'divi') return `${p.numbers[0]} ÷ ${p.numbers[1]}`;
  if (p.type === 'bodmas') return `(${p.numbers[0]} ${p.ops?.[0]} ${p.numbers[1]}) ${p.ops?.[1]} ${p.numbers[2]}`;
  if (p.type === 'sqrt') return `√ ${p.numbers[0]}`;
  if (p.type === 'percent') return `${p.numbers[0]} % of ${p.numbers[1]}`;
  if (p.type === 'decimal' || p.type === 'decimalmul' || p.type === 'decimaldivi') {
    let html = `${p.numbers[0]}`;
    p.ops?.forEach((op, j) => { html += `\n${op} ${p.numbers[j + 1]}`; });
    return html;
  }
  let html = `${p.numbers[0]}`;
  p.ops?.forEach((op, j) => { html += `\n${op} ${p.numbers[j + 1]}`; });
  return html;
}

function clearResultStorage() {
  ['problems', 'answers', 'userAnswers', 'score', 'resultSaved', 'testStarted', 'questionSetId'].forEach((k) =>
    localStorage.removeItem(k),
  );
}

export default function AbacusPracticeResultsPage() {
  usePageTitle('Practice Results');
  const [saved, setSaved] = useState(false);

  const problems = useMemo(() => JSON.parse(localStorage.getItem('problems') || '[]') as Problem[], []);
  const answers = useMemo(() => JSON.parse(localStorage.getItem('answers') || '[]') as number[], []);
  const userAnswers = useMemo(() => JSON.parse(localStorage.getItem('userAnswers') || '[]') as number[], []);
  const score = localStorage.getItem('score') || '0';
  const mode = localStorage.getItem('mode') || 'practice';
  const category = localStorage.getItem('category') || 'N/A';
  const levelName = localStorage.getItem('levelName') || 'N/A';
  const timeTaken = Number(localStorage.getItem('timeTaken')) || 0;

  useEffect(() => {
    installAbacusBrowserApi();
    if (localStorage.getItem('resultSaved') === 'true' || mode === 'assessment') return;
    const student = JSON.parse(localStorage.getItem('student') || 'null');
    if (!student) return;
    void window.AbacusAPI?.fetch('/portal/results', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        category: category || student.category,
        level_rank: Number(localStorage.getItem('levelRank')) || 0,
        level_name: levelName || student.level,
        score: Number(score),
        total: answers.length,
        time_taken: timeTaken || null,
        question_set_id: localStorage.getItem('questionSetId') || null,
      }),
    }).then(() => {
      localStorage.setItem('resultSaved', 'true');
      setSaved(true);
    }).catch(() => {});
  }, [answers.length, category, levelName, mode, score, timeTaken]);

  return (
    <AbacusModuleLayout page="results" title="Result Sheet" wide>
      <div className="text-center">
        <p className="text-sm font-semibold uppercase text-emerald-700">{mode === 'physical-practice' ? 'Physical Practice' : 'Practice Session'}</p>
        <h1 className="text-2xl font-bold text-[#0b1f3a]">Total Marks: {score} / {answers.length}</h1>
        <p className="text-slate-600">Category: {category} · Level: {levelName}</p>
        {saved ? <p className="mt-1 text-xs text-green-700">Result saved</p> : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((p, i) => {
          if (!p) return null;
          const ok = Number(userAnswers[i]) === answers[i];
          return (
            <div key={i} className="rounded-xl border bg-white p-4 text-left shadow-sm">
              <p className="text-xs font-bold text-slate-500">Question {i + 1}</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{renderQuestionHtml(p)}</pre>
              <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-sm">Your: {userAnswers[i] ?? '—'}</p>
              <p className="mt-1 rounded bg-green-50 px-2 py-1 text-sm">Ans: {answers[i]}</p>
              <p className={`mt-1 text-sm font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>{ok ? '✔' : '✘'}</p>
            </div>
          );
        })}
      </div>

      {!problems.length ? (
        <p className="mt-8 text-center text-slate-500">No result data found. Complete a practice session first.</p>
      ) : null}

      <div className="mt-8 mb-4 flex flex-wrap justify-center gap-3 pb-2 sm:pb-0">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href={ABACUS_ROUTES.practice} onClick={clearResultStorage}>Practice again</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ABACUS_ROUTES.home} onClick={clearResultStorage}>Home</Link>
        </Button>
      </div>
    </AbacusModuleLayout>
  );
}
