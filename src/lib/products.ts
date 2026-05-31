import { API_BASE_URL } from "@/lib/api-config";
import { schoolAdminApiUrl } from "@/lib/school-admin-api";

export type ProductStructureType = "class_based" | "level_based";

export type SubjectsByClass = Record<string, string[]>;

export type Product = {
  _id?: string;
  code: string;
  name: string;
  description?: string;
  isPremium?: boolean;
  allowedContentTypes?: string[];
  structureType?: ProductStructureType;
  catalogClassNumbers?: string[];
  sameSubjectsForAllClasses?: boolean;
  catalogSubjects?: string[];
  subjectsByClass?: SubjectsByClass;
  catalogCategories?: string[];
  isActive?: boolean;
  sortOrder?: number;
};

export function normalizeClassNumber(value: string) {
  return String(value).replace(/\D/g, "") || String(value).trim();
}

function sortNumericStrings(nums: string[]) {
  return [...new Set(nums)].sort((a, b) => Number(a) - Number(b));
}

export function getProductLevelNumbers(product?: Product | null): string[] {
  if (!product || !isLevelBasedProduct(product)) return [];
  const nums = (product.catalogClassNumbers || [])
    .map(normalizeClassNumber)
    .filter(Boolean);
  return sortNumericStrings(nums);
}

export function getProductClassNumbers(product?: Product | null): string[] {
  if (!product) return [];
  const nums = (product.catalogClassNumbers || [])
    .map(normalizeClassNumber)
    .filter(Boolean);
  if (nums.length) return sortNumericStrings(nums);
  if (product.sameSubjectsForAllClasses === false && product.subjectsByClass) {
    return Object.keys(product.subjectsByClass)
      .map(normalizeClassNumber)
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b));
  }
  if (isLevelBasedProduct(product)) {
    const n = Math.max(1, (product.catalogCategories || []).length);
    return sortNumericStrings(
      Array.from({ length: Math.min(n, 12) }, (_, i) => String(i + 1)),
    );
  }
  const hay = `${product.code || ""} ${product.name || ""}`;
  if (/ABACUS/i.test(hay)) return ["1", "2", "3"];
  return [];
}

export function getSubjectsForClass(product?: Product | null, classNumber?: string): string[] {
  if (!product) return [];
  if (isLevelBasedProduct(product)) return product.catalogCategories || [];
  const cn = normalizeClassNumber(classNumber || "");
  if (product.sameSubjectsForAllClasses === false && cn && product.subjectsByClass?.[cn]?.length) {
    return product.subjectsByClass[cn];
  }
  return product.catalogSubjects || [];
}

export function isLevelBasedProduct(product?: Product | null) {
  return product?.structureType === "level_based";
}

export function getProductCatalogTags(product?: Product | null) {
  if (isLevelBasedProduct(product)) {
    return product?.catalogCategories || [];
  }
  if (product?.sameSubjectsForAllClasses === false && product.subjectsByClass) {
    const union = new Set<string>();
    Object.values(product.subjectsByClass).forEach((list) =>
      list.forEach((s) => union.add(s)),
    );
    if (union.size) return [...union];
  }
  return product?.catalogSubjects || [];
}

export const SUBJECT_PRESETS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Abacus",
  "Physics",
  "Chemistry",
  "Biology",
];

export const CATEGORY_PRESETS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Level 1",
  "Level 2",
  "Level 3",
  "Foundation",
  "Mastery",
];

export type CatalogClass = {
  _id: string;
  classNumber: string;
  label: string;
  description?: string;
};

export type ProductCurriculum = {
  product: Product;
  classes: CatalogClass[];
  subjects: {
    _id: string;
    name: string;
    classNumber?: string;
    productCode?: string;
    board?: string;
  }[];
};

export async function fetchProductCurriculum(
  productCode: string,
): Promise<ProductCurriculum | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/super-admin/products/${encodeURIComponent(productCode)}/curriculum`,
    { headers: authHeaders() },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function fetchAdminProductCurriculum(
  productCode: string,
): Promise<ProductCurriculum | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productCode)}/curriculum`,
    { headers: authHeaders() },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function provisionProductCurriculum(
  productCode: string,
  opts?: { classNumbers?: string[]; classesFrom?: string; classesTo?: string },
): Promise<{ ok: boolean; data?: Record<string, unknown>; message?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/super-admin/products/${encodeURIComponent(productCode)}/provision-curriculum`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(opts || {}),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Setup failed" };
  return { ok: true, data: json.data, message: json.message };
}

/** @deprecated */
export const importSubjectsFromProduct = provisionProductCurriculum;

export type ClassLicenseRow = {
  classId: string;
  classLabel?: string;
  maxStrength: number;
  currentCount?: number;
  remaining?: number;
  isLocked?: boolean;
  isFull?: boolean;
};

export type ProductScope = {
  productCode: string;
  classLicenses: ClassLicenseRow[];
};

export type SchoolProductAssignment = {
  productCode: string;
  classesFrom: string;
  classesTo: string;
  /** Max students allowed in each class in the range (not pooled across the range). */
  maxStrength: number;
  maxStrengthPerClass?: number;
  classSlotsInRange?: number;
  totalMaxStrength?: number;
  currentCount?: number;
  remaining?: number;
  isFull?: boolean;
};

export type ProductWorkspace = {
  admin: {
    primaryProductCode: string;
    productCodes: string[];
    productAssignments?: SchoolProductAssignment[];
  };
  products: Product[];
  scopes: ProductScope[];
  classes: {
    _id: string;
    classNumber: string;
    section: string;
    name?: string;
    productCode?: string;
  }[];
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return {
    Authorization: `Bearer ${token || ""}`,
    "Content-Type": "application/json",
  };
}

export async function deleteProduct(code: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/super-admin/products/${encodeURIComponent(code)}`,
    { method: "DELETE", headers: authHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: json.message || "Failed to delete product" };
  }
  return { ok: true };
}

export async function updateProduct(
  code: string,
  payload: Partial<
    Pick<
      Product,
      | "name"
      | "description"
      | "catalogClassNumbers"
      | "sameSubjectsForAllClasses"
      | "catalogSubjects"
      | "subjectsByClass"
      | "catalogCategories"
      | "structureType"
      | "isPremium"
    >
  >,
): Promise<{ ok: boolean; data?: Product; message?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/api/super-admin/products/${encodeURIComponent(code)}`,
    { method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload) },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || "Update failed" };
  return { ok: true, data: json.data };
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE_URL}/api/super-admin/products`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function fetchAdminProductWorkspace(
  schoolAdminId?: string | null,
): Promise<ProductWorkspace | null> {
  const res = await fetch(
    schoolAdminId
      ? schoolAdminApiUrl("/products/workspace", schoolAdminId)
      : `${API_BASE_URL}/api/admin/products/workspace`,
    {
    headers: authHeaders(),
  },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function saveProductClassLicenses(
  productCode: string,
  classLicenses: { classId: string; maxStrength: number }[],
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productCode)}/licenses`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ classLicenses }),
    },
  );
  return res.ok;
}

export async function assignSchoolProducts(
  adminId: string,
  productCodes: string[],
  primaryProductCode?: string,
): Promise<boolean> {
  const res = await fetch(
    `${API_BASE_URL}/api/super-admin/products/schools/${adminId}/products`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ productCodes, primaryProductCode }),
    },
  );
  return res.ok;
}

export async function fetchClassCapacity(
  classId: string,
  productCode: string,
): Promise<{
  licensed: boolean;
  maxStrength: number;
  currentCount: number;
  remaining: number;
  isFull: boolean;
  assignmentLabel?: string;
} | null> {
  const q = new URLSearchParams({ classId, productCode });
  const res = await fetch(`${API_BASE_URL}/api/admin/products/capacity?${q}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export function productLabel(code: string, products?: Product[]): string {
  const p = products?.find((x) => x.code === code);
  return p?.name || code.replace(/_/g, " ");
}
