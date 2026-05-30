import { GAMIFICATION_BADGES } from "@/lib/gamification/constants";
import type { BadgeId } from "@/lib/gamification/constants";

type AchievementBadgesProps = {
  unlocked: BadgeId[];
};

export function AchievementBadges({ unlocked }: AchievementBadgesProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Achievements</h3>
      <p className="mt-1 text-sm text-slate-500">Unlock badges as you learn</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {GAMIFICATION_BADGES.map((badge) => {
          const isOn = unlocked.includes(badge.id);
          return (
            <span
              key={badge.id}
              className={`eco-badge-pill ${isOn ? "" : "locked"}`}
              title={badge.description}
            >
              <span>{badge.emoji}</span>
              {badge.title}
            </span>
          );
        })}
      </div>
    </div>
  );
}
