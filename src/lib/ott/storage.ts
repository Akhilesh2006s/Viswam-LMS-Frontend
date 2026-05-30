import type { OttWatchProgress } from "./types";

const PROGRESS_KEY = "viswam_ott_progress";
const WATCHLIST_KEY = "viswam_ott_watchlist";
const DOWNLOADS_KEY = "viswam_ott_downloads";

export function getAllProgress(): Record<string, OttWatchProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getWatchProgress(videoId: string): OttWatchProgress | null {
  return getAllProgress()[videoId] ?? null;
}

export function saveWatchProgress(entry: OttWatchProgress) {
  const all = getAllProgress();
  all[entry.videoId] = entry;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function getContinueWatchingIds(): string[] {
  const all = getAllProgress();
  return Object.values(all)
    .filter((p) => !p.completed && p.positionSeconds > 5)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((p) => p.videoId);
}

export function getWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlist(videoId: string): boolean {
  const list = getWatchlist();
  const idx = list.indexOf(videoId);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift(videoId);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  return true;
}

export function isInWatchlist(videoId: string): boolean {
  return getWatchlist().includes(videoId);
}

export type OttDownloadItem = {
  videoId: string;
  title: string;
  url: string;
  addedAt: string;
  sizeLabel?: string;
};

export function getDownloads(): OttDownloadItem[] {
  try {
    const raw = localStorage.getItem(DOWNLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addDownload(item: OttDownloadItem) {
  const list = getDownloads().filter((d) => d.videoId !== item.videoId);
  list.unshift(item);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list.slice(0, 50)));
}

export function removeDownload(videoId: string) {
  const list = getDownloads().filter((d) => d.videoId !== videoId);
  localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
}
