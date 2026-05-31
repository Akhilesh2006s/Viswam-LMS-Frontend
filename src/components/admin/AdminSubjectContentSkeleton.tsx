import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Loader2 } from 'lucide-react';

export default function AdminSubjectContentSkeleton() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/80 to-teal-50/50"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading subject content"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-9 w-44 rounded-lg mb-6" />
        <div className="mb-8 flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-sky-400/30 to-teal-400/30 flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-sky-600/50" aria-hidden />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-8 w-48 sm:w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/90 shadow-lg p-5 sm:p-6 space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-2 text-sky-700">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
            <span className="text-sm font-medium text-slate-600">Loading materials…</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
