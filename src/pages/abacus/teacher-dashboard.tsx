import { useLocation, useSearch } from 'wouter';
import { GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AbacusStatCard } from '@/components/abacus/AbacusActionCard';
import { AbacusTeacherChrome } from '@/components/abacus/AbacusTeacherChrome';
import {
  AbacusDashboardSkeleton,
  AbacusWelcomeBanner,
} from '@/components/abacus/AbacusPortalShell';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';
import { usePageTitle } from '@/hooks/use-page-title';
import {
  abacusTeacherDashboardTab,
  abacusTeacherNavActiveId,
} from '@/lib/abacus-teacher-nav';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

export default function AbacusTeacherDashboard() {
  usePageTitle('Abacus Teacher');
  const { loading, profile, error } = useAbacusPortal({ role: 'teacher' });
  const [pathname] = useLocation();
  const search = useSearch();
  const activeTab = abacusTeacherDashboardTab(pathname, search);
  const activeNavId = abacusTeacherNavActiveId(pathname, search);

  if (loading || !profile) {
    return (
      <div className="min-h-screen p-4 sm:p-6">
        <AbacusDashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  const students = profile.students ?? [];
  const studentCount = profile.stats?.students ?? students.length;

  return (
    <AbacusTeacherChrome activeId={activeNavId} profile={profile}>
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <AbacusWelcomeBanner profile={profile} roleLabel="Teacher Portal" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AbacusStatCard label="My Students" value={studentCount} hint="Same category & level" />
            <AbacusStatCard label="Category" value={profile.user.category} />
            <AbacusStatCard label="Level" value={profile.user.level} />
            <AbacusStatCard
              label="School"
              value={profile.school?.schoolCode ?? '—'}
              hint={profile.school?.name}
            />
          </div>

          {students.length > 0 ? (
            <Card className="border-slate-200/80 bg-white/90">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Students snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {students.slice(0, 4).map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{student.fullName}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                    <Badge variant="secondary">
                      {student.className ? `Class ${student.className}` : student.level}
                    </Badge>
                  </div>
                ))}
                {students.length > 4 ? (
                  <a
                    href={`${ABACUS_ROUTES.teacherDashboard}?tab=students`}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    View all {students.length} students →
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">My students</h2>
            <p className="text-sm text-slate-600">
              Students in {profile.user.category} · Level {profile.user.level}
              {profile.school ? ` at ${profile.school.name}` : ''}.
            </p>
          </div>

          {students.length === 0 ? (
            <Card className="border-dashed border-slate-200 bg-white/80">
              <CardContent className="py-12 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-900">No students assigned</p>
                <p className="mt-1 text-sm text-slate-500">
                  Students matching your category and level will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-slate-200/80 bg-white/90">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b bg-slate-50/90 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Class</th>
                      <th className="px-4 py-3 font-medium">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-slate-900">{student.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{student.email}</td>
                        <td className="px-4 py-3 text-slate-600">{student.className || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{student.level}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </AbacusTeacherChrome>
  );
}
