import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  eduottClassToSelectValue,
  eduottSelectValueToClass,
  useEduOTTFilters,
} from '@/contexts/edu-ott-filter-context';
import { Filter, X } from 'lucide-react';

const SUBJECT_ALL = '__all__';

type EduOTTGlobalFilterBarProps = {
  classOptions: string[];
  subjectOptions: string[];
  /** Dark theme for Viswam OTT pages */
  variant?: 'light' | 'dark';
};

export function EduOTTGlobalFilterBar({
  classOptions,
  subjectOptions,
  variant = 'light',
}: EduOTTGlobalFilterBarProps) {
  const isDark = variant === 'dark';
  const {
    selectedClass,
    selectedSubject,
    setSelectedClass,
    setSelectedSubject,
    clearFilters,
    clearClass,
    clearSubject,
  } = useEduOTTFilters();

  const hasActive =
    selectedClass != null ||
    selectedSubject != null;

  return (
    <div
      className={
        isDark
          ? 'ott-filter-panel space-y-3'
          : 'space-y-3 rounded-xl border border-sky-200/80 bg-white/90 p-4 shadow-sm'
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="space-y-1.5 w-full sm:w-auto min-w-[180px]">
          <Label className={isDark ? 'text-xs text-slate-400' : 'text-xs text-gray-500'}>
            Select class
          </Label>
          <Select
            value={eduottClassToSelectValue(selectedClass)}
            onValueChange={(v) => setSelectedClass(eduottSelectValueToClass(v))}
          >
            <SelectTrigger
              className={
                isDark
                  ? 'w-full md:w-[200px] bg-slate-800/80 border border-white/15 text-white'
                  : 'w-full md:w-[200px] bg-white border-2 border-sky-200 hover:border-sky-300 focus:border-sky-400 focus:ring-sky-200 shadow-sm'
              }
            >
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={eduottClassToSelectValue(null)}>All classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 w-full sm:w-auto min-w-[200px]">
          <Label className={isDark ? 'text-xs text-slate-400' : 'text-xs text-gray-500'}>
            Select subject
          </Label>
          <Select
            value={selectedSubject ?? SUBJECT_ALL}
            onValueChange={(v) =>
              setSelectedSubject(v === SUBJECT_ALL ? null : v)
            }
          >
            <SelectTrigger
              className={
                isDark
                  ? 'w-full md:w-[220px] bg-slate-800/80 border border-white/15 text-white'
                  : 'w-full md:w-[220px] bg-white border-2 border-sky-200 hover:border-sky-300 focus:border-sky-400 focus:ring-sky-200 shadow-sm'
              }
            >
              <Filter
                className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
              />
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SUBJECT_ALL}>All subjects</SelectItem>
              {subjectOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={
              isDark
                ? 'shrink-0 border-white/20 text-white hover:bg-white/10'
                : 'shrink-0'
            }
            disabled={!hasActive}
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      </div>

      <div className={`flex min-h-[28px] flex-wrap items-center gap-2 ${hasActive ? '' : 'invisible'}`}>
        <span className="text-xs font-medium text-gray-500">Active:</span>
        {selectedClass != null ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
            onClick={clearClass}
          >
            Class: {selectedClass}
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
        {selectedSubject != null ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100"
            onClick={clearSubject}
          >
            Subject: {selectedSubject}
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
