import { Link } from 'wouter';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { usePageTitle } from '@/hooks/use-page-title';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

export default function AbacusHomePage() {
  usePageTitle('Abacus Home');

  return (
    <AbacusModuleLayout page="home" title="Abacus Home" wide>
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#0B1F3A] via-[#123456] to-emerald-900 p-8 text-center text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90">Viswam Abacus Program</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Master Abacus &amp; Mental Math</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
          Build calculation speed, focus, and confidence with digital practice, physical abacus drills, and timed
          assessments — all within VISWAM LMS.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={ABACUS_ROUTES.about} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1f3a] shadow">
            Know About Abacus
          </Link>
          <Link href={ABACUS_ROUTES.practice} className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            Digital Practice
          </Link>
          <Link href={ABACUS_ROUTES.physicalPractice} className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            Physical Practice
          </Link>
          <Link href={ABACUS_ROUTES.assessment} className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            Take Assessment
          </Link>
          <Link href={ABACUS_ROUTES.teacherTool} className="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            Teacher Tool
          </Link>
        </div>
      </section>
    </AbacusModuleLayout>
  );
}
