import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { schoolAdminApiUrl } from '@/lib/school-admin-api';
import {
  fetchAdminProductWorkspace,
  fetchProducts,
  fetchSchoolLicenseAssignments,
  productLabel,
  type Product,
  type ProductWorkspace,
  type SchoolProductAssignment,
} from '@/lib/products';
import {
  TeacherProductAssignmentEditor,
  teacherRowsFromApi,
  teacherAssignmentToApi,
  isTeacherRowValid,
  newTeacherProductRow,
  type TeacherProductRow,
} from '@/components/admin/TeacherProductAssignmentEditor';
import { saveTeacherProductAssignments } from '@/lib/teacher-api';
import {
  AdminPageShell,
  AdminStatGrid,
  AdminPanel,
  adminPrimaryBtn,
} from '@/components/admin/admin-ui';
import {
  dedupeSubjectsForPicker,
  formatSubjectDisplayLabel,
  normalizeSubjectDisplayKey,
} from '@/lib/subject-names';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Mail,
  Phone,
  BookOpen,
  BookMarked,
  GraduationCap,
  CheckCircle,
  XCircle,
  Filter,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react';
import { AdminTeacherDailyDialog } from '@/components/admin/AdminTeacherDailyDialog';
import {
  formatPhoneInputValue,
  isValidOptionalPhoneTenDigits,
  normalizePhoneTenDigits,
} from '@/lib/phone';

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  qualifications?: string;
  subjects: Subject[];
  assignedClassIds?: string[];
  productAssignments?: {
    productCode: string;
    classLicenses?: { classNumber: string; subjects?: string[] }[];
  }[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Class {
  id: string;
  name: string;
  classNumber?: string;
  section?: string;
  description?: string;
  subject: string;
  assignedSubjects?: Array<{ id?: string; _id?: string; name?: string; code?: string }>;
  grade: string;
  teacher: string;
  schedule: string;
  room: string;
  studentCount: number;
  students: any[];
  createdAt: string;
}

const dedupeSubjectsForDisplay = (subjects: Subject[] | undefined) => {
  const byKey = new Map<string, { id: string; label: string }>();
  for (const subject of subjects ?? []) {
    if (!subject) continue;
    const raw = subject.name || subject.code || '';
    if (!raw) continue;
    const key = normalizeSubjectDisplayKey(raw);
    const label = formatSubjectDisplayLabel(raw);
    const existing = byKey.get(key);
    const id = getSubjectRecordId(subject) || key;
    if (!existing || label.length > existing.label.length) {
      byKey.set(key, { id, label });
    }
  }
  return Array.from(byKey.values());
};

const getClassSubjectLine = (
  classItem: Class | undefined,
  teacherSubjects: Subject[] = []
) => {
  if (!classItem) return '';
  const teacherIdSet = new Set(
    teacherSubjects.filter(Boolean).map((s) => String(s?.id ?? ''))
  );
  const fromClass = (classItem.assignedSubjects ?? []).filter((sub) => {
    if (!sub) return false;
    const sid = String(sub.id || sub._id || '');
    return teacherIdSet.size === 0 || !sid || teacherIdSet.has(sid);
  });

  const labels = (
    fromClass.length > 0
      ? fromClass.map((s) => formatSubjectDisplayLabel(s.name || s.code || ''))
      : dedupeSubjectsForDisplay(teacherSubjects).map((s) => s.label)
  ).filter(Boolean);

  const unique = Array.from(new Set(labels));
  if (unique.length > 0) return unique.join(', ');
  const subjectField = classItem.subject;
  if (subjectField && subjectField !== 'General') {
    return String(subjectField)
      .split(',')
      .map((part) => formatSubjectDisplayLabel(part.trim()))
      .join(', ');
  }
  return '';
};

const resolveAssignedClass = (classId: string, classList: Class[] | undefined) => {
  const id = String(classId);
  return (classList ?? []).find(
    (c) =>
      c != null &&
      (c.id === id ||
        c.classNumber === id ||
        `${c.classNumber ?? ''}${c.section ?? ''}` === id)
  );
};

interface Subject {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

function readSavedClassAssignments(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem('teacherClassAssignments');
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function getSubjectRecordId(subject: { id?: string; _id?: string } | null | undefined): string {
  if (!subject) return '';
  return String(subject.id || subject._id || '');
}

function mapSubjectFromApi(subject: unknown): Subject | null {
  if (!subject || typeof subject !== 'object') return null;
  const s = subject as {
    id?: string;
    _id?: string;
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  };
  const id = getSubjectRecordId(s);
  if (!id || typeof s.name !== 'string') return null;
  if (s.isActive === false) return null;
  return {
    id,
    _id: s._id || id,
    name: s.name,
    code: s.code || '',
    description: s.description,
    isActive: true,
  };
}

function mapTeacherFromApi(
  teacher: unknown,
  savedAssignments: Record<string, string[]>
): Teacher | null {
  if (!teacher || typeof teacher !== 'object') return null;
  const t = teacher as Teacher & { _id?: string };
  const id = String(t._id || t.id || '');
  if (!id) return null;

  const subjects = (Array.isArray(t.subjects) ? t.subjects : [])
    .map(mapSubjectFromApi)
    .filter((s): s is Subject => s != null);

  const fromAssignments = Array.isArray((t as Teacher & { assignments?: { classId?: string }[] }).assignments)
    ? (t as Teacher & { assignments?: { classId?: string }[] }).assignments!.map((a) =>
        String(a.classId || '')
      ).filter(Boolean)
    : [];

  const fromSummaries = Array.isArray(
    (t as Teacher & { assignedClassSummaries?: { id: string }[] }).assignedClassSummaries
  )
    ? (t as Teacher & { assignedClassSummaries?: { id: string }[] }).assignedClassSummaries!.map(
        (c) => String(c.id)
      )
    : [];

  const assignedRaw = t.assignedClassIds ?? savedAssignments[id] ?? [];
  const assignedClassIds = Array.from(
    new Set([
      ...(Array.isArray(assignedRaw) ? assignedRaw.map((x) => String(x)).filter(Boolean) : []),
      ...fromAssignments,
      ...fromSummaries,
    ])
  );

  return {
    id,
    fullName: String(t.fullName || 'Unknown'),
    email: String(t.email || ''),
    phone: t.phone,
    department: t.department,
    qualifications: t.qualifications,
    subjects,
    assignedClassIds,
    productAssignments: Array.isArray(
      (t as Teacher & { productAssignments?: Teacher['productAssignments'] }).productAssignments,
    )
      ? (t as Teacher & { productAssignments?: Teacher['productAssignments'] }).productAssignments
      : [],
    isActive: t.isActive !== false,
    createdAt: t.createdAt || new Date().toISOString(),
    lastLogin: t.lastLogin,
  };
}

function mapClassFromApi(classItem: unknown): Class | null {
  if (!classItem || typeof classItem !== 'object') return null;
  const c = classItem as Class & { _id?: string };
  const id = String(c._id || c.id || '');
  if (!id) return null;

  return {
    id,
    name: String(c.name || `Class ${c.classNumber ?? ''}${c.section ?? ''}`),
    classNumber: c.classNumber != null ? String(c.classNumber) : undefined,
    section: c.section != null ? String(c.section) : undefined,
    description: c.description,
    subject: typeof c.subject === 'string' ? c.subject : 'General',
    assignedSubjects: Array.isArray(c.assignedSubjects) ? c.assignedSubjects : [],
    grade: String(c.grade ?? c.classNumber ?? ''),
    teacher: String(c.teacher ?? 'TBD'),
    schedule: String(c.schedule ?? 'Mon-Fri 9:00 AM'),
    room: String(c.room ?? '—'),
    studentCount: Number(c.studentCount) || 0,
    students: Array.isArray(c.students) ? c.students : [],
    createdAt: c.createdAt || new Date().toISOString(),
  };
}

function getTeacherInitials(fullName?: string): string {
  const parts = String(fullName || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type TeacherManagementProps = {
  schoolAdminId?: string;
};

const TeacherManagement = ({ schoolAdminId }: TeacherManagementProps = {}) => {
  const { toast } = useToast();
  const uiVariant = schoolAdminId ? ('premium' as const) : ('default' as const);
  const adminApi = (path: string) => schoolAdminApiUrl(path, schoolAdminId);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProductAssignOpen, setIsProductAssignOpen] = useState(false);
  const [productWorkspace, setProductWorkspace] = useState<ProductWorkspace | null>(null);
  const [schoolLicenseRows, setSchoolLicenseRows] = useState<SchoolProductAssignment[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [productAssignRows, setProductAssignRows] = useState<TeacherProductRow[]>([]);
  const [savingProductAssign, setSavingProductAssign] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showNewTeacherPassword, setShowNewTeacherPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [assigningProductsTeacher, setAssigningProductsTeacher] = useState<Teacher | null>(null);
  const [dailyDialogTeacher, setDailyDialogTeacher] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    qualifications: '',
  });
  const [newTeacherProductRows, setNewTeacherProductRows] = useState<TeacherProductRow[]>([]);

  const refreshSchoolLicenses = async () => {
    if (!schoolAdminId) {
      setSchoolLicenseRows([]);
      return { licenses: [] as SchoolProductAssignment[], products: [] as Product[] };
    }
    setLoadingLicenses(true);
    try {
      const [workspace, products, licenses] = await Promise.all([
        fetchAdminProductWorkspace(schoolAdminId),
        fetchProducts(),
        fetchSchoolLicenseAssignments(schoolAdminId),
      ]);
      setProductWorkspace(workspace);
      setCatalogProducts(products);
      const rows =
        licenses.length > 0
          ? licenses
          : (workspace?.admin?.productAssignments as SchoolProductAssignment[]) || [];
      setSchoolLicenseRows(rows);
      return { licenses: rows, products };
    } finally {
      setLoadingLicenses(false);
    }
  };

  const findCatalogProduct = (productCode: string, products: Product[]) =>
    products.find(
      (p) =>
        p.code === productCode || p.code.toUpperCase() === productCode.toUpperCase(),
    );

  useEffect(() => {
    void refreshSchoolLicenses();
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
  }, [schoolAdminId]);

  const subjectsForPicker = useMemo(() => dedupeSubjectsForPicker(subjects), [subjects]);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${adminApi('')}/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      console.log('Raw teachers data:', data);
      
      // Handle different response formats
      let teachersArray: unknown[] = [];
      if (Array.isArray(data)) {
        teachersArray = data;
      } else if (data && Array.isArray(data.data)) {
        teachersArray = data.data;
      } else if (data && Array.isArray(data.teachers)) {
        teachersArray = data.teachers;
      } else {
        console.warn('Unexpected API response format:', data);
        teachersArray = [];
      }
      
      const savedAssignments = readSavedClassAssignments();
      const mappedTeachers = teachersArray
        .map((teacher: unknown) => mapTeacherFromApi(teacher, savedAssignments))
        .filter((teacher): teacher is Teacher => teacher != null);
      setTeachers(mappedTeachers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      // Set mock data for development
      setTeachers([
        {
          id: '1',
          fullName: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@school.edu',
          phone: '+1234567890',
          department: 'Mathematics',
          qualifications: 'PhD in Mathematics',
          subjects: [
            { id: '1', name: 'Calculus', code: 'MATH101' },
            { id: '2', name: 'Algebra', code: 'MATH102' }
          ],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          fullName: 'Prof. Michael Brown',
          email: 'michael.brown@school.edu',
          phone: '+1234567891',
          department: 'Physics',
          qualifications: 'PhD in Physics',
          subjects: [
            { id: '3', name: 'Mechanics', code: 'PHYS101' }
          ],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${adminApi('')}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Subjects API Response:', data); // Debug log
      
      // Handle different response formats
      let subjectsArray: unknown[] = [];
      if (Array.isArray(data)) {
        subjectsArray = data;
      } else if (data && Array.isArray(data.data)) {
        subjectsArray = data.data;
      } else if (data && Array.isArray(data.subjects)) {
        subjectsArray = data.subjects;
      } else {
        console.warn('Unexpected subjects API response format:', data);
        subjectsArray = [];
      }
      
      const seenRawIds = new Set<string>();
      const mappedSubjects: Subject[] = [];
      for (const item of subjectsArray) {
        const raw = item as { id?: string; _id?: string };
        const rawId = String(raw.id || raw._id || '').trim();
        if (rawId) {
          const norm = rawId.length === 24 ? rawId.toLowerCase() : rawId;
          if (seenRawIds.has(norm)) continue;
          seenRawIds.add(norm);
        }
        const mapped = mapSubjectFromApi(item);
        if (mapped) mappedSubjects.push(mapped);
      }

      setSubjects(dedupeSubjectsForPicker(mappedSubjects));
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      setSubjects([
        { id: '1', name: 'Calculus', code: 'MATH101', description: 'Advanced Calculus' },
        { id: '2', name: 'Algebra', code: 'MATH102', description: 'Linear Algebra' },
        { id: '3', name: 'Mechanics', code: 'PHYS101', description: 'Classical Mechanics' }
      ]);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${adminApi('')}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Classes API Response:', data);
      
      // Handle different response formats
      let classesArray: unknown[] = [];
      if (Array.isArray(data)) {
        classesArray = data;
      } else if (data && Array.isArray(data.data)) {
        classesArray = data.data;
      } else if (data && Array.isArray(data.classes)) {
        classesArray = data.classes;
      } else {
        console.warn('Unexpected classes API response format:', data);
        classesArray = [];
      }
      
      // Map backend _id to frontend id
      const mappedClasses = classesArray
        .map((classItem: unknown) => mapClassFromApi(classItem))
        .filter((c): c is Class => c != null);
      
      setClasses(mappedClasses);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([
        { id: '1', name: 'Class 10A', subject: 'General', grade: '10', teacher: 'TBD', schedule: 'Mon-Fri 9:00 AM', room: 'Room 101', studentCount: 0, students: [], createdAt: new Date().toISOString() },
        { id: '2', name: 'Class 5B', subject: 'General', grade: '5', teacher: 'TBD', schedule: 'Mon-Fri 10:00 AM', room: 'Room 102', studentCount: 0, students: [], createdAt: new Date().toISOString() }
      ]);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolAdminId) {
      toast({
        title: 'Super admin only',
        description: 'Teachers can only be created from the super admin school workspace.',
        variant: 'destructive',
      });
      return;
    }

    const validProductRows = newTeacherProductRows.filter((r) => isTeacherRowValid(r));
    const productName =
      newTeacher.department.trim() ||
      (validProductRows[0]
        ? productLabel(validProductRows[0].productCode, catalogProducts)
        : '');
    if (!newTeacher.fullName || !newTeacher.email || !newTeacher.password || !productName) {
      toast({
        title: 'Missing required fields',
        description: 'Name, email, password, and product name are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!validProductRows.length) {
      toast({
        title: 'Assign products',
        description:
          'Enable at least one class or level per product and pick subjects or categories.',
        variant: 'destructive',
      });
      return;
    }

    if (newTeacher.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidOptionalPhoneTenDigits(newTeacher.phone)) {
      toast({
        title: 'Invalid phone',
        description: 'Phone must be exactly 10 digits, or leave empty.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${adminApi('')}/teachers`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          ...newTeacher,
          department: productName,
          phone: normalizePhoneTenDigits(newTeacher.phone),
          subjects: [],
          productAssignments: validProductRows
            .map(teacherAssignmentToApi)
            .filter((r): r is NonNullable<ReturnType<typeof teacherAssignmentToApi>> => !!r),
        }),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Failed to parse JSON response:', text);
        toast({
          title: 'Could not add teacher',
          description: `Server returned an invalid response (status ${response.status}).`,
          variant: 'destructive',
        });
        return;
      }
      
      if (response.ok && (responseData.success === true || responseData.success === undefined)) {
        const addedName = newTeacher.fullName.trim();
        setNewTeacher({ fullName: '', email: '', password: '', phone: '', department: '', qualifications: '' });
        setNewTeacherProductRows([]);
        setShowNewTeacherPassword(false);
        setIsAddDialogOpen(false);
        await Promise.all([fetchTeachers(), fetchClasses()]);
        toast({
          title: 'Teacher added',
          description: `${addedName} was created. Classes are ready — you can add students next.`,
        });
      } else {
        const errorMsg = responseData.message || responseData.error || 'Unknown error occurred';
        console.error('Error response:', responseData);
        const legacyApi =
          /department/i.test(errorMsg) &&
          (/at least one subject/i.test(errorMsg) || /subjects are required/i.test(errorMsg));
        toast({
          title: 'Could not add teacher',
          description: legacyApi
            ? `The server at ${API_BASE_URL} is running old backend code. Restart the backend after pulling latest code, or redeploy to production (206.189.179.75).`
            : errorMsg,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to add teacher:', error);
      const errorMsg = error.message || 'Network error. Please check your connection and try again.';
      toast({
        title: 'Could not add teacher',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    if (!isValidOptionalPhoneTenDigits(editingTeacher.phone || '')) {
      toast({
        title: 'Invalid phone',
        description: 'Phone must be exactly 10 digits, or leave empty.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: 'Session expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${adminApi('')}/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editingTeacher,
          phone: normalizePhoneTenDigits(editingTeacher.phone || ''),
        }),
      });

      if (response.ok) {
        setEditingTeacher(null);
        setIsEditDialogOpen(false);
        fetchTeachers();
        toast({
          title: 'Teacher updated',
          description: 'Changes were saved successfully.',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Could not update teacher',
          description: errorData.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update teacher:', error);
      toast({
        title: 'Could not update teacher',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (window.confirm(`Are you sure you want to delete ${teacherName}? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast({
            title: 'Session expired',
            description: 'Please log in again.',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch(`${adminApi('')}/teachers/${teacherId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchTeachers();
          toast({
            title: 'Teacher deleted',
            description: `${teacherName} was removed.`,
          });
        } else {
          const errorData = await response.json();
          toast({
            title: 'Could not delete teacher',
            description: errorData.message || 'Unknown error',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to delete teacher:', error);
        toast({
          title: 'Could not delete teacher',
          description: 'Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCSVUpload = async (file: File) => {
    if (isUploading) return;
    if (!schoolAdminId) {
      toast({
        title: 'Super admin only',
        description: 'Bulk teacher import is only available in the super admin school workspace.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Uploading teacher CSV file:', file.name, file.size, 'bytes');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Upload endpoint:', `${adminApi('')}/teachers/upload`);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          title: 'Session expired',
          description: 'Please log in again.',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      const response = await fetch(`${adminApi('')}/teachers/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      console.log('Upload response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        setIsUploadDialogOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchTeachers();
        fetchSubjects();
        window.dispatchEvent(new CustomEvent('subjectsUpdated'));

        const newSubjects = result.createdSubjects?.length || 0;
        let message =
          result.message ||
          `CSV uploaded successfully!\nCreated ${result.createdTeachers?.length || 0} teacher(s).`;
        if (newSubjects > 0) {
          message += `\n${newSubjects} new subject(s) added to Subject Management.`;
        }

        let description = message.replace(/\n/g, ' ');
        if (result.errors && result.errors.length > 0) {
          const errPreview = result.errors.slice(0, 3).join(' · ');
          description += ` Some rows failed: ${errPreview}`;
          if (result.errors.length > 3) {
            description += ` (+${result.errors.length - 3} more)`;
          }
        }

        toast({
          title: 'CSV uploaded',
          description,
        });
      } else {
        let errorData;
        try {
          const text = await response.text();
          console.log('Error response text:', text);
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { 
            message: `Server error (${response.status}): ${response.statusText}`,
            hint: 'The server returned an error. Please check the console for details.'
          };
        }
        
        const errorMessage = errorData.message || 'Unknown error';
        const errorHint = errorData.hint ? `\n\nHint: ${errorData.hint}` : '';
        const fullError = errorData.error ? `${errorMessage}\n\nError details: ${errorData.error}${errorHint}` : `${errorMessage}${errorHint}`;
        toast({
          title: 'CSV upload failed',
          description: fullError.replace(/\n/g, ' ').slice(0, 280),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to upload CSV:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Network error';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Cannot connect to server at ${API_BASE_URL}. Check that the backend is running.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'CSV upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,email,password,phone,department,qualifications,subjects
John Doe,john.doe@school.edu,TeacherPass1,1234567890,Mathematics,PhD in Mathematics,Mathematics,Physics
Jane Smith,jane.smith@school.edu,TeacherPass2,1234567891,Science,MSc in Chemistry,Chemistry,Biology`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'teacher_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openProductAssignDialog = async (teacher: Teacher) => {
    const { licenses: refreshed, products } = await refreshSchoolLicenses();
    const licenseRows = refreshed.length ? refreshed : schoolLicenseRows;
    const productsForPicker = products.length ? products : catalogProducts;
    setAssigningProductsTeacher(teacher);
    const assignRows = teacherRowsFromApi(
      teacher.productAssignments,
      licenseRows,
      productsForPicker,
    );
    setProductAssignRows(
      assignRows.length
        ? assignRows
        : licenseRows.length
          ? [
              newTeacherProductRow(
                licenseRows[0].productCode,
                findCatalogProduct(licenseRows[0].productCode, productsForPicker),
                licenseRows[0],
              ),
            ]
          : [],
    );
    setIsProductAssignOpen(true);
  };

  const handleSaveProductAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningProductsTeacher) return;

    const valid = productAssignRows.filter((r) => isTeacherRowValid(r));
    if (!valid.length) {
      toast({
        title: 'Incomplete assignment',
        description:
          'Enable at least one class/level per product and pick subjects or categories.',
        variant: 'destructive',
      });
      return;
    }

    const payload = valid
      .map(teacherAssignmentToApi)
      .filter((r): r is NonNullable<ReturnType<typeof teacherAssignmentToApi>> => !!r);

    const teacherId = assigningProductsTeacher.id;
    setSavingProductAssign(true);
    const res = await saveTeacherProductAssignments(teacherId, payload, schoolAdminId);
    setSavingProductAssign(false);

    if (!res.ok) {
      toast({
        title: 'Could not save',
        description: res.message || 'Try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Products assigned',
      description: `${assigningProductsTeacher.fullName} can now see scoped content in their portal.`,
    });
    setIsProductAssignOpen(false);
    setAssigningProductsTeacher(null);
    await Promise.all([fetchTeachers(), fetchClasses()]);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const q = searchTerm.toLowerCase();
    return (
      (teacher.fullName || '').toLowerCase().includes(q) ||
      (teacher.email || '').toLowerCase().includes(q) ||
      (teacher.department || '').toLowerCase().includes(q)
    );
  });

  const totalTeachers = teachers.length;
  const activeTeachers = teachers.filter(t => t.isActive).length;
  const totalSubjects = teachers.reduce((total, teacher) => total + (teacher.subjects?.length ?? 0), 0);

  return (
    <AdminPageShell
      variant={uiVariant}
      title="Teachers"
      description="Add teachers and assign book products — pick classes or levels and subjects/categories from the school license."
    >
      <AdminStatGrid
        variant={uiVariant}
        stats={[
          { label: 'Teachers', value: totalTeachers, icon: Users },
          { label: 'Active', value: activeTeachers, icon: CheckCircle },
          { label: 'Subject links', value: totalSubjects, icon: BookOpen },
        ]}
      />

        <AdminPanel variant={uiVariant}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-0 pl-12 sm:pl-12 w-full sm:w-64 border-orange-200 focus:border-orange-400 bg-white/80 rounded-xl"
              />
            </div>
            <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {!schoolAdminId ? (
              <p className="text-xs text-slate-600 max-w-md text-right">
                Teacher accounts are created by the platform super admin. You can assign subjects and
                classes to existing teachers.
              </p>
            ) : null}
          <div className="flex gap-3">
            {schoolAdminId ? (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 rounded-xl">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white/95 border-orange-200 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                    Upload Teachers CSV
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 text-xs sm:text-sm">
                    Upload a CSV file to bulk import teachers. Download the template for the correct format.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">CSV Template</p>
                        <p className="text-xs sm:text-sm text-gray-600">Download the template file</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                      className="border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="csv-file" className="text-gray-700 font-medium mb-2 block">
                      Select CSV File
                    </Label>
                    <Input
                      id="csv-file"
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                        }
                      }}
                      className="border-orange-200 focus:border-orange-400 rounded-xl"
                    />
                    {selectedFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-green-800">
                          <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 border border-orange-200 rounded-xl p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Required columns:</strong> name, email, password (min 6 characters)<br />
                      <strong>Optional columns:</strong> phone, department, qualifications, subjects (comma-separated)<br />
                      <strong>Note:</strong> CSV must include a <code className="text-xs">password</code> column (min 6 characters) for each teacher. Extra subject columns after <code className="text-xs">subjects</code> are supported.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (selectedFile && !isUploading) {
                        handleCSVUpload(selectedFile);
                      }
                    }}
                    disabled={!selectedFile || isUploading}
                    className="bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-700 hover:to-orange-600 text-white disabled:opacity-50 rounded-xl"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        Upload Teachers
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            ) : null}
            {schoolAdminId ? (
            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setShowNewTeacherPassword(false);
                  return;
                }
                void (async () => {
                  const { licenses: refreshed, products } = await refreshSchoolLicenses();
                  const licenseRows = refreshed.length ? refreshed : schoolLicenseRows;
                  const productsForPicker = products.length ? products : catalogProducts;
                  if (licenseRows.length) {
                    const primaryName = productLabel(
                      licenseRows[0].productCode,
                      productsForPicker,
                    );
                    setNewTeacher((prev) => ({
                      ...prev,
                      department: prev.department || primaryName,
                    }));
                    setNewTeacherProductRows([
                      newTeacherProductRow(
                        licenseRows[0].productCode,
                        findCatalogProduct(licenseRows[0].productCode, productsForPicker),
                        licenseRows[0],
                      ),
                    ]);
                  } else {
                    setNewTeacherProductRows([]);
                  }
                })();
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl px-4 sm:px-6 lg:px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/80 shadow-2xl flex flex-col rounded-2xl">
              <DialogHeader className="flex-shrink-0 pb-2 border-b border-slate-100">
                <DialogTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Add New Teacher
                </DialogTitle>
                <DialogDescription className="text-slate-600 text-xs sm:text-sm">
                  Create a teacher account and assign book products. Classes are created automatically
                  from your selections — add students to those classes afterward.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <form onSubmit={handleAddTeacher} id="add-teacher-form" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name</Label>
                    <Input
                      id="fullName"
                      value={newTeacher.fullName}
                      onChange={(e) => setNewTeacher({ ...newTeacher, fullName: e.target.value })}
                      className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Phone <span className="text-slate-500 font-normal">(10 digits, optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={newTeacher.phone}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          phone: formatPhoneInputValue(e.target.value),
                        })
                      }
                      className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department" className="text-slate-700 font-medium">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    {schoolLicenseRows.length > 0 ? (
                      <Select
                        value={newTeacher.department || undefined}
                        onValueChange={(value) =>
                          setNewTeacher({ ...newTeacher, department: value })
                        }
                      >
                        <SelectTrigger
                          id="department"
                          className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                        >
                          <SelectValue placeholder="Select product name" />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolLicenseRows.map((row) => {
                            const name = productLabel(row.productCode, catalogProducts);
                            return (
                              <SelectItem key={row.productCode} value={name}>
                                {name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="department"
                        value={newTeacher.department}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, department: e.target.value })
                        }
                        placeholder="Assign school products first"
                        className="border-slate-200 rounded-xl bg-slate-50"
                        disabled
                      />
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showNewTeacherPassword ? 'text' : 'password'}
                        value={newTeacher.password}
                        onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                        className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl px-0 pl-3 pr-10 sm:pr-12 bg-white"
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewTeacherPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                        aria-label={showNewTeacherPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewTeacherPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Teacher will use this password to sign in.</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="qualifications" className="text-gray-700 font-medium">Qualifications</Label>
                  <Textarea
                    id="qualifications"
                    value={newTeacher.qualifications}
                    onChange={(e) => setNewTeacher({ ...newTeacher, qualifications: e.target.value })}
                    className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl bg-white"
                    rows={2}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <Label className="text-slate-800 font-semibold mb-1 block">
                    Assign Products <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-slate-500 mb-3">
                    Products licensed to this school in School Management appear below.
                  </p>
                  {loadingLicenses ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600 py-6 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      Loading school products…
                    </div>
                  ) : schoolLicenseRows.length === 0 ? (
                    <div className="text-xs sm:text-sm text-violet-800 p-4 bg-violet-50 rounded-xl border border-violet-200">
                      No licensed products found for this school. Open{' '}
                      <strong>School Management → Edit School</strong> and assign book products, then
                      return here.
                    </div>
                  ) : (
                    <TeacherProductAssignmentEditor
                      rows={newTeacherProductRows}
                      onChange={setNewTeacherProductRows}
                      catalogProducts={catalogProducts}
                      schoolAssignments={schoolLicenseRows}
                    />
                  )}
                </div>
                </form>
              </div>
              <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" form="add-teacher-form" className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl shadow-md">
                  Add Teacher
                </Button>
              </div>
            </DialogContent>
          </Dialog>
            ) : null}
          </div>
          </div>
        </div>
        </AdminPanel>

        {/* Teachers Grid — stretch cards so sections align across columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6 items-stretch">
          {filteredTeachers.map((teacher, index) => {
            const teacherSubjects = teacher.subjects ?? [];
            const assignedClassIds = teacher.assignedClassIds ?? [];
            const gradientColors = [
              'from-orange-500 to-orange-400',
              'from-blue-500 to-cyan-500', 
              'from-emerald-500 to-teal-500',
              'from-orange-500 to-red-500',
              'from-violet-500 to-purple-500',
              'from-indigo-500 to-blue-500'
            ];
            const gradient = gradientColors[index % gradientColors.length];
            
            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl p-3 sm:p-4 lg:p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 h-full flex flex-col"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative z-10 flex flex-col flex-1 min-h-0">
                  {/* Header — fixed height so Subjects / Classes align across cards */}
                  <div className="flex items-start justify-between gap-2 mb-4 min-h-[5.5rem]">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg`}>
                        {getTeacherInitials(teacher.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2">{teacher.fullName}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1 line-clamp-2 min-h-[2.5rem] leading-snug" title={teacher.email}>
                          {teacher.email}
                        </p>
                      </div>
                    </div>
                    <Badge className={`shrink-0 ${teacher.isActive ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200' : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200'} rounded-lg px-3 py-1`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {/* Contact — same two rows on every card */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-gray-700 bg-white/50 rounded-xl px-3 min-h-[2.75rem]">
                      <Phone className="w-4 h-4 mr-3 shrink-0 text-orange-600" />
                      <span className={`font-medium truncate ${teacher.phone ? '' : 'text-gray-400'}`}>
                        {teacher.phone || '—'}
                      </span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-700 bg-white/50 rounded-xl px-3 min-h-[2.75rem]">
                      <BookOpen className="w-4 h-4 mr-3 shrink-0 text-emerald-600" />
                      <span className={`font-medium truncate ${teacher.qualifications ? '' : 'text-gray-400'}`}>
                        {teacher.qualifications || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Licensed products */}
                  <div className="mb-4 min-h-[4.25rem]">
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm mb-2">Products:</h4>
                    <div className="flex flex-wrap gap-2 min-h-[1.75rem] items-start">
                      {(teacher.productAssignments || []).map((row) => (
                        <Badge
                          key={row.productCode}
                          className={`bg-gradient-to-r ${gradient} text-white border-0 rounded-lg px-3 py-1 text-xs font-medium`}
                        >
                          {row.productCode}
                          {row.classLicenses?.length
                            ? ` · ${row.classLicenses.length} slots`
                            : ''}
                        </Badge>
                      ))}
                      {!(teacher.productAssignments || []).length && (
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1">
                          No products assigned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned classes — equal scroll area on all cards */}
                  <div className="mb-4 flex flex-col flex-1 min-h-[8rem]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm">Assigned Classes:</h4>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline-offset-2 hover:underline shrink-0"
                        onClick={() => openProductAssignDialog(teacher)}
                      >
                        Edit subjects
                      </button>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-48 pr-0.5">
                      {assignedClassIds.length > 0 ? (
                        assignedClassIds.map((classId) => {
                          const classItem = resolveAssignedClass(classId, classes);
                          if (!classItem) {
                            return (
                              <div key={classId} className="bg-amber-50 rounded-lg p-3 border border-amber-200 min-h-[4.5rem]">
                                <span className="text-amber-800 text-xs font-medium">
                                  Assigned (class not found — re-assign from Class Management)
                                </span>
                                <span className="text-gray-500 text-xs block mt-1">ID: {classId}</span>
                              </div>
                            );
                          }
                          const subjectLine = getClassSubjectLine(classItem, teacherSubjects);
                          return (
                            <div key={classId} className="bg-gray-50 rounded-lg p-3 border border-gray-200 min-h-[4.5rem]">
                              <div className="text-sm leading-snug">
                                <span className="font-medium text-gray-900">{classItem.name}</span>
                                {subjectLine ? (
                                  <span className="text-gray-600 block sm:inline sm:ml-2">- {subjectLine}</span>
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                📅 {classItem.schedule ?? '—'}
                              </div>
                              <div className="text-xs text-gray-500">
                                🏫 {classItem.room ?? '—'} • 👥 {classItem.studentCount ?? 0} students
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1 inline-block">No classes assigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t border-gray-200 mt-auto">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl px-4"
                      onClick={() => openProductAssignDialog(teacher)}
                      title="Edit classes, levels, and subjects for this teacher"
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Edit subjects &amp; products
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl"
                        onClick={() => setDailyDialogTeacher(teacher)}
                        title="View daily diary"
                      >
                        <BookMarked className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                        onClick={() => handleDeleteTeacher(teacher.id, teacher.fullName)}
                        title="Delete teacher"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTeachers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">No teachers found</h3>
            <p className="text-gray-600 text-base sm:text-lg">Try adjusting your search criteria or add a new teacher.</p>
          </div>
        )}

        <Dialog open={isProductAssignOpen} onOpenChange={setIsProductAssignOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-white to-slate-50/80 border-slate-200 rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                Edit subjects &amp; products — {assigningProductsTeacher?.fullName}
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Enable each class or level, then pick which subjects (class-based) or categories
                (level-based) this teacher teaches. Save to update their portal content and classes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveProductAssignments} className="space-y-4">
              {loadingLicenses ? (
                <div className="flex items-center gap-2 text-sm text-slate-600 py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  Loading licensed products…
                </div>
              ) : (
              <TeacherProductAssignmentEditor
                rows={productAssignRows}
                onChange={setProductAssignRows}
                catalogProducts={catalogProducts}
                schoolAssignments={schoolLicenseRows}
              />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductAssignOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingProductAssign} className={adminPrimaryBtn}>
                  {savingProductAssign ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save assignments'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AdminTeacherDailyDialog
          open={!!dailyDialogTeacher}
          onOpenChange={(open) => {
            if (!open) setDailyDialogTeacher(null);
          }}
          teacherId={dailyDialogTeacher?.id ?? null}
          teacherName={dailyDialogTeacher?.fullName ?? 'Teacher'}
          assignedClasses={
            dailyDialogTeacher
              ? (dailyDialogTeacher.assignedClassIds ?? []).map((classId) => {
                  const classItem = resolveAssignedClass(classId, classes);
                  const label = classItem?.name
                    ? classItem.name
                    : classItem?.classNumber
                      ? `Class ${classItem.classNumber}${classItem.section ? ` - ${classItem.section}` : ''}`
                      : `Class ${classId}`;
                  return { id: String(classItem?.id ?? classId), label };
                })
              : []
          }
        />
    </AdminPageShell>
  );
};

export default TeacherManagement;
