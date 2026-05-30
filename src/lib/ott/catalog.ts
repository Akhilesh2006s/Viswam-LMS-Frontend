import { API_BASE_URL } from "@/lib/api-config";
import { resolveMediaUrl } from "@/lib/media-url";
import { normalizeVideoLike } from "@/lib/eduott-normalize";
import { getEduOTTThumbnailUrl, resolveContentDurationSeconds } from "@/lib/eduott-video-utils";
import type { OttContentSection, OttCourse, OttVideo } from "./types";
import { getContinueWatchingIds } from "./storage";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

export function mapApiContentToOttVideo(content: any): OttVideo {
  const subjectName = content.subject?.name || content.subject || "General";
  const subjectId = content.subject?._id || content.subjectId || content.subject;
  const classNum =
    content.classNumber != null && String(content.classNumber).trim() !== ""
      ? String(content.classNumber).trim()
      : content.subject?.classNumber != null
        ? String(content.subject.classNumber).trim()
        : "";
  const norm = normalizeVideoLike({ subjectName, classNumber: classNum });
  const durationSeconds = resolveContentDurationSeconds({
    duration: content.duration,
    durationSeconds: content.durationSeconds,
  });

  let videoFileUrl = content.fileUrl;
  if (videoFileUrl && !videoFileUrl.startsWith("http") && !videoFileUrl.startsWith("//")) {
    videoFileUrl = videoFileUrl.startsWith("/")
      ? `${API_BASE_URL}${videoFileUrl}`
      : `${API_BASE_URL}/${videoFileUrl}`;
  }

  const isYt = !!(
    videoFileUrl &&
    (videoFileUrl.includes("youtube.com") || videoFileUrl.includes("youtu.be"))
  );

  const thumbResolved =
    getEduOTTThumbnailUrl({
      thumbnailUrl: content.thumbnailUrl,
      fileUrl: videoFileUrl,
      videoUrl: videoFileUrl,
      youtubeUrl: isYt ? videoFileUrl : undefined,
    }) || undefined;

  return {
    id: String(content._id || content.id),
    title: content.title || "Untitled",
    description: content.description || "",
    durationSeconds,
    thumbnailUrl: thumbResolved,
    videoUrl: isYt ? undefined : videoFileUrl,
    youtubeUrl: isYt ? videoFileUrl : undefined,
    isYouTubeVideo: isYt,
    views: content.views || 0,
    createdAt: content.createdAt || new Date().toISOString(),
    subjectId: subjectId ? String(subjectId) : undefined,
    subjectName: norm.subject || subjectName,
    classLabel: norm.class || classNum || "",
    chapter: content.chapter,
    module: content.module,
    teacherName: content.teacher?.fullName || content.createdBy?.fullName,
  };
}

export type OttCatalogResult = {
  videos: OttVideo[];
  message?: string;
};

export async function fetchOttCatalog(): Promise<OttCatalogResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/student/asli-prep-content?type=Video&channel=ott`, {
      headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        videos: [],
        message: json.message || "Could not load OTT videos. Try signing in again.",
      };
    }
    const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    const videos = list.map(mapApiContentToOttVideo);
    return { videos, message: json.message };
  } catch {
    return { videos: [], message: "Network error while loading videos." };
  }
}

function matchesKeyword(v: OttVideo, ...keywords: string[]): boolean {
  const hay = `${v.title} ${v.subjectName} ${v.description || ""}`.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}

export function buildCourses(videos: OttVideo[]): OttCourse[] {
  const bySubject = new Map<string, OttVideo[]>();
  for (const v of videos) {
    const key = v.subjectId || v.subjectName;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(v);
  }
  return Array.from(bySubject.entries()).map(([id, vids]) => ({
    id,
    name: vids[0]?.subjectName || "Course",
    videos: vids,
    totalLessons: vids.length,
    avgProgress: 0,
  }));
}

export function buildHomeSections(
  videos: OttVideo[],
  continueWatchingIds?: string[],
): OttContentSection[] {
  const ids =
    continueWatchingIds && continueWatchingIds.length > 0
      ? continueWatchingIds
      : getContinueWatchingIds();
  const continueIds = new Set(ids);
  const byContinue = videos.filter((v) => continueIds.has(v.id));
  const sortedViews = [...videos].sort((a, b) => b.views - a.views);
  const sortedRecent = [...videos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const abacus = videos.filter((v) => matchesKeyword(v, "abacus"));
  const financial = videos.filter((v) => matchesKeyword(v, "financial", "money", "literacy"));
  const competition = videos.filter((v) =>
    matchesKeyword(v, "competition", "olympiad", "rank", "boost"),
  );

  const subjectCounts = new Map<string, OttVideo[]>();
  for (const v of videos) {
    const k = v.subjectName;
    if (!subjectCounts.has(k)) subjectCounts.set(k, []);
    subjectCounts.get(k)!.push(v);
  }
  const popularSubjects = [...subjectCounts.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .flatMap(([, vids]) => vids.slice(0, 2))
    .slice(0, 12);

  return [
    { id: "continue", title: "Continue Watching", subtitle: "Pick up where you left off", videos: byContinue.slice(0, 12) },
    { id: "recommended", title: "Recommended For You", subtitle: "Personalized for your journey", videos: videos.slice(0, 12) },
    { id: "trending", title: "Trending Courses", subtitle: "Most watched this week", videos: sortedViews.slice(0, 12) },
    { id: "recent", title: "Recently Added", subtitle: "Fresh on VISWAM OTT", videos: sortedRecent.slice(0, 12) },
    { id: "popular-subjects", title: "Popular Subjects", videos: popularSubjects },
    { id: "abacus", title: "Abacus Special Programs", subtitle: "Level up your mental math", videos: abacus.length ? abacus : sortedViews.slice(0, 8) },
    { id: "financial", title: "Financial Literacy Programs", videos: financial.length ? financial : videos.slice(4, 12) },
    { id: "competition", title: "Competition Preparation", videos: competition.length ? competition : sortedViews.slice(2, 10) },
    { id: "featured", title: "Featured Courses", videos: sortedViews.slice(0, 10) },
    { id: "top-rated", title: "Top Rated Content", videos: sortedViews.slice(0, 10) },
    { id: "new-releases", title: "New Releases", videos: sortedRecent.slice(0, 10) },
  ].filter((s) => s.id === "continue" ? s.videos.length > 0 : s.videos.length > 0);
}

export function searchVideos(
  videos: OttVideo[],
  query: string,
  filters?: { subject?: string; classLabel?: string },
): OttVideo[] {
  const q = query.trim().toLowerCase();
  return videos.filter((v) => {
    if (filters?.subject && v.subjectName !== filters.subject) return false;
    if (filters?.classLabel && v.classLabel !== filters.classLabel) return false;
    if (!q) return true;
    return (
      v.title.toLowerCase().includes(q) ||
      v.subjectName.toLowerCase().includes(q) ||
      v.classLabel.toLowerCase().includes(q) ||
      (v.chapter || "").toLowerCase().includes(q) ||
      (v.teacherName || "").toLowerCase().includes(q)
    );
  });
}
