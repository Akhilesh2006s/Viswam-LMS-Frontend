import { API_BASE_URL } from "@/lib/api-config";
import type { BadgeId } from "./constants";

export type ServerGamificationProfile = {
  xp: number;
  coins: number;
  level: number;
  levelProgress: number;
  streak: number;
  longestStreak: number;
  badges: BadgeId[];
  quizzesPassed: number;
  videosCompleted: number;
  overallProgress: number;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

export async function fetchGamificationProfile(): Promise<ServerGamificationProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/student/gamification-profile`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function pingStudyStreak(): Promise<{ current: number; longest: number } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/student/dashboard/streak/ping`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const s = json.streak;
    return s ? { current: s.current, longest: s.longest } : null;
  } catch {
    return null;
  }
}
