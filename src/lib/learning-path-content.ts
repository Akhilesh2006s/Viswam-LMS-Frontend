/** Shared helpers for Learning Paths (textbooks + YouTube + teacher videos). */

export type LearningPathItem = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  fileUrl?: string;
  youtubeUrl?: string;
  contentChannel?: string;
  subject?: string | { _id?: string; name?: string };
  createdAt?: string;
  date?: string;
};

export function getContentSubjectId(content: LearningPathItem): string | null {
  const subj = content?.subject;
  if (subj == null) return null;
  if (typeof subj === 'object' && subj._id != null) return String(subj._id);
  if (typeof subj === 'string' && subj.trim()) return subj.trim();
  return null;
}

export function contentPlaybackUrl(item: LearningPathItem): string {
  return String(item.fileUrl || item.youtubeUrl || '').trim();
}

export function isYoutubeContent(item: LearningPathItem): boolean {
  const url = contentPlaybackUrl(item).toLowerCase();
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export function getYouTubeEmbedUrl(rawUrl: string): string | null {
  const url = String(rawUrl || '').trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    let videoId = parsed.searchParams.get('v');
    if (!videoId && parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.replace(/^\//, '').split('/')[0] || null;
    }
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  } catch {
    return null;
  }
}

/** YouTube / learning_path videos (not Viswam OTT uploads). */
export function isLearningPathVideoContent(item: LearningPathItem): boolean {
  if (isDocumentContent(item)) return false;
  if (isOttVideoContent(item)) return false;
  return isVideoContent(item);
}

/** Uploaded stream files for Viswam OTT (not YouTube learning paths). */
export function isOttVideoContent(item: LearningPathItem): boolean {
  if (item.contentChannel !== 'ott') return false;
  if (isYoutubeContent(item)) return false;
  const url = contentPlaybackUrl(item).toLowerCase();
  if (url.includes('youtube.com') || url.includes('youtu.be')) return false;
  const t = String(item.type || '').toLowerCase();
  return t === 'video' || t === 'audio' || url.includes('/uploads/') || url.startsWith('http');
}

export function isVideoContent(item: LearningPathItem): boolean {
  if (isOttVideoContent(item)) return true;
  const t = String(item.type || '').toLowerCase();
  if (t === 'video' || t === 'audio') return true;
  if (item.contentChannel === 'learning_path') return isYoutubeContent(item) || t === 'video';
  return isYoutubeContent(item);
}

export function isDocumentContent(item: LearningPathItem): boolean {
  const t = String(item.type || '').toLowerCase();
  if (['textbook', 'workbook', 'material', 'homework'].includes(t)) return true;
  const url = contentPlaybackUrl(item).toLowerCase();
  if (url.endsWith('.pdf')) return true;
  if (item.contentChannel === 'curriculum' && !isYoutubeContent(item)) return true;
  return false;
}

export function mergeLearningPathItems(...lists: LearningPathItem[][]): LearningPathItem[] {
  const seen = new Set<string>();
  const out: LearningPathItem[] = [];
  for (const list of lists) {
    for (const row of list || []) {
      const id = String(row._id || row.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(row);
    }
  }
  return out.sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

/** Admin dashboard deep link into Viswam OTT player */
export function viswamOttWatchUrl(contentId: string): string {
  return `/edu-ott/watch/${encodeURIComponent(contentId)}`;
}

export function viswamOttAdminUrl(contentId?: string, subjectId?: string): string {
  const q = new URLSearchParams({ tab: "eduott" });
  if (contentId) q.set("watch", contentId);
  if (subjectId) q.set("subject", subjectId);
  return `/admin/dashboard?${q.toString()}`;
}

export function filterBySubjectIds(items: LearningPathItem[], subjectIds: string[]): LearningPathItem[] {
  const allowed = new Set(subjectIds.map(String));
  return items.filter((item) => {
    const sid = getContentSubjectId(item);
    return sid && allowed.has(sid);
  });
}
