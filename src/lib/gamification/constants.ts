export type BadgeId =
  | "top_performer"
  | "streak_7"
  | "fast_learner"
  | "study_champion"
  | "quiz_master"
  | "elite_learner"
  | "video_master";

export type GamificationBadge = {
  id: BadgeId;
  emoji: string;
  title: string;
  description: string;
};

export const GAMIFICATION_BADGES: GamificationBadge[] = [
  { id: "top_performer", emoji: "🏆", title: "Top Performer", description: "Rank in top 10% of your class" },
  { id: "streak_7", emoji: "🔥", title: "7 Day Streak", description: "Study 7 days in a row" },
  { id: "fast_learner", emoji: "⚡", title: "Fast Learner", description: "Complete 5 lessons in a week" },
  { id: "study_champion", emoji: "📚", title: "Study Champion", description: "10+ hours logged this week" },
  { id: "quiz_master", emoji: "🎯", title: "Quiz Master", description: "Score 80%+ on 3 quizzes" },
  { id: "elite_learner", emoji: "💎", title: "Elite Learner", description: "Reach 1,000 XP" },
  { id: "video_master", emoji: "🎬", title: "Video Master", description: "Complete 5 OTT lessons" },
];

export const SUBJECT_THEMES: Record<string, { gradientClass: string; accent: string }> = {
  mathematics: { gradientClass: "from-[#0B1F3A] to-[#1e4a7a]", accent: "#00A86B" },
  math: { gradientClass: "from-[#0B1F3A] to-[#1e4a7a]", accent: "#00A86B" },
  science: { gradientClass: "from-[#065f46] to-[#00A86B]", accent: "#D4AF37" },
  english: { gradientClass: "from-[#4c1d95] to-[#7c3aed]", accent: "#00A86B" },
  abacus: { gradientClass: "from-[#92400e] to-[#D4AF37]", accent: "#0B1F3A" },
  default: { gradientClass: "from-[#0B1F3A] to-[#153456]", accent: "#00A86B" },
};

export function subjectTheme(name: string) {
  const key = String(name || "").toLowerCase().replace(/\s+/g, "_");
  for (const [k, v] of Object.entries(SUBJECT_THEMES)) {
    if (key.includes(k)) return v;
  }
  return SUBJECT_THEMES.default;
}
