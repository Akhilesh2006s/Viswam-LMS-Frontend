import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';
import { installAbacusBrowserApi } from '@/lib/abacus-browser-api';

type Problem = { type?: string; numbers: number[]; ops?: string[] };

function renderQuestionHtml(p: Problem) {
  if (p.type === 'mul') return `${p.numbers[0]} × ${p.numbers[1]}`;
  if (p.type === 'divi') return `${p.numbers[0]} ÷ ${p.numbers[1]}`;
  let html = `${p.numbers[0]}`;
  p.ops?.forEach((op, j) => { html += `\n${op} ${p.numbers[j + 1]}`; });
  return html;
}

function clearResultStorage() {
  ['problems', 'answers', 'userAnswers', 'score', 'resultSaved', 'testStarted', 'questionSetId'].forEach((k) =>
    localStorage.removeItem(k),
  );
}

export default function AbacusAssessmentResultsPage() {
  usePageTitle('Assessment Results');
  const [saved, setSaved] = useState(false);

  const problems = useMemo(() => JSON.parse(localStorage.getItem('problems') || '[]') as Problem[], []);
  const answers = useMemo(() => JSON.parse(localStorage.getItem('answers') || '[]') as number[], []);
  const userAnswers = useMemo(() => JSON.parse(localStorage.getItem('userAnswers') || '[]') as number[], []);
  const score = localStorage.getItem('score') || '0';
  const category = localStorage.getItem('category') || 'N/A';
  const levelName = localStorage.getItem('levelName') || 'N/A';
  const timeTaken = Number(localStorage.getItem('timeTaken')) || 0;

  useEffect(() => {
    installAbacusBrowserApi();
    if (localStorage.getItem('resultSaved') === 'true') return;
    const student = JSON.parse(localStorage.getItem('student') || 'null');
    if (!student) return;
    void window.AbacusAPI?.fetch('/portal/results', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'assessment',
        category: category || student.category,
        level_rank: Number(localStorage.getItem('levelRank')) || 0,
        level_name: levelName || student.level,
        score: Number(score),
        total: answers.length,
        time_taken: timeTaken,
        question_set_id: localStorage.getItem('questionSetId') || null,
      }),
    }).then(() => {
      localStorage.setItem('resultSaved', 'true');
      setSaved(true);
    }).catch(() => {});
  }, [answers.length, category, levelName, score, timeTaken]);

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  return (
    <AbacusModuleLayout page="assessment" title="Assessment Results" wide requiredRole="student">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase text-red-600">Assessment Test</p>
        <h1 className="text-2xl font-bold text-[#0b1f3a]">Total Marks: {score} / {answers.length}</h1>
        <p className="text-slate-600">Category: {category} · Level: {levelName}</p>
        <p className="text-slate-600">Time taken: {minutes}m {seconds}s</p>
        {saved ? <p className="mt-1 text-xs text-green-700">Result saved</p> : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((p, i) => {
          if (!p) return null;
          const ok = Number(userAnswers[i]) === answers[i];
          return (
            <div key={i} className="rounded-xl border bg-white p-4 text-left shadow-sm">
              <p className="text-xs font-bold text-slate-500">Question {i + 1}</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{renderQuestionHtml(p)}</pre>
              <p className="mt-2 text-sm">Your: {userAnswers[i] ?? '—'} · Ans: {answers[i]}</p>
              <p className={ok ? 'text-green-700' : 'text-red-600'}>{ok ? '✔' : '✘'}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 mb-4 flex flex-wrap justify-center gap-3 pb-2 sm:pb-0">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href={ABACUS_ROUTES.assessment} onClick={clearResultStorage}>Take another assessment</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ABACUS_ROUTES.home} onClick={clearResultStorage}>Home</Link>
        </Button>
      </div>
    </AbacusModuleLayout>
  );
}
