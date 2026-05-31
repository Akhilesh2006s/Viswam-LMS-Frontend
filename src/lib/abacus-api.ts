import { ABACUS_API_BASE_URL } from '@/lib/api-config';

export type AbacusCategory = {
  name: string;
  levels: string[];
};

export type AbacusSchool = {
  id: string;
  name: string;
  schoolCode: string;
  contactPerson: string;
  phone: string;
  place: string;
  pin: string;
  schoolDetails: Record<string, string>;
  notes: string;
  isActive: boolean;
  stats?: { teachers: number; students: number };
};

export type AbacusTeacher = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  category: string;
  level: string;
  schoolId: string;
};

export type AbacusStudent = {
  id: string;
  fullName: string;
  email: string;
  className: string;
  category: string;
  level: string;
  schoolId: string;
  teacherId?: string | null;
  teacherName?: string;
};

export type AbacusTeacherStudentCandidate = {
  id: string;
  fullName: string;
  email: string;
  className: string;
  category: string;
  level: string;
  assigned: boolean;
  teacherId?: string | null;
  teacherName?: string;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function abacusPortalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ABACUS_API_BASE_URL) {
    throw new Error('Abacus API URL is not configured (VITE_ABACUS_API_URL)');
  }
  const res = await fetch(`${ABACUS_API_BASE_URL}/api${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Abacus API error (${res.status})`);
  }
  return json as T;
}

export type AbacusTeacherDashboard = {
  teacher: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    category: string;
    level: string;
  };
  school: { id: string; name: string; schoolCode: string; place: string } | null;
  students: Array<{
    id: string;
    fullName: string;
    email: string;
    className: string;
    category: string;
    level: string;
  }>;
  stats: { students: number };
};

export type AbacusStudentDashboard = {
  student: {
    id: string;
    fullName: string;
    email: string;
    className: string;
    category: string;
    level: string;
  };
  school: { id: string; name: string; schoolCode: string; place: string } | null;
};

export type AbacusPracticeResult = {
  id: string;
  mode: string;
  category: string;
  level_name: string;
  level_rank: number;
  score: number;
  total: number;
  time_taken: number | null;
  created_at: string;
  question_set_id?: string | null;
};

export type AbacusQuestionItem = {
  index: number;
  type: string;
  numbers: Array<number | string>;
  ops: string[];
  total: number;
};

export type AbacusQuestionSet = {
  id: string;
  category: string;
  levelName: string;
  levelRank: number;
  mode: string;
  questions: AbacusQuestionItem[];
  createdAt: string;
  resultId?: string | null;
};

export type AbacusPortalProfile = {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    category: string;
    level: string;
    className?: string;
    phone?: string;
  };
  school: { id: string; name: string; schoolCode: string; place?: string } | null;
  student: {
    id: string;
    username: string;
    name: string;
    email: string;
    category: string;
    level: string;
    rank: number;
    role: string;
  };
  students?: Array<{
    id: string;
    fullName: string;
    email: string;
    className: string;
    category: string;
    level: string;
  }>;
  stats?: { students: number };
};

export async function fetchAbacusPortalMe(): Promise<AbacusPortalProfile> {
  const json = await abacusPortalFetch<{ data: AbacusPortalProfile }>('/portal/me');
  return json.data;
}

export async function fetchAbacusPracticeResults(): Promise<AbacusPracticeResult[]> {
  const json = await abacusPortalFetch<{ data: AbacusPracticeResult[] }>('/portal/results');
  return json.data || [];
}

export async function fetchAbacusTeacherDashboard(): Promise<AbacusTeacherDashboard> {
  const json = await abacusPortalFetch<{ data: AbacusTeacherDashboard }>('/portal/teacher/dashboard');
  return json.data;
}

export async function fetchAbacusStudentDashboard(): Promise<AbacusStudentDashboard> {
  const json = await abacusPortalFetch<{ data: AbacusStudentDashboard }>('/student/dashboard');
  return json.data;
}

export async function generateAbacusQuestionSet(body: {
  category: string;
  level: string;
  mode?: string;
  count?: number;
}): Promise<AbacusQuestionSet> {
  const json = await abacusPortalFetch<{ data: AbacusQuestionSet }>('/portal/questions/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchAbacusQuestionSet(id: string): Promise<AbacusQuestionSet> {
  const json = await abacusPortalFetch<{ data: AbacusQuestionSet }>(`/portal/questions/${id}`);
  return json.data;
}

async function abacusFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ABACUS_API_BASE_URL) {
    throw new Error('Abacus API URL is not configured (VITE_ABACUS_API_URL)');
  }
  const res = await fetch(`${ABACUS_API_BASE_URL}/api/abacus${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `Abacus API error (${res.status})`);
  }
  return json as T;
}

/** Login via standalone Abacus backend (@abacus.com teachers/students). */
export async function abacusLogin(email: string, password: string) {
  if (!ABACUS_API_BASE_URL) {
    throw new Error('Abacus API URL is not configured');
  }
  const res = await fetch(`${ABACUS_API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data as { success: boolean; token: string; user: Record<string, unknown> };
}

export function isAbacusEmail(email: string): boolean {
  return /@abacus\.com$/i.test(String(email || '').trim());
}

export async function fetchAbacusCatalog(): Promise<AbacusCategory[]> {
  const json = await abacusFetch<{ data: AbacusCategory[] }>('/catalog');
  return json.data || [];
}

export async function addAbacusCategory(name: string): Promise<AbacusCategory[]> {
  const json = await abacusFetch<{ data: AbacusCategory[] }>('/catalog/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return json.data || [];
}

export async function addAbacusLevel(category: string, level: string): Promise<AbacusCategory[]> {
  const json = await abacusFetch<{ data: AbacusCategory[] }>('/catalog/levels', {
    method: 'POST',
    body: JSON.stringify({ category, level }),
  });
  return json.data || [];
}

export async function fetchAbacusSchools(): Promise<AbacusSchool[]> {
  const json = await abacusFetch<{ data: AbacusSchool[] }>('/schools');
  return json.data || [];
}

export async function createAbacusSchool(body: Partial<AbacusSchool>): Promise<AbacusSchool> {
  const json = await abacusFetch<{ data: AbacusSchool }>('/schools', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchAbacusTeachers(schoolId: string): Promise<AbacusTeacher[]> {
  const json = await abacusFetch<{ data: AbacusTeacher[] }>(`/schools/${schoolId}/teachers`);
  return json.data || [];
}

export async function createAbacusTeacher(
  schoolId: string,
  body: Record<string, string>,
): Promise<AbacusTeacher> {
  const json = await abacusFetch<{ data: AbacusTeacher }>(`/schools/${schoolId}/teachers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateAbacusTeacher(
  id: string,
  body: Record<string, string>,
): Promise<AbacusTeacher> {
  const json = await abacusFetch<{ data: AbacusTeacher }>(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function uploadAbacusTeachersCsv(
  schoolId: string,
  file: File,
): Promise<{ created: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const json = await abacusFetch<{ data: { created: number; errors: string[] } }>(
    `/schools/${schoolId}/teachers/csv`,
    { method: 'POST', body: form },
  );
  return json.data;
}

export async function deleteAbacusTeacher(id: string): Promise<void> {
  await abacusFetch(`/teachers/${id}`, { method: 'DELETE' });
}

export async function fetchAbacusTeacherStudents(
  teacherId: string,
): Promise<AbacusTeacherStudentCandidate[]> {
  const json = await abacusFetch<{ data: AbacusTeacherStudentCandidate[] }>(
    `/teachers/${teacherId}/students`,
  );
  return json.data || [];
}

export async function assignAbacusStudentsToTeacher(
  teacherId: string,
  studentIds: string[],
): Promise<AbacusStudent[]> {
  const json = await abacusFetch<{ data: AbacusStudent[] }>(`/teachers/${teacherId}/students`, {
    method: 'PUT',
    body: JSON.stringify({ studentIds }),
  });
  return json.data || [];
}

export async function fetchAbacusStudents(schoolId: string): Promise<AbacusStudent[]> {
  const json = await abacusFetch<{ data: AbacusStudent[] }>(`/schools/${schoolId}/students`);
  return json.data || [];
}

export async function createAbacusStudent(
  schoolId: string,
  body: Record<string, string>,
): Promise<AbacusStudent> {
  const json = await abacusFetch<{ data: AbacusStudent }>(`/schools/${schoolId}/students`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateAbacusStudent(
  id: string,
  body: Record<string, string>,
): Promise<AbacusStudent> {
  const json = await abacusFetch<{ data: AbacusStudent }>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function uploadAbacusStudentsCsv(
  schoolId: string,
  file: File,
): Promise<{ created: number; errors: string[] }> {
  const form = new FormData();
  form.append('file', file);
  const json = await abacusFetch<{ data: { created: number; errors: string[] } }>(
    `/schools/${schoolId}/students/csv`,
    { method: 'POST', body: form },
  );
  return json.data;
}

export async function deleteAbacusStudent(id: string): Promise<void> {
  await abacusFetch(`/students/${id}`, { method: 'DELETE' });
}

export function suggestAbacusEmail(name: string): string {
  const slug = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return slug ? `${slug}@abacus.com` : '';
}

export const ABACUS_CSV_TEACHER_HEADERS = 'name,email,password,phone,category,level';
export const ABACUS_CSV_STUDENT_HEADERS = 'name,email,password,class,category,level';
