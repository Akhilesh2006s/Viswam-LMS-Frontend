import { ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectTheme } from "@/lib/gamification/constants";
import { ProgressRing } from "./ProgressRing";

export type SubjectJourneyItem = {
  id?: string;
  name: string;
  progress: number;
  lessonsCompleted?: number;
  xpEarned?: number;
};

type SubjectJourneyCardProps = {
  subject: SubjectJourneyItem;
  onClick?: () => void;
};

export function SubjectJourneyCard({ subject, onClick }: SubjectJourneyCardProps) {
  const theme = subjectTheme(subject.name);
  const xp = subject.xpEarned ?? Math.round(subject.progress * 8);

  return (
    <button type="button" onClick={onClick} className="eco-subject-card w-full text-left p-5">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-95", theme.gradientClass)} aria-hidden />
      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-lg font-bold capitalize">{subject.name}</h3>
            <p className="text-xs text-white/75">{subject.lessonsCompleted ?? 0} lessons · {xp} XP</p>
          </div>
          <ProgressRing percent={subject.progress} color={theme.accent} />
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90">
          Open lessons <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}
