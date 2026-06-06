import { API_BASE_URL } from "@/lib/api-config";

export const DEFAULT_SCHOOL_MONTHLY_DOWNLOAD_GB = 10;

export type SchoolOttQuota = {
  monthKey: string;
  schoolMonthlyDownloadGB: number;
  userMonthlyDownloadGB?: number;
  perUserMonthlyDownloadGB?: number;
  schoolAggregateBytesUsed?: number;
  schoolBytesUsed: number;
  schoolBytesRemaining: number;
  schoolBytesCap?: number | null;
  downloadsEnabled?: boolean;
  canDownloadMore?: boolean;
  defaultStudentMonthlyDownloadGB?: number | null;
  teacherBytesUsed?: number;
  adminBytesUsed?: number;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

export function formatOttBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function quotaUsedPercent(quota: SchoolOttQuota): number {
  const cap = quota.schoolBytesCap ?? quota.schoolMonthlyDownloadGB * 1024 ** 3;
  if (!cap) return 0;
  return Math.min(100, (quota.schoolBytesUsed / cap) * 100);
}

export function resolveOttDownloadHref(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
}

/** School admin — read-only monthly usage. */
export async function fetchAdminSchoolOttQuota(): Promise<SchoolOttQuota | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/quota`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchAdminOttDownloads(): Promise<OttDownloadRecord[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/downloads`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchAdminDesktopAppInfo(): Promise<DesktopAppInfo | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/desktop-app`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function requestAdminOttDownload(contentId: string): Promise<{
  ok: boolean;
  message?: string;
  data?: {
    alreadyDownloaded?: boolean;
    downloadUrl?: string;
    bytes?: number;
    title?: string;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/downloads/request`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contentId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Download not allowed" };
  return { ok: true, data: json.data };
}

export async function confirmAdminOttDownload(
  contentId: string,
  bytes: number,
): Promise<{ ok: boolean; message?: string; quota?: SchoolOttQuota | null }> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/downloads/confirm`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contentId, bytes }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Could not confirm download" };
  return { ok: true, quota: json.data?.quota || null };
}

/** Super admin — per-school usage. */
export async function fetchSuperAdminSchoolOttQuota(schoolId: string): Promise<SchoolOttQuota | null> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/ott/schools/${schoolId}/quota`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

/** Super admin — reset counted downloads for current month. */
export async function resetSuperAdminSchoolOttQuota(
  schoolId: string,
): Promise<{ ok: boolean; message?: string; quota?: SchoolOttQuota | null }> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/ott/schools/${schoolId}/quota/reset`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Reset failed" };
  return {
    ok: true,
    message: json.message,
    quota: json.data?.quota || null,
  };
}

export type TeacherOttVideo = {
  _id: string;
  title: string;
  description?: string;
  size?: number;
  classNumber?: string;
  subjectName?: string;
  productCode?: string;
  thumbnailUrl?: string;
  duration?: number;
};

export type OttDownloadRecord = {
  _id: string;
  contentId: string;
  title?: string;
  bytes: number;
  monthKey: string;
  createdAt?: string;
};

/** @deprecated use OttDownloadRecord */
export type TeacherOttDownload = OttDownloadRecord;

export type DesktopAppInfo = {
  available: boolean;
  downloadUrl: string;
  fileName: string;
  description: string;
};

/** Teacher portal — school monthly GB usage (read-only). */
export async function fetchTeacherOttQuota(): Promise<SchoolOttQuota | null> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/quota`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchTeacherOttCatalog(): Promise<TeacherOttVideo[]> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/catalog`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchTeacherOttDownloads(): Promise<TeacherOttDownload[]> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/downloads`, { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchDesktopAppInfo(): Promise<DesktopAppInfo | null> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/desktop-app`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function requestTeacherOttDownload(contentId: string): Promise<{
  ok: boolean;
  message?: string;
  data?: {
    alreadyDownloaded?: boolean;
    downloadUrl?: string;
    bytes?: number;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/downloads/request`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contentId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Download not allowed" };
  return { ok: true, data: json.data };
}

export async function confirmTeacherOttDownload(
  contentId: string,
  bytes: number,
): Promise<{ ok: boolean; message?: string; quota?: SchoolOttQuota | null }> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/ott/downloads/confirm`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ contentId, bytes }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Could not confirm download" };
  return { ok: true, quota: json.data?.quota || null };
}
