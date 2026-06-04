import { useState } from 'react';
import {
  BookOpen,
  Brain,
  Calculator,
  Hand,
  Lightbulb,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import {
  ABACUS_ABOUT_IMAGES,
  ABACUS_INDEX_FINGER_DIAGRAMS,
  ABACUS_PART_MARKERS,
  ABACUS_THUMB_CAPTION,
} from '@/lib/abacus-about-assets';
import { ABACUS_BRAND } from '@/lib/abacus-theme';

const B = ABACUS_BRAND;
import { cn } from '@/lib/utils';

type PartInfo = { title: string; text: string };

const MASTERY_STEPS = [
  {
    step: '01',
    title: 'Visualization',
    text: 'Move beads in your mind without touching the soroban.',
    icon: Brain,
  },
  {
    step: '02',
    title: 'Instant Arithmetic',
    text: 'Answer complex sums faster than writing them down.',
    icon: Zap,
  },
] as const;

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'overflow-hidden rounded-2xl border border-emerald-200/70 bg-white shadow-sm shadow-emerald-900/5',
        className,
      )}
    >
      <div
        className="border-b px-6 py-5"
        style={{
          background: `linear-gradient(135deg, ${B.emeraldLight} 0%, ${B.surface} 100%)`,
        }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: B.emeraldDark }}>
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl" style={{ color: B.navy }}>
          {title}
        </h2>
        {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function AbacusAboutContent({ className }: { className?: string }) {
  const [info, setInfo] = useState<PartInfo>({
    title: 'Explore the soroban',
    text: 'Tap any glowing marker on the diagram to learn what each part does.',
  });
  const [activePart, setActivePart] = useState<string | null>(null);

  const selectPart = (title: string, text: string) => {
    setActivePart(title);
    setInfo({ title, text });
  };

  return (
    <div className={cn('w-full space-y-8', className)}>
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-200/50 px-6 py-10 text-white shadow-lg sm:px-10"
        style={{
          background: `linear-gradient(135deg, ${B.navy} 0%, ${B.navyMid} 45%, ${B.emeraldDark} 100%)`,
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="h-3.5 w-3.5" />
              Study guide
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">About Abacus</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
              Master the Japanese soroban — from bead names to finger technique — and build mental math
              speed with confidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Parts', 'Technique', 'Mental math'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <SectionShell
        id="intro"
        eyebrow="Chapter 1"
        title="The Art of Abacus"
        description="A centuries-old tool that trains focus, memory, and lightning-fast calculation."
      >
        <p className="text-base leading-relaxed text-slate-600">
          The abacus is a counting frame used for arithmetic and mental math training. With consistent
          practice, students gain speed, accuracy, concentration, and confidence.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-5 transition-shadow hover:shadow-md">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${B.emerald}, ${B.emeraldDark})` }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold" style={{ color: B.navy }}>
              Evolution of Abacus
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                From Greek &quot;Abax&quot; — a counting table.
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                India follows the Japanese Soroban method.
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                Millions trained nationwide since the 1990s.
              </li>
            </ul>
          </div>
          <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white p-5 transition-shadow hover:shadow-md">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ background: `linear-gradient(135deg, ${B.emerald}, ${B.emeraldDark})` }}
            >
              <Target className="h-5 w-5" />
            </div>
            <h3 className="font-bold" style={{ color: B.navy }}>
              How it Works
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                100% speed and accuracy through practice.
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                Mental math without pen, paper, or a physical frame.
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{ color: B.emerald }}>
                  •
                </span>
                Stronger logic and creative thinking.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Two stages of mastery</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {MASTERY_STEPS.map(({ step, title, text, icon: Icon }) => (
              <div
                key={step}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-extrabold text-white"
                  style={{ backgroundColor: B.emeraldDark }}
                >
                  <Icon className="mb-0.5 h-4 w-4" />
                  {step}
                </div>
                <div>
                  <h4 className="font-bold text-[#0b1f3a]">{title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-6 flex gap-4 rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${B.emeraldLight} 0%, ${B.surface} 100%)`,
            border: `1px solid ${B.emeraldBorder}`,
          }}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: B.gold }}
          >
            <Lightbulb className="h-5 w-5" style={{ color: B.navy }} />
          </div>
          <div>
            <h4 className="font-bold text-[#0b1f3a]">Why not calculators?</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Calculators give the answer; the abacus teaches you <strong>how to find it</strong> — building
              concentration, photographic memory, and lasting confidence.
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="parts"
        eyebrow="Chapter 2"
        title="The Abacus & Its Parts"
        description="Interactive diagram — select a marker to see what each component does."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div
            className="relative overflow-hidden rounded-2xl p-4 shadow-inner"
            style={{
              background: `linear-gradient(180deg, ${B.emeraldLight} 0%, ${B.surface} 100%)`,
              border: `1px solid ${B.emeraldBorder}`,
            }}
          >
            <img
              src={ABACUS_ABOUT_IMAGES.parts}
              alt="Abacus parts diagram"
              className="mx-auto max-h-[320px] w-full max-w-lg object-contain"
            />
            {ABACUS_PART_MARKERS.map((pt) => {
              const active = activePart === pt.title;
              return (
                <button
                  key={pt.title}
                  type="button"
                  aria-label={pt.title}
                  onClick={() => selectPart(pt.title, pt.text)}
                  className={cn(
                    'absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-all',
                    active ? 'scale-125 ring-4 ring-emerald-300/60' : 'hover:scale-110',
                  )}
                  style={{
                    top: pt.top,
                    left: pt.left,
                    backgroundColor: active ? B.emeraldDark : B.emerald,
                  }}
                />
              );
            })}
          </div>

          <div
            className="w-full min-w-[220px] max-w-xs rounded-2xl border-2 p-5 shadow-sm lg:sticky lg:top-4"
            style={{
              borderColor: B.emeraldBorder,
              backgroundColor: B.surface,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Selected part</p>
            <h3 className="mt-1 text-lg font-bold" style={{ color: B.emeraldDark }}>
              {info.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{info.text}</p>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="fingers"
        eyebrow="Chapter 3"
        title="Mastering the Pincer Grip"
        description="Use only your thumb and index finger for fast, accurate bead movement."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: B.emerald }}
              >
                <Hand className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: B.navy }}>
                  The Thumb
                </h3>
                <p className="text-sm font-semibold" style={{ color: B.emeraldDark }}>
                  The &quot;Adder&quot;
                </p>
              </div>
            </div>
            <figure>
              <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                <img
                  src={ABACUS_ABOUT_IMAGES.thumb}
                  alt="Thumb addition on earth beads"
                  className="mx-auto max-h-[240px] w-full object-contain"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-2 text-center text-xs italic text-emerald-800/90">
                {ABACUS_THUMB_CAPTION}
              </figcaption>
            </figure>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <Calculator className="mt-0.5 h-4 w-4 shrink-0" style={{ color: B.emerald }} />
                Moves earth beads (lower beads) UP only.
              </li>
              <li className="flex gap-2">
                <Calculator className="mt-0.5 h-4 w-4 shrink-0" style={{ color: B.emerald }} />
                Power finger for adding 1s, 2s, 3s, and 4s.
              </li>
            </ul>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: `${B.navyLight}33`,
              background: `linear-gradient(180deg, ${B.emeraldLight} 0%, ${B.surface} 100%)`,
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: B.navy }}
              >
                <Hand className="h-5 w-5 rotate-180" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: B.navy }}>
                  The Index Finger
                </h3>
                <p className="text-sm font-semibold" style={{ color: B.navyLight }}>
                  The &quot;Manager&quot;
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {ABACUS_INDEX_FINGER_DIAGRAMS.map((diagram, i) => (
                <figure
                  key={diagram.src}
                  className="overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm"
                >
                  <div
                    className="flex items-center gap-2 border-b px-3 py-2"
                    style={{ borderColor: B.emeraldBorder, backgroundColor: B.emeraldLight }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: B.emeraldDark }}
                    >
                      {i + 1}
                    </span>
                    <figcaption className="text-[11px] font-medium leading-snug" style={{ color: B.navy }}>
                      {diagram.caption}
                    </figcaption>
                  </div>
                  <div className="flex justify-center p-3">
                    <img
                      src={diagram.src}
                      alt={diagram.alt}
                      className="max-h-[160px] w-full max-w-[280px] object-contain"
                      loading="lazy"
                    />
                  </div>
                </figure>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Heaven beads (5s) up and down.</li>
              <li>• Earth beads down for subtraction.</li>
              <li>• Clears the bar when moving across rods.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-4 text-center sm:text-left">
          <p className="text-sm font-bold" style={{ color: B.emeraldDark }}>
            ⚠️ The Golden Rule
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Never use your middle, ring, or pinky fingers. Tuck them into your palm — often holding a pencil,
            ready to write the answer instantly.
          </p>
        </div>
      </SectionShell>
    </div>
  );
}
