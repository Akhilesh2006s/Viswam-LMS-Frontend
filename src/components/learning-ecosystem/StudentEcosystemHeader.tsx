import { useMemo, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { computeGamificationProfile } from "@/lib/gamification/compute-profile";
import { fetchGamificationProfile, pingStudyStreak, type ServerGamificationProfile } from "@/lib/gamification/api";
import { StudentHero } from "./StudentHero";
import { GamificationStrip } from "./GamificationStrip";
import { SubjectJourneyCard } from "./SubjectJourneyCard";
import { AchievementBadges } from "./AchievementBadges";
import { LeaderboardPanel, type LeaderboardEntry } from "./LeaderboardPanel";

type StudentEcosystemHeaderProps = {
  displayName: string;
  educationStream?: string;
  overallProgress: number;
  studyStreak: { count: number } | null;
  stats: { rank?: number; examResultCount?: number };
  subjectProgress: Array<{ id?: string; name: string; progress: number }>;
  subjects: Array<{ _id?: string; id?: string; name: string }>;
  dashboardTodoStats: { completedTodos: number; totalTodos: number };
  weeklyStudyMinutes: number;
  rankingsPreview?: Array<{ studentName?: string; rank?: number; averageScore?: string | number }>;
};

export function StudentEcosystemHeader({
  displayName,
  educationStream,
  overallProgress,
  studyStreak,
  stats,
  subjectProgress,
  subjects,
  dashboardTodoStats,
  weeklyStudyMinutes,
  rankingsPreview = [],
}: StudentEcosystemHeaderProps) {
  const [, setLocation] = useLocation();
  const [serverProfile, setServerProfile] = useState<ServerGamificationProfile | null>(null);

  useEffect(() => {
    void pingStudyStreak();
    void fetchGamificationProfile().then(setServerProfile);
  }, []);

  const profile = useMemo(
    () =>
      computeGamificationProfile({
        overallProgress,
        streak: serverProfile?.streak ?? studyStreak?.count ?? 0,
        longestStreak: serverProfile?.longestStreak,
        rank: stats.rank ?? null,
        examResultCount: stats.examResultCount,
        quizCount: serverProfile?.quizzesPassed,
        completedTodos: dashboardTodoStats.completedTodos,
        totalTodos: dashboardTodoStats.totalTodos,
        weeklyStudyMinutes,
        subjectAvgProgress:
          subjectProgress.length > 0
            ? subjectProgress.reduce((s, x) => s + x.progress, 0) / subjectProgress.length
            : 0,
      }),
    [
      overallProgress,
      studyStreak,
      stats,
      dashboardTodoStats,
      weeklyStudyMinutes,
      subjectProgress,
      serverProfile,
    ],
  );

  const displayProfile = useMemo(() => {
    if (!serverProfile) return profile;
    return {
      ...profile,
      xp: Math.max(profile.xp, serverProfile.xp),
      coins: Math.max(profile.coins, serverProfile.coins),
      level: serverProfile.level,
      levelProgress: serverProfile.levelProgress,
      streak: serverProfile.streak,
      longestStreak: serverProfile.longestStreak,
      unlockedBadges: [
        ...new Set([...profile.unlockedBadges, ...(serverProfile.badges || [])]),
      ] as typeof profile.unlockedBadges,
    };
  }, [profile, serverProfile]);

  const journeySubjects = useMemo(() => {
    const fromProgress = subjectProgress.map((s) => ({
      id: s.id,
      name: s.name,
      progress: s.progress,
    }));
    if (fromProgress.length) return fromProgress;
    return subjects.slice(0, 6).map((s) => ({
      id: s._id || s.id,
      name: s.name,
      progress: 0,
    }));
  }, [subjectProgress, subjects]);

  const leaderboardEntries: LeaderboardEntry[] = rankingsPreview.slice(0, 5).map((r, i) => ({
    rank: r.rank ?? i + 1,
    name: r.studentName || "Student",
    score: typeof r.averageScore === "string" ? parseFloat(r.averageScore) : r.averageScore,
  }));

  return (
    <div className="space-y-5 sm:space-y-6">
      <StudentHero
        name={displayName.split(" ")[0]}
        stream={educationStream}
        profile={displayProfile}
        onContinueLearning={() => setLocation("/learning-paths")}
        onViewQuizzes={() => setLocation("/learning-paths")}
      />
      <GamificationStrip profile={displayProfile} />
      <div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Your subjects</h2>
        <p className="text-sm text-slate-500">Each subject is your personal learning app</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {journeySubjects.map((s) => (
            <SubjectJourneyCard
              key={s.id || s.name}
              subject={s}
              onClick={() => s.id && setLocation(`/subject/${s.id}`)}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AchievementBadges unlocked={displayProfile.unlockedBadges} />
        <LeaderboardPanel entries={leaderboardEntries} yourRank={displayProfile.rank} />
      </div>
    </div>
  );
}
