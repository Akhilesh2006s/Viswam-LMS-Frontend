import { Button } from "@/components/ui/button";
import { Target, Play, Trophy } from "lucide-react";
import type { StudentGamificationProfile } from "@/lib/gamification/compute-profile";

type StudentHeroProps = {
  name: string;
  stream?: string;
  profile: StudentGamificationProfile;
  onContinueLearning: () => void;
  onViewQuizzes: () => void;
};

export function StudentHero({ name, stream, profile, onContinueLearning, onViewQuizzes }: StudentHeroProps) {
  return (
    <section className="eco-hero p-5 sm:p-8 eco-animate-in">
      <div className="eco-hero-mesh" aria-hidden />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">Your learning universe</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Welcome back, {name}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
            {stream ? `${stream} journey` : "Personalized journey"} — complete lessons, earn XP, and climb the leaderboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              className="rounded-xl bg-white font-semibold text-[var(--brand-navy)] hover:bg-white/90"
              onClick={onContinueLearning}
            >
              <Play className="mr-2 h-4 w-4" />
              Continue learning
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={onViewQuizzes}
            >
              <Trophy className="mr-2 h-4 w-4" />
              My quizzes
            </Button>
          </div>
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-white/90">
            <Target className="h-4 w-4 text-[var(--brand-gold)]" />
            <span className="text-sm font-semibold">Today&apos;s goal</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-white">{profile.dailyGoalPercent}%</p>
          <p className="text-xs text-white/70">
            {profile.dailyGoalCompleted} of {profile.dailyGoalTotal} tasks complete
          </p>
          <div className="eco-xp-bar mt-3 bg-white/20">
            <span style={{ width: `${profile.dailyGoalPercent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
