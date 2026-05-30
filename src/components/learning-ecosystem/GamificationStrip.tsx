import { Coins, Flame, Trophy, Zap } from "lucide-react";
import type { StudentGamificationProfile } from "@/lib/gamification/compute-profile";

type GamificationStripProps = {
  profile: StudentGamificationProfile;
};

export function GamificationStrip({ profile }: GamificationStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      <div className="eco-stat-chip eco-animate-in">
        <div className="flex items-center gap-2 text-[var(--brand-emerald)]">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">XP</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-slate-900">{profile.xp.toLocaleString()}</p>
        <p className="text-xs text-slate-500">Level {profile.level}</p>
        <div className="eco-xp-bar mt-2">
          <span style={{ width: `${profile.levelProgress}%` }} />
        </div>
      </div>
      <div className="eco-stat-chip eco-animate-in" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-2 text-amber-700">
          <Coins className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Coins</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-slate-900">{profile.coins}</p>
        <p className="text-xs text-slate-500">Redeem rewards soon</p>
      </div>
      <div className="eco-stat-chip eco-animate-in" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 text-orange-600">
          <Flame className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Streak</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-slate-900">{profile.streak} days</p>
        <p className="text-xs text-slate-500">Best: {profile.longestStreak} days</p>
      </div>
      <div className="eco-stat-chip eco-animate-in" style={{ animationDelay: "180ms" }}>
        <div className="flex items-center gap-2 text-[var(--brand-navy)]">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rank</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-slate-900">
          {profile.rank != null ? `#${profile.rank}` : "—"}
        </p>
        <p className="text-xs text-slate-500">Class leaderboard</p>
      </div>
    </div>
  );
}
