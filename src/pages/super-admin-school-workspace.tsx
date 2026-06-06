import { Suspense, lazy, useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_BASE_URL } from '@/lib/api-config';
import { ViswamLogo } from '@/components/brand/ViswamLogo';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Users,
  UserPlus,
  Building2,
  Sparkles,
} from 'lucide-react';

const ClassDashboard = lazy(() => import('@/components/admin/class-dashboard'));
const UserManagement = lazy(() => import('@/components/admin/user-management'));
const TeacherManagement = lazy(() => import('@/components/admin/teacher-management'));

const fallback = (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-100/60 bg-white/80 py-16 text-center backdrop-blur-sm">
    <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
    <p className="text-sm font-medium text-slate-600">Loading workspace…</p>
  </div>
);

type SchoolProfile = {
  schoolName?: string;
  name?: string;
  email?: string;
  board?: string;
  status?: string;
  schoolCode?: string;
};

const TAB_CLASS =
  'gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all data-[state=active]:text-white';

export default function SuperAdminSchoolWorkspace() {
  const [, params] = useRoute('/super-admin/schools/:id');
  const [, setLocation] = useLocation();
  const schoolAdminId = params?.id || '';
  const [tab, setTab] = useState('classes');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [stats, setStats] = useState({ students: 0, teachers: 0 });

  useEffect(() => {
    if (!schoolAdminId) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLocation('/auth/login');
      return;
    }
    setLoading(true);
    fetch(`${API_BASE_URL}/api/super-admin/admins/${schoolAdminId}/school-detail`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.message || 'Failed to load school');
        setProfile(json.data?.profile || null);
        setStats({
          students: json.data?.stats?.students ?? 0,
          teachers: json.data?.stats?.teachers ?? 0,
        });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [schoolAdminId, setLocation]);

  const schoolTitle = profile?.schoolName || profile?.name || 'School workspace';

  return (
    <div className="viswam-school-workspace-shell min-h-screen">
      <header className="viswam-premium-topnav sticky top-0 z-30">
        <div className="viswam-premium-topnav-inner max-w-[1200px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-emerald-200/80 bg-white/90 hover:bg-emerald-50"
              onClick={() => setLocation('/super-admin/dashboard?sa_view=admins')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Schools
            </Button>
            <ViswamLogo subtitle="School workspace" variant="dark" size="sm" showCompany={false} />
          </div>
          {!loading && profile ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-emerald-600 hidden sm:block" />
              <span className="font-semibold text-[var(--brand-navy)] truncate max-w-[220px] sm:max-w-none">
                {schoolTitle}
              </span>
              <Badge className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
                {profile.status || 'Active'}
              </Badge>
            </div>
          ) : null}
        </div>
      </header>

      <main className="viswam-premium-main viswam-school-workspace-centered px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24 text-slate-600">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-emerald)]" />
            <p className="text-sm font-medium">Opening school workspace…</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="viswam-school-workspace-hero relative">
              <div className="relative z-[1] flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 text-left">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium school hub
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-3xl">
                    {schoolTitle}
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-600 leading-relaxed">
                    Classes, students, teachers, and period content — one place. Changes sync across web and
                    mobile for this school.
                  </p>
                  {profile?.email ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Admin login · <span className="font-medium text-slate-700">{profile.email}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                  <div className="viswam-school-workspace-hero-stat">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Students</p>
                    <p className="text-2xl font-bold text-[var(--brand-navy)]">{stats.students}</p>
                  </div>
                  <div className="viswam-school-workspace-hero-stat">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Teachers</p>
                    <p className="text-2xl font-bold text-[var(--brand-navy)]">{stats.teachers}</p>
                  </div>
                  {profile?.schoolCode ? (
                    <div className="viswam-school-workspace-hero-stat">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Code</p>
                      <p className="text-lg font-bold text-[var(--brand-navy)]">{profile.schoolCode}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            <Tabs value={tab} onValueChange={setTab} className="space-y-5">
              <TabsList className="viswam-school-workspace-tabs w-full h-auto flex flex-wrap justify-start gap-1 bg-transparent border-0 shadow-none p-1">
                <TabsTrigger value="classes" className={TAB_CLASS}>
                  <GraduationCap className="h-4 w-4" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="students" className={TAB_CLASS}>
                  <Users className="h-4 w-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="teachers" className={TAB_CLASS}>
                  <UserPlus className="h-4 w-4" />
                  Teachers
                </TabsTrigger>
              </TabsList>

              <div className={cn('viswam-school-workspace-content min-h-[360px]')}>
                <TabsContent value="classes" className="mt-0">
                  <Suspense fallback={fallback}>
                    <ClassDashboard schoolAdminId={schoolAdminId} readOnly={false} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="students" className="mt-0">
                  <Suspense fallback={fallback}>
                    <UserManagement schoolAdminId={schoolAdminId} />
                  </Suspense>
                </TabsContent>
                <TabsContent value="teachers" className="mt-0">
                  <Suspense fallback={fallback}>
                    <TeacherManagement schoolAdminId={schoolAdminId} />
                  </Suspense>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
