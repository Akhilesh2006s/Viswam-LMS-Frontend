import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AbacusActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accent?: 'emerald' | 'gold' | 'sky' | 'navy';
  className?: string;
};

const accentStyles = {
  emerald: 'from-emerald-500/15 to-emerald-600/5 border-emerald-200/80 text-emerald-700',
  gold: 'from-amber-400/20 to-amber-500/5 border-amber-200/80 text-amber-800',
  sky: 'from-sky-400/15 to-sky-500/5 border-sky-200/80 text-sky-800',
  navy: 'from-slate-700/10 to-slate-900/5 border-slate-200 text-slate-800',
};

export function AbacusActionCard({
  title,
  description,
  icon: Icon,
  href,
  accent = 'emerald',
  className,
}: AbacusActionCardProps) {
  return (
    <a href={href} className={cn('group block h-full', className)}>
      <Card className="h-full overflow-hidden border bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-0">
          <div
            className={cn(
              'flex h-full flex-col border-b bg-gradient-to-br p-5',
              accentStyles[accent],
            )}
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-black/5">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-800 group-hover:gap-2 transition-all">
              Open
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

type AbacusStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function AbacusStatCard({ label, value, hint }: AbacusStatCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
