import { API_BASE_URL } from '@/lib/api-config';

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

export type ProductPeriod = {
  id: string;
  productCode: string;
  label: string;
  sortOrder: number;
  description?: string;
  isActive?: boolean;
  contents: PeriodContentItem[];
  contentCount?: number;
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

export async function fetchProductPeriods(productCode: string): Promise<ProductPeriod[]> {
  const params = new URLSearchParams({ productCode });
  const res = await fetch(`${API_BASE_URL}/api/super-admin/periods?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export type PeriodAssignSource = 'studio' | 'ott';

export async function searchProductPeriodContentOptions(
  productCode: string,
  query: string,
  opts?: { classNumber?: string; subjectId?: string; source?: PeriodAssignSource },
): Promise<PeriodContentOption[]> {
  const params = new URLSearchParams({ productCode });
  if (query.trim()) params.set('q', query.trim());
  if (opts?.classNumber) params.set('classNumber', opts.classNumber);
  if (opts?.subjectId) params.set('subjectId', opts.subjectId);
  if (opts?.source) params.set('source', opts.source);
  const res = await fetch(`${API_BASE_URL}/api/super-admin/periods/content-options?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createProductPeriod(payload: {
  productCode: string;
  label: string;
  description?: string;
}): Promise<ProductPeriod | null> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/periods`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create period');
  return json.data || null;
}

export async function deleteProductPeriod(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/periods/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Failed to delete period');
}

export async function setProductPeriodContents(
  periodId: string,
  productCode: string,
  contentIds: string[],
): Promise<ProductPeriod | null> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/periods/${periodId}/contents`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ productCode, contentIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to save content');
  return json.data || null;
}
