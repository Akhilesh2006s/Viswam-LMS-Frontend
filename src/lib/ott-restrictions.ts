/** OTT school restrictions — hide lists + named rules (shared web + mobile). */

export type OttContentAccess = {
  mode?: "all" | "allowlist" | "blocklist";
  videos?: string[];
  classes?: string[];
  subjects?: string[];
  hiddenVideos?: string[];
  hiddenClasses?: string[];
  hiddenSubjects?: string[];
};

export type OttRestrictionRule = {
  id: string;
  name: string;
  enabled: boolean;
  hiddenVideoIds: string[];
  hiddenClassNumbers: string[];
  hiddenSubjectIds: string[];
};

export type OttStudentDownloadQuota = {
  userId: string;
  monthlyDownloadGB: number;
  label?: string;
};

export type OttRestrictionsPayload = {
  plan: string;
  status: string;
  limits?: Record<string, number> & {
    schoolMonthlyDownloadGB?: number;
    defaultStudentMonthlyDownloadGB?: number;
    quotaResetDayOfMonth?: number;
  };
  delivery?: { webStreaming?: boolean; mobileDownloads?: boolean };
  features?: { downloads?: boolean; hdStreaming?: boolean; analytics?: boolean };
  streaming?: { maxQuality?: string };
  contentAccess?: OttContentAccess;
  rules?: OttRestrictionRule[];
  studentDownloadQuotas?: OttStudentDownloadQuota[];
};

export function newRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyContentAccess(): OttContentAccess {
  return {
    mode: "blocklist",
    hiddenVideos: [],
    hiddenClasses: [],
    hiddenSubjects: [],
    videos: [],
    classes: [],
    subjects: [],
  };
}

export function ensureRestrictionsShape(raw: OttRestrictionsPayload | null): OttRestrictionsPayload | null {
  if (!raw) return null;
  return {
    ...raw,
    delivery: {
      webStreaming: false,
      mobileDownloads: true,
      ...raw.delivery,
    },
    studentDownloadQuotas: Array.isArray(raw.studentDownloadQuotas) ? raw.studentDownloadQuotas : [],
    contentAccess: {
      ...emptyContentAccess(),
      ...raw.contentAccess,
      hiddenVideos: [...(raw.contentAccess?.hiddenVideos || [])],
      hiddenClasses: [...(raw.contentAccess?.hiddenClasses || [])],
      hiddenSubjects: [...(raw.contentAccess?.hiddenSubjects || [])],
    },
    rules: Array.isArray(raw.rules) ? raw.rules.map((r) => ({ ...r, enabled: r.enabled !== false })) : [],
  };
}

export function isVideoHidden(
  videoId: string,
  contentAccess: OttContentAccess | undefined,
  rules: OttRestrictionRule[] | undefined,
): boolean {
  const id = String(videoId);
  const hidden = new Set<string>(contentAccess?.hiddenVideos?.map(String) || []);
  for (const rule of rules || []) {
    if (!rule.enabled) continue;
    rule.hiddenVideoIds?.forEach((v) => hidden.add(String(v)));
  }
  return hidden.has(id);
}

export function isClassHidden(
  classNumber: string,
  contentAccess: OttContentAccess | undefined,
  rules: OttRestrictionRule[] | undefined,
): boolean {
  const norm = normalizeClassKey(classNumber);
  if (!norm) return false;
  const hidden = new Set((contentAccess?.hiddenClasses || []).map(normalizeClassKey));
  for (const rule of rules || []) {
    if (!rule.enabled) continue;
    rule.hiddenClassNumbers?.forEach((c) => hidden.add(normalizeClassKey(c)));
  }
  return hidden.has(norm);
}

export function normalizeClassKey(c: string): string {
  const s = String(c || "")
    .trim()
    .replace(/^class\s+/i, "");
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

export function toggleInList(list: string[], id: string, on: boolean): string[] {
  const set = new Set(list.map(String));
  if (on) set.add(String(id));
  else set.delete(String(id));
  return [...set];
}

export type VideoForAccess = {
  _id: string;
  title: string;
  classNumber?: string;
  subject?: { _id?: string; name?: string };
};

export function groupVideosByClass(videos: VideoForAccess[]): { classKey: string; label: string; videos: VideoForAccess[] }[] {
  const map = new Map<string, VideoForAccess[]>();
  for (const v of videos) {
    const key = normalizeClassKey(String(v.classNumber || "other"));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    })
    .map(([classKey, vids]) => ({
      classKey,
      label: classKey === "other" ? "Other" : `Class ${classKey}`,
      videos: vids,
    }));
}
