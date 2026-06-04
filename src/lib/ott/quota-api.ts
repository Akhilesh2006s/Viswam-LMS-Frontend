import { API_BASE_URL } from "@/lib/api-config";

export const DEFAULT_SCHOOL_MONTHLY_DOWNLOAD_GB = 10;

export type SchoolOttQuota = {
  monthKey: string;
  schoolMonthlyDownloadGB: number;
  schoolBytesUsed: number;
  schoolBytesRemaining: number;
  schoolBytesCap?: number;
  downloadsEnabled?: boolean;
  canDownloadMore?: boolean;
  defaultStudentMonthlyDownloadGB?: number | null;
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

/** School admin — read-only monthly usage. */
export async function fetchAdminSchoolOttQuota(): Promise<SchoolOttQuota | null> {
  const res = await fetch(`${API_BASE_URL}/api/admin/ott/quota`, { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
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
