import { API_BASE_URL } from '@/lib/api-config';
import { schoolAdminApiUrl } from '@/lib/school-admin-api';

export type PeriodContentItem = {
  id: string;
  title: string;
  description?: string;
  type?: string;
  contentChannel?: string;
  fileUrl?: string;
  fileUrls?: string[];
  thumbnailUrl?: string;
  topic?: string;
  chapter?: string;
  subjectId?: string;
  subjectName?: string;
  classNumber?: string;
  sortOrder?: number;
};

export type SchoolPeriod = {
  id: string;
  productCode?: string;
  label: string;
  sortOrder: number;
  description?: string;
  classId?: string | null;
  isActive?: boolean;
  contents: PeriodContentItem[];
  contentCount?: number;
  completedContentIds?: string[];
  completedCount?: number;
  isPeriodComplete?: boolean;
  canMarkPeriodComplete?: boolean;
};

export type PeriodContentOption = {
  id: string;
  title: string;
  type?: string;
  contentChannel?: string;
  subjectName?: string;
  classNumber?: string;
  topic?: string;
};

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token || ''}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchAdminPeriods(
  schoolAdminId?: string | null,
  productCode?: string,
): Promise<SchoolPeriod[]> {
  const params = new URLSearchParams();
  if (productCode && productCode !== 'all') params.set('productCode', productCode);
  const qs = params.toString();
  const res = await fetch(
    `${schoolAdminApiUrl('/periods', schoolAdminId)}${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function searchPeriodContentOptions(
  query: string,
  schoolAdminId?: string | null,
): Promise<PeriodContentOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  const res = await fetch(
    `${schoolAdminApiUrl('/periods/content-options', schoolAdminId)}?${params}`,
    { headers: authHeaders() },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createPeriod(
  payload: { label: string; description?: string; classId?: string | null },
  schoolAdminId?: string | null,
): Promise<SchoolPeriod | null> {
  const res = await fetch(schoolAdminApiUrl('/periods', schoolAdminId), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create period');
  return json.data || null;
}

export async function updatePeriod(
  id: string,
  payload: Partial<{ label: string; description: string; classId: string | null; sortOrder: number }>,
  schoolAdminId?: string | null,
): Promise<SchoolPeriod | null> {
  const res = await fetch(schoolAdminApiUrl(`/periods/${id}`, schoolAdminId), {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update period');
  return json.data || null;
}

export async function deletePeriod(id: string, schoolAdminId?: string | null): Promise<void> {
  const res = await fetch(schoolAdminApiUrl(`/periods/${id}`, schoolAdminId), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Failed to delete period');
}

export async function setPeriodContents(
  periodId: string,
  contentIds: string[],
  schoolAdminId?: string | null,
): Promise<SchoolPeriod | null> {
  const res = await fetch(schoolAdminApiUrl(`/periods/${periodId}/contents`, schoolAdminId), {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ contentIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to save content');
  return json.data || null;
}

export async function fetchStudentPeriods(): Promise<SchoolPeriod[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/student/periods`, { headers: authHeaders() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function toggleAdminPeriodContent(
  periodId: string,
  contentId: string,
  completed: boolean,
): Promise<SchoolPeriod[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/periods/${periodId}/progress`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ contentId, completed }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update');
  return json.data || [];
}

export async function markAdminPeriodComplete(periodId: string): Promise<SchoolPeriod[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/periods/${periodId}/mark-complete`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to mark complete');
  return json.data || [];
}

export async function restudyAdminPeriod(periodId: string): Promise<SchoolPeriod[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/periods/${periodId}/restudy`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to reset');
  return json.data || [];
}
