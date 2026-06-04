import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Building2,
  Download,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  SuperAdminInnerPage,
  SuperAdminToolbar,
  SA_BTN_PRIMARY,
  SA_BTN_OUTLINE,
  SA_INPUT,
} from '@/components/super-admin/premium';
import {
  type AbacusCategory,
  type AbacusSchool,
  type AbacusStudent,
  type AbacusTeacher,
  type AbacusTeacherStudentCandidate,
  ABACUS_CSV_STUDENT_HEADERS,
  ABACUS_CSV_TEACHER_HEADERS,
  addAbacusCategory,
  addAbacusLevel,
  assignAbacusStudentsToTeacher,
  createAbacusSchool,
  createAbacusStudent,
  createAbacusTeacher,
  deleteAbacusStudent,
  deleteAbacusTeacher,
  fetchAbacusCatalog,
  fetchAbacusSchools,
  fetchAbacusStudents,
  fetchAbacusTeachers,
  fetchAbacusTeacherStudents,
  fetchNextAbacusUsername,
  abacusDisplayUsername,
  getSchoolLetterPrefix,
  getTeacherUsernameBase,
  getStudentUsernameBase,
  previewNextAbacusUsernameLocal,
  updateAbacusStudent,
  updateAbacusTeacher,
  uploadAbacusStudentsCsv,
  uploadAbacusTeachersCsv,
} from '@/lib/abacus-api';

const FIELD = `${SA_INPUT} border-slate-300 bg-white`;

function CategoryLevelFields({
  catalog,
  category,
  level,
  onCategoryChange,
  onLevelChange,
  onCatalogUpdated,
}: {
  catalog: AbacusCategory[];
  category: string;
  level: string;
  onCategoryChange: (v: string) => void;
  onLevelChange: (v: string) => void;
  onCatalogUpdated: (cats: AbacusCategory[]) => void;
}) {
  const { toast } = useToast();
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addLevelOpen, setAddLevelOpen] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [busy, setBusy] = useState(false);

  const levels = useMemo(() => {
    const cat = catalog.find((c) => c.name === category);
    return cat?.levels || [];
  }, [catalog, category]);

  const saveCategory = async () => {
    setBusy(true);
    try {
      const updated = await addAbacusCategory(newCat);
      onCatalogUpdated(updated);
      onCategoryChange(newCat.trim());
      setAddCatOpen(false);
      setNewCat('');
      toast({ title: 'Category added' });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const saveLevel = async () => {
    setBusy(true);
    try {
      const updated = await addAbacusLevel(category, newLevel);
      onCatalogUpdated(updated);
      onLevelChange(newLevel.trim());
      setAddLevelOpen(false);
      setNewLevel('');
      toast({ title: 'Level added' });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Category</Label>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddCatOpen(true)}>
              + Add category
            </Button>
          </div>
          <Select value={category} onValueChange={(v) => { onCategoryChange(v); onLevelChange(''); }}>
            <SelectTrigger className={FIELD}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {catalog.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Level</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={!category}
              onClick={() => setAddLevelOpen(true)}
            >
              + Add level
            </Button>
          </div>
          <Select value={level} onValueChange={onLevelChange} disabled={!category}>
            <SelectTrigger className={FIELD}>
              <SelectValue placeholder={category ? 'Select level' : 'Pick category first'} />
            </SelectTrigger>
            <SelectContent>
              {levels.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
          </DialogHeader>
          <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="e.g. Star Juniors" className={FIELD} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCatOpen(false)}>Cancel</Button>
            <Button className={SA_BTN_PRIMARY} disabled={busy} onClick={() => void saveCategory()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addLevelOpen} onOpenChange={setAddLevelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add level to {category}</DialogTitle>
          </DialogHeader>
          <Input value={newLevel} onChange={(e) => setNewLevel(e.target.value)} placeholder="e.g. SJ5" className={FIELD} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLevelOpen(false)}>Cancel</Button>
            <Button className={SA_BTN_PRIMARY} disabled={busy} onClick={() => void saveLevel()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function downloadCsvTemplate(headers: string, filename: string) {
  const blob = new Blob([`${headers}\n`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AbacusManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<AbacusSchool[]>([]);
  const [catalog, setCatalog] = useState<AbacusCategory[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<AbacusSchool | null>(null);
  const [teachers, setTeachers] = useState<AbacusTeacher[]>([]);
  const [students, setStudents] = useState<AbacusStudent[]>([]);
  const [tab, setTab] = useState('teachers');
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTeacher, setAssignTeacher] = useState<AbacusTeacher | null>(null);
  const [assignCandidates, setAssignCandidates] = useState<AbacusTeacherStudentCandidate[]>([]);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const teacherFileRef = useRef<HTMLInputElement>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);

  const [schoolForm, setSchoolForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    place: '',
    pin: '',
    city: '',
    state: '',
    notes: '',
  });

  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    category: '',
    level: '',
  });

  const [studentForm, setStudentForm] = useState({
    fullName: '',
    username: '',
    password: '',
    className: '',
    category: '',
    level: '',
  });

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [schoolList, cat] = await Promise.all([fetchAbacusSchools(), fetchAbacusCatalog()]);
      setSchools(schoolList);
      setCatalog(cat);
    } catch (e: unknown) {
      toast({
        title: 'Failed to load Abacus data',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadSchoolPeople = useCallback(async (schoolId: string) => {
    try {
      const [t, s] = await Promise.all([
        fetchAbacusTeachers(schoolId),
        fetchAbacusStudents(schoolId),
      ]);
      setTeachers(t);
      setStudents(s);
    } catch (e: unknown) {
      toast({
        title: 'Failed to load people',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (selectedSchool?.id) void loadSchoolPeople(selectedSchool.id);
  }, [selectedSchool?.id, loadSchoolPeople]);

  const openSchool = (school: AbacusSchool) => {
    setSelectedSchool(school);
    setTab('teachers');
  };

  const resetSchoolForm = () => {
    setSchoolForm({
      name: '',
      contactPerson: '',
      phone: '',
      place: '',
      pin: '',
      city: '',
      state: '',
      notes: '',
    });
  };

  const saveSchool = async () => {
    setSaving(true);
    try {
      const created = await createAbacusSchool({
        name: schoolForm.name,
        contactPerson: schoolForm.contactPerson,
        phone: schoolForm.phone,
        place: schoolForm.place,
        pin: schoolForm.pin,
        notes: schoolForm.notes,
        schoolDetails: { city: schoolForm.city, state: schoolForm.state },
      } as Partial<AbacusSchool>);
      setSchools((prev) => [...prev, { ...created, stats: { teachers: 0, students: 0 } }]);
      setSchoolDialogOpen(false);
      resetSchoolForm();
      toast({ title: 'Abacus school created', description: created.name });
      openSchool({ ...created, stats: { teachers: 0, students: 0 } });
    } catch (e: unknown) {
      toast({
        title: 'Could not create school',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveTeacher = async () => {
    if (!selectedSchool) return;
    setSaving(true);
    try {
      if (editingTeacherId) {
        const payload: Record<string, string> = {
          fullName: teacherForm.fullName,
          phone: teacherForm.phone,
          category: teacherForm.category,
          level: teacherForm.level,
        };
        if (teacherForm.password.trim()) payload.password = teacherForm.password.trim();
        const updated = await updateAbacusTeacher(editingTeacherId, payload);
        setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast({ title: 'Teacher updated', description: abacusDisplayUsername(updated) });
      } else {
        const created = await createAbacusTeacher(selectedSchool.id, {
          fullName: teacherForm.fullName,
          password: teacherForm.password,
          phone: teacherForm.phone,
          category: teacherForm.category,
          level: teacherForm.level,
        });
        setTeachers((prev) => [...prev, created]);
        toast({ title: 'Teacher saved', description: abacusDisplayUsername(created) });
      }
      setTeacherDialogOpen(false);
      setEditingTeacherId(null);
      setTeacherForm({ fullName: '', username: '', password: '', phone: '', category: '', level: '' });
    } catch (e: unknown) {
      toast({
        title: editingTeacherId ? 'Could not update teacher' : 'Could not save teacher',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveStudent = async () => {
    if (!selectedSchool) return;
    setSaving(true);
    try {
      if (editingStudentId) {
        const payload: Record<string, string> = {
          fullName: studentForm.fullName,
          class: studentForm.className,
          category: studentForm.category,
          level: studentForm.level,
        };
        if (studentForm.password.trim()) payload.password = studentForm.password.trim();
        const updated = await updateAbacusStudent(editingStudentId, payload);
        setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast({ title: 'Student updated', description: abacusDisplayUsername(updated) });
      } else {
        const created = await createAbacusStudent(selectedSchool.id, {
          fullName: studentForm.fullName,
          password: studentForm.password,
          class: studentForm.className,
          category: studentForm.category,
          level: studentForm.level,
        });
        setStudents((prev) => [...prev, created]);
        toast({ title: 'Student saved', description: abacusDisplayUsername(created) });
      }
      setStudentDialogOpen(false);
      setEditingStudentId(null);
      setStudentForm({ fullName: '', username: '', password: '', className: '', category: '', level: '' });
    } catch (e: unknown) {
      toast({
        title: editingStudentId ? 'Could not update student' : 'Could not save student',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!teacherDialogOpen || editingTeacherId || !selectedSchool?.id) return;
    let active = true;
    void fetchNextAbacusUsername(selectedSchool.id, 'teacher')
      .then((username) => {
        if (active) setTeacherForm((f) => ({ ...f, username }));
      })
      .catch(() => {
        if (active) {
          setTeacherForm((f) => ({
            ...f,
            username: f.username || previewNextAbacusUsernameLocal('teacher', teachers, selectedSchool),
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [teacherDialogOpen, editingTeacherId, selectedSchool?.id, teachers]);

  useEffect(() => {
    if (!studentDialogOpen || editingStudentId || !selectedSchool?.id) return;
    let active = true;
    void fetchNextAbacusUsername(selectedSchool.id, 'student')
      .then((username) => {
        if (active) setStudentForm((f) => ({ ...f, username }));
      })
      .catch(() => {
        if (active) {
          setStudentForm((f) => ({
            ...f,
            username: f.username || previewNextAbacusUsernameLocal('student', students, selectedSchool),
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [studentDialogOpen, editingStudentId, selectedSchool?.id, students]);

  const openAddTeacher = () => {
    setEditingTeacherId(null);
    setTeacherForm({
      fullName: '',
      username: previewNextAbacusUsernameLocal('teacher', teachers, selectedSchool),
      password: '',
      phone: '',
      category: '',
      level: '',
    });
    setTeacherDialogOpen(true);
  };

  const openEditTeacher = (teacher: AbacusTeacher) => {
    setEditingTeacherId(teacher.id);
    setTeacherForm({
      fullName: teacher.fullName,
      username: abacusDisplayUsername(teacher),
      password: '',
      phone: teacher.phone || '',
      category: teacher.category,
      level: teacher.level,
    });
    setTeacherDialogOpen(true);
  };

  const openAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm({
      fullName: '',
      username: previewNextAbacusUsernameLocal('student', students, selectedSchool),
      password: '',
      className: '',
      category: '',
      level: '',
    });
    setStudentDialogOpen(true);
  };

  const openEditStudent = (student: AbacusStudent) => {
    setEditingStudentId(student.id);
    setStudentForm({
      fullName: student.fullName,
      username: abacusDisplayUsername(student),
      password: '',
      className: student.className || '',
      category: student.category,
      level: student.level,
    });
    setStudentDialogOpen(true);
  };

  const openAssignDialog = async (teacher: AbacusTeacher) => {
    setAssignTeacher(teacher);
    setAssignDialogOpen(true);
    setAssignLoading(true);
    try {
      const rows = await fetchAbacusTeacherStudents(teacher.id);
      setAssignCandidates(rows);
      setAssignSelectedIds(rows.filter((r) => r.assigned).map((r) => r.id));
    } catch (e: unknown) {
      toast({
        title: 'Could not load students',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
      setAssignDialogOpen(false);
    } finally {
      setAssignLoading(false);
    }
  };

  const saveAssign = async () => {
    if (!assignTeacher || !selectedSchool) return;
    setSaving(true);
    try {
      await assignAbacusStudentsToTeacher(assignTeacher.id, assignSelectedIds);
      await loadSchoolPeople(selectedSchool.id);
      setAssignDialogOpen(false);
      toast({
        title: 'Students assigned',
        description: `${assignSelectedIds.length} student(s) assigned to ${assignTeacher.fullName}`,
      });
    } catch (e: unknown) {
      toast({
        title: 'Could not assign students',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTeacherCsv = async (file: File) => {
    if (!selectedSchool) return;
    setSaving(true);
    try {
      const result = await uploadAbacusTeachersCsv(selectedSchool.id, file);
      await loadSchoolPeople(selectedSchool.id);
      toast({
        title: 'CSV import complete',
        description: `${result.created} teacher(s) added${result.errors.length ? `, ${result.errors.length} error(s)` : ''}`,
        variant: result.errors.length ? 'destructive' : 'default',
      });
    } catch (e: unknown) {
      toast({
        title: 'CSV import failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStudentCsv = async (file: File) => {
    if (!selectedSchool) return;
    setSaving(true);
    try {
      const result = await uploadAbacusStudentsCsv(selectedSchool.id, file);
      await loadSchoolPeople(selectedSchool.id);
      toast({
        title: 'CSV import complete',
        description: `${result.created} student(s) added${result.errors.length ? `, ${result.errors.length} error(s)` : ''}`,
      });
    } catch (e: unknown) {
      toast({
        title: 'CSV import failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
      </div>
    );
  }

  if (selectedSchool) {
    return (
      <SuperAdminInnerPage
        toolbar={
          <SuperAdminToolbar>
            <Button variant="outline" className={SA_BTN_OUTLINE} onClick={() => setSelectedSchool(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              All schools
            </Button>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{selectedSchool.name}</p>
              <p className="text-xs text-slate-500">
                {selectedSchool.schoolCode} · Teachers & students login with username and password
              </p>
            </div>
          </SuperAdminToolbar>
        }
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="teachers" className="gap-2">
              <Users className="h-4 w-4" />
              Teachers ({teachers.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Students ({students.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <SuperAdminToolbar>
              <Button className={SA_BTN_PRIMARY} onClick={openAddTeacher}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add teacher
              </Button>
              <Button
                variant="outline"
                className={SA_BTN_OUTLINE}
                onClick={() => teacherFileRef.current?.click()}
                disabled={saving}
              >
                <Upload className="mr-2 h-4 w-4" />
                CSV upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadCsvTemplate(ABACUS_CSV_TEACHER_HEADERS, 'abacus-teachers-template.csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
              <input
                ref={teacherFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleTeacherCsv(f);
                  e.target.value = '';
                }}
              />
            </SuperAdminToolbar>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">{t.fullName}</td>
                      <td className="px-4 py-3 font-mono text-sm">{abacusDisplayUsername(t)}</td>
                      <td className="px-4 py-3">{t.phone || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{t.category}</Badge></td>
                      <td className="px-4 py-3">{t.level}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit teacher"
                            onClick={() => openEditTeacher(t)}
                          >
                            <Pencil className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Assign students"
                            onClick={() => void openAssignDialog(t)}
                          >
                            <UserCheck className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              void deleteAbacusTeacher(t.id).then(() => {
                                setTeachers((prev) => prev.filter((x) => x.id !== t.id));
                                toast({ title: 'Teacher removed' });
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!teachers.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No teachers yet. Add manually or upload CSV.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <SuperAdminToolbar>
              <Button className={SA_BTN_PRIMARY} onClick={openAddStudent}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add student
              </Button>
              <Button
                variant="outline"
                className={SA_BTN_OUTLINE}
                onClick={() => studentFileRef.current?.click()}
                disabled={saving}
              >
                <Upload className="mr-2 h-4 w-4" />
                CSV upload
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadCsvTemplate(ABACUS_CSV_STUDENT_HEADERS, 'abacus-students-template.csv')}
              >
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
              <input
                ref={studentFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleStudentCsv(f);
                  e.target.value = '';
                }}
              />
            </SuperAdminToolbar>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Teacher</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">{s.fullName}</td>
                      <td className="px-4 py-3 font-mono text-sm">{abacusDisplayUsername(s)}</td>
                      <td className="px-4 py-3">{s.className || '—'}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{s.category}</Badge></td>
                      <td className="px-4 py-3">{s.level}</td>
                      <td className="px-4 py-3">{s.teacherName || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit student"
                            onClick={() => openEditStudent(s)}
                          >
                            <Pencil className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              void deleteAbacusStudent(s.id).then(() => {
                                setStudents((prev) => prev.filter((x) => x.id !== s.id));
                                toast({ title: 'Student removed' });
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!students.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        No students yet. Add manually or upload CSV.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog
          open={teacherDialogOpen}
          onOpenChange={(open) => {
            setTeacherDialogOpen(open);
            if (!open) {
              setEditingTeacherId(null);
              setTeacherForm({ fullName: '', username: '', password: '', phone: '', category: '', level: '' });
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTeacherId ? 'Edit teacher' : 'Add teacher'}</DialogTitle>
              <DialogDescription>
                {editingTeacherId
                  ? 'Update teacher details. Leave password blank to keep the current one.'
                  : selectedSchool
                    ? `School: ${selectedSchool.name} (${getSchoolLetterPrefix(selectedSchool)}) + ABS + tech + 3 digits — e.g. ${getTeacherUsernameBase(selectedSchool)}001`
                    : 'Username is generated automatically from the school name.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className={FIELD}
                  value={teacherForm.fullName}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{editingTeacherId ? 'Username' : 'Username (auto-generated)'}</Label>
                <Input className={`${FIELD} font-mono`} value={teacherForm.username} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  className={FIELD}
                  type="password"
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingTeacherId ? 'Leave blank to keep current password' : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  className={FIELD}
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <CategoryLevelFields
                catalog={catalog}
                category={teacherForm.category}
                level={teacherForm.level}
                onCategoryChange={(v) => setTeacherForm((f) => ({ ...f, category: v, level: '' }))}
                onLevelChange={(v) => setTeacherForm((f) => ({ ...f, level: v }))}
                onCatalogUpdated={setCatalog}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTeacherDialogOpen(false)}>Cancel</Button>
              <Button className={SA_BTN_PRIMARY} disabled={saving} onClick={() => void saveTeacher()}>
                {editingTeacherId ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign students</DialogTitle>
              <DialogDescription>
                {assignTeacher
                  ? `Select students for ${assignTeacher.fullName} (${assignTeacher.category} · ${assignTeacher.level})`
                  : 'Select students for this teacher'}
              </DialogDescription>
            </DialogHeader>
            {assignLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading students…
              </div>
            ) : assignCandidates.length ? (
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {assignCandidates.map((s) => {
                  const checked = assignSelectedIds.includes(s.id);
                  const assignedElsewhere = Boolean(s.teacherId && !s.assigned && s.teacherName);
                  return (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setAssignSelectedIds((prev) =>
                            v ? [...prev, s.id] : prev.filter((id) => id !== s.id),
                          );
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900">{s.fullName}</span>
                        <span className="block text-xs text-slate-500">
                          {abacusDisplayUsername(s)}
                          {s.className ? ` · ${s.className}` : ''}
                          {assignedElsewhere ? ` · assigned to ${s.teacherName}` : ''}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                No students in this category and level yet.
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button
                className={SA_BTN_PRIMARY}
                disabled={saving || assignLoading}
                onClick={() => void saveAssign()}
              >
                Save assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={studentDialogOpen}
          onOpenChange={(open) => {
            setStudentDialogOpen(open);
            if (!open) {
              setEditingStudentId(null);
              setStudentForm({ fullName: '', username: '', password: '', className: '', category: '', level: '' });
            }
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingStudentId ? 'Edit student' : 'Add student'}</DialogTitle>
              <DialogDescription>
                {editingStudentId
                  ? 'Update student details. Leave password blank to keep the current one.'
                  : selectedSchool
                    ? `School: ${selectedSchool.name} (${getSchoolLetterPrefix(selectedSchool)}) + ABS + 5 digits — e.g. ${getStudentUsernameBase(selectedSchool)}00001`
                    : 'Username is generated automatically from the school name.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className={FIELD}
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{editingStudentId ? 'Username' : 'Username (auto-generated)'}</Label>
                <Input className={`${FIELD} font-mono`} value={studentForm.username} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  className={FIELD}
                  type="password"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editingStudentId ? 'Leave blank to keep current password' : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Input
                  className={FIELD}
                  value={studentForm.className}
                  onChange={(e) => setStudentForm((f) => ({ ...f, className: e.target.value }))}
                  placeholder="Optional class label"
                />
              </div>
              <CategoryLevelFields
                catalog={catalog}
                category={studentForm.category}
                level={studentForm.level}
                onCategoryChange={(v) => setStudentForm((f) => ({ ...f, category: v, level: '' }))}
                onLevelChange={(v) => setStudentForm((f) => ({ ...f, level: v }))}
                onCatalogUpdated={setCatalog}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
              <Button className={SA_BTN_PRIMARY} disabled={saving} onClick={() => void saveStudent()}>
                {editingStudentId ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SuperAdminInnerPage>
    );
  }

  return (
    <SuperAdminInnerPage
      toolbar={
        <SuperAdminToolbar>
          <p className="text-sm text-slate-600">
            Abacus API: separate backend (port 5001). Same MongoDB — no school admin dashboard.
          </p>
          <Button className={SA_BTN_PRIMARY} onClick={() => { resetSchoolForm(); setSchoolDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add school
          </Button>
        </SuperAdminToolbar>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <button
            key={school.id}
            type="button"
            onClick={() => openSchool(school)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <Building2 className="h-8 w-8 text-emerald-600" />
              <Badge variant="outline">{school.schoolCode}</Badge>
            </div>
            <h3 className="font-semibold text-slate-900">{school.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{school.place || school.contactPerson || 'Abacus school'}</p>
            <div className="mt-4 flex gap-4 text-xs text-slate-600">
              <span>{school.stats?.teachers ?? 0} teachers</span>
              <span>{school.stats?.students ?? 0} students</span>
            </div>
          </button>
        ))}
        {!schools.length && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center text-slate-500">
            No Abacus schools yet. Click &quot;Add school&quot; to create one.
          </div>
        )}
      </div>

      <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Abacus school</DialogTitle>
            <DialogDescription>School details only — no admin login is created.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>School name *</Label>
              <Input className={FIELD} value={schoolForm.name} onChange={(e) => setSchoolForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Contact person</Label>
              <Input className={FIELD} value={schoolForm.contactPerson} onChange={(e) => setSchoolForm((f) => ({ ...f, contactPerson: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input className={FIELD} value={schoolForm.phone} onChange={(e) => setSchoolForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City / Place</Label>
              <Input className={FIELD} value={schoolForm.place} onChange={(e) => setSchoolForm((f) => ({ ...f, place: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input className={FIELD} value={schoolForm.state} onChange={(e) => setSchoolForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>PIN</Label>
              <Input className={FIELD} value={schoolForm.pin} onChange={(e) => setSchoolForm((f) => ({ ...f, pin: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Input className={FIELD} value={schoolForm.notes} onChange={(e) => setSchoolForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchoolDialogOpen(false)}>Cancel</Button>
            <Button className={SA_BTN_PRIMARY} disabled={saving || !schoolForm.name.trim()} onClick={() => void saveSchool()}>
              Save school
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminInnerPage>
  );
}
