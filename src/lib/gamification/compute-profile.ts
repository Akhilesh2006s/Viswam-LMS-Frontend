import { GAMIFICATION_BADGES, type BadgeId } from "./constants";

export type StudentGamificationProfile = {
  xp: number;
  coins: number;
  level: number;
  levelProgress: number;
  streak: number;
  longestStreak: number;
  rank: number | null;
  classRank: number | null;
  dailyGoalPercent: number;
  dailyGoalCompleted: number;
  dailyGoalTotal: number;
  unlockedBadges: BadgeId[];
  weeklyStudyMinutes: number;
};

const XP_PER_LEVEL = 500;

export function computeLevel(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const levelProgress = Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
  return { level, levelProgress };
}

export function computeGamificationProfile(input: {
  overallProgress?: number;
  streak?: number;
  longestStreak?: number;
  rank?: number | null;
  examResultCount?: number;
  quizCount?: number;
  completedTodos?: number;
  totalTodos?: number;
  weeklyStudyMinutes?: number;
  subjectAvgProgress?: number;
}): StudentGamificationProfile {
  const overall = input.overallProgress ?? 0;
  const streak = input.streak ?? 0;
  const exams = input.examResultCount ?? 0;
  const quizzes = input.quizCount ?? 0;
  const weeklyMin = input.weeklyStudyMinutes ?? 0;

  const xp =
    Math.round(overall * 12) +
    streak * 25 +
    exams * 40 +
    quizzes * 15 +
    Math.min(weeklyMin, 600);

  const coins = Math.floor(xp / 8);
  const { level, levelProgress } = computeLevel(xp);

  const dailyGoalTotal = Math.max(input.totalTodos ?? 5, 1);
  const dailyGoalCompleted = input.completedTodos ?? 0;
  const dailyGoalPercent = Math.round((dailyGoalCompleted / dailyGoalTotal) * 100);

  const unlocked: BadgeId[] = [];
  if (streak >= 7) unlocked.push("streak_7");
  if (overall >= 75 || (input.subjectAvgProgress ?? 0) >= 80) unlocked.push("top_performer");
  if (dailyGoalPercent >= 80 && dailyGoalCompleted >= 3) unlocked.push("fast_learner");
  if (weeklyMin >= 600) unlocked.push("study_champion");
  if (quizzes >= 3 && overall >= 50) unlocked.push("quiz_master");
  if (xp >= 1000) unlocked.push("elite_learner");

  return {
    xp,
    coins,
    level,
    levelProgress,
    streak,
    longestStreak: input.longestStreak ?? streak,
    rank: input.rank ?? null,
    classRank: input.rank ?? null,
    dailyGoalPercent,
    dailyGoalCompleted,
    dailyGoalTotal,
    unlockedBadges: unlocked,
    weeklyStudyMinutes: weeklyMin,
  };
}

export function getBadgeDetails(ids: BadgeId[]) {
  return GAMIFICATION_BADGES.filter((b) => ids.includes(b.id));
}
