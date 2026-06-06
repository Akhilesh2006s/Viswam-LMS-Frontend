import { API_BASE_URL } from "@/lib/api-config";
import { schoolAdminApiUrl } from "@/lib/school-admin-api";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

export type TeacherProductSlot = {
  classNumber: string;
  label: string;
  subjects: string[];
  tag: "subjects" | "categories";
};

export type TeacherProductScope = {
  teacherId: string;
  products: {
    productCode: string;
    productName: string;
    structureType: "class_based" | "level_based";
    slots: TeacherProductSlot[];
  }[];
};

export type TeacherLearningSubject = {
  _id: string;
  name: string;
  classNumber?: string;
  productCode?: string;
  asliPrepContent?: Array<{
    _id: string;
    title?: string;
    fileUrl?: string;
    contentType?: string;
    contentChannel?: string;
    classNumber?: string;
    productCode?: string;
  }>;
};

export async function fetchTeacherDashboard(): Promise<{
  stats?: Record<string, number>;
  productScope?: TeacherProductScope | null;
  assignedClasses?: unknown[];
  teacherSubjects?: unknown[];
} | null> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/dashboard`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchTeacherProductScope(): Promise<TeacherProductScope | null> {
  const res = await fetch(`${API_BASE_URL}/api/teacher/product-scope`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchTeacherLearningPaths(
  subjectId?: string,
): Promise<TeacherLearningSubject[]> {
  const q = subjectId && subjectId !== "all" ? `?subject=${encodeURIComponent(subjectId)}` : "";
  const res = await fetch(`${API_BASE_URL}/api/teacher/learning-paths/content${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

export async function fetchTeacherPeriods(productCode?: string) {
  const params = new URLSearchParams();
  if (productCode && productCode !== "all") params.set("productCode", productCode);
  const qs = params.toString();
  const res = await fetch(`${API_BASE_URL}/api/teacher/periods${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function saveTeacherProductAssignments(
  teacherId: string,
  productAssignments: { productCode: string; classLicenses: { classNumber: string; subjects: string[] }[] }[],
  schoolAdminId?: string | null,
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(
    schoolAdminApiUrl(`/teachers/${teacherId}/product-assignments`, schoolAdminId),
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ productAssignments }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Save failed" };
  return { ok: true, message: json.message };
}
