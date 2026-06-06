import { API_BASE_URL } from '@/lib/api-config';

/** Admin API base path; super-admin school workspace uses scoped routes. */
export function schoolAdminApiUrl(path: string, schoolAdminId?: string | null): string {
  const segment = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const base = schoolAdminId
    ? `${API_BASE_URL}/api/super-admin/schools/${schoolAdminId}`
    : `${API_BASE_URL}/api/admin`;
  return `${base}${segment}`;
}
