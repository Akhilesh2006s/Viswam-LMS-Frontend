import { Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoadmapStage = {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  locked?: boolean;
};

type LearningRoadmapProps = {
  title: string;
  stages: RoadmapStage[];
  onStageClick?: (id: string) => void;
};

export function LearningRoadmap({ title, stages, onStageClick }: LearningRoadmapProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500">Complete each stage to unlock the next</p>
      <div className="mt-6 space-y-4">
        {stages.map((stage, i) => {
          const done = stage.progress >= 100;
          const locked = stage.locked && !done;
          return (
            <div key={stage.id} className="eco-roadmap-step">
              <div className={cn("eco-roadmap-node", locked && "locked")} />
              <button
                type="button"
                disabled={locked}
                onClick={() => onStageClick?.(stage.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  locked ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70" : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:shadow-md",
                  done && "border-emerald-200 bg-emerald-50/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {i + 1}. {stage.title}
                    </p>
                    {stage.subtitle ? <p className="text-xs text-slate-500">{stage.subtitle}</p> : null}
                  </div>
                  {locked ? (
                    <Lock className="h-4 w-4 text-slate-400" />
                  ) : done ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--brand-emerald)]" />
                  ) : (
                    <span className="text-sm font-bold text-[var(--brand-emerald)]">{stage.progress}%</span>
                  )}
                </div>
                <div className="eco-xp-bar mt-3">
                  <span style={{ width: `${stage.progress}%` }} />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
