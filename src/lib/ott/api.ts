import { API_BASE_URL } from "@/lib/api-config";
import type { OttWatchProgress } from "./types";
import { getAllProgress, saveWatchProgress } from "./storage";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

function mapServerProgress(data: Record<string, unknown>): Record<string, OttWatchProgress> {
  const out: Record<string, OttWatchProgress> = {};
  for (const [id, raw] of Object.entries(data || {})) {
    const row = raw as Record<string, unknown>;
    out[id] = {
      videoId: String(row.videoId || id),
      positionSeconds: Number(row.positionSeconds) || 0,
      durationSeconds: Number(row.durationSeconds) || 0,
      updatedAt:
        typeof row.updatedAt === "string"
          ? row.updatedAt
          : row.updatedAt
            ? new Date(row.updatedAt as string | number).toISOString()
            : new Date().toISOString(),
      completed: !!row.completed,
    };
  }
  return out;
}

export async function fetchServerProgressMap(): Promise<Record<string, OttWatchProgress>> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/progress`, { headers: authHeaders() });
  if (!res.ok) return {};
  const json = await res.json();
  return mapServerProgress(json.data || {});
}

export async function postWatchProgress(payload: {
  contentId: string;
  positionSeconds: number;
  durationSeconds: number;
  watchTimeDelta?: number;
  title?: string;
  subjectId?: string;
}): Promise<{ progress?: OttWatchProgress; xpAwarded?: number } | null> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/progress`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const p = json.data?.progress;
  if (p) {
    saveWatchProgress({
      videoId: String(p.videoId || payload.contentId),
      positionSeconds: p.positionSeconds ?? payload.positionSeconds,
      durationSeconds: p.durationSeconds ?? payload.durationSeconds,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      completed: !!p.completed,
    });
  }
  return { progress: p, xpAwarded: json.data?.xpAwarded };
}

export async function fetchServerContinueWatchingIds(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/continue-watching`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(String);
}

export async function fetchServerWatchlistIds(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/watchlist`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map(String);
}

export async function toggleServerWatchlist(contentId: string): Promise<boolean | null> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/watchlist/toggle`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contentId }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return !!json.data?.inList;
}

export type StudentOttAnalytics = {
  totalWatchMinutes: number;
  videosStarted: number;
  videosCompleted: number;
  inProgress: number;
  completionRate: number;
  streak?: number;
  gamification?: { xp?: number; level?: number };
};

export async function fetchStudentOttAnalytics(): Promise<StudentOttAnalytics | null> {
  const res = await fetch(`${API_BASE_URL}/api/student/ott/analytics`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export type AdminOttAnalytics = {
  activeStudents: number;
  totalStudents: number;
  totalWatchMinutes: number;
  videosCompleted: number;
  engagementRate: number;
  topLearners: { studentId: string; name: string; watchMinutes: number; videosCompleted: number }[];
};

export async function fetchAdminOttAnalytics(): Promise<AdminOttAnalytics | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/analytics`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export type PlatformOttAnalytics = {
  totalStudents: number;
  totalWatchSessions: number;
  videosCompleted: number;
  totalWatchHours: number;
  completionRate: number;
  recentActivity: {
    studentName: string;
    title?: string;
    progressPercent?: number;
    lastWatchedAt?: string;
  }[];
};

export async function fetchPlatformOttAnalytics(): Promise<PlatformOttAnalytics | null> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/ott/analytics`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

/** Merge server progress into localStorage; returns server continue + watchlist ids. */
export async function hydrateOttFromServer(): Promise<{
  continueIds: string[];
  watchlistIds: string[];
}> {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return { continueIds: [], watchlistIds: [] };
  }

  const [serverMap, continueIds, watchlistIds] = await Promise.all([
    fetchServerProgressMap(),
    fetchServerContinueWatchingIds(),
    fetchServerWatchlistIds(),
  ]);

  const local = getAllProgress();
  const merged = { ...local };
  for (const [id, server] of Object.entries(serverMap)) {
    const localEntry = merged[id];
    const serverTime = new Date(server.updatedAt).getTime();
    const localTime = localEntry ? new Date(localEntry.updatedAt).getTime() : 0;
    if (!localEntry || serverTime >= localTime) {
      merged[id] = server;
    }
  }
  localStorage.setItem("viswam_ott_progress", JSON.stringify(merged));
  if (watchlistIds.length) {
    localStorage.setItem("viswam_ott_watchlist", JSON.stringify(watchlistIds));
  }

  return { continueIds, watchlistIds };
}
