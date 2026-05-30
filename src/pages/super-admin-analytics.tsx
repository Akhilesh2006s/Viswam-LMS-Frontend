import { useState, useEffect } from "react";
import { fetchPlatformOttAnalytics, type PlatformOttAnalytics } from "@/lib/ott/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3Icon,
  UsersIcon,
  TrendingUpIcon,
  BookIcon,
  CrownIcon,
  AwardIcon,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";
import {
  SuperAdminInnerPage,
  SuperAdminStatCard,
  SuperAdminEmptyState,
  SuperAdminInnerCard,
} from "@/components/super-admin/premium";

export type SchoolSummary = {
  id: string;
  name: string;
  email: string;
};

type SuperAdminAnalyticsDashboardProps = {
  onSelectSchool?: (admin: SchoolSummary) => void;
};

export default function SuperAdminAnalyticsDashboard({ onSelectSchool }: SuperAdminAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any[] | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ottStats, setOttStats] = useState<PlatformOttAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchPlatformOttAnalytics().then(setOttStats);
    const handleAdminDeleted = () => fetchAnalytics();
    window.addEventListener("adminDeleted", handleAdminDeleted);
    return () => window.removeEventListener("adminDeleted", handleAdminDeleted);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const [adminsResponse, statsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/super-admin/admins`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }),
        fetch(`${API_BASE_URL}/api/super-admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }),
      ]);

      if (adminsResponse.ok) {
        const data = await adminsResponse.json();
        setAnalytics(data.data);
      }
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDashboardStats(statsData?.data || null);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({ title: "Error", description: "Failed to load analytics", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const totalContentFromAdmins =
    analytics?.reduce(
      (sum, admin) =>
        sum + (admin.stats?.videos || 0) + (admin.stats?.assessments || 0) + (admin.stats?.exams || 0),
      0,
    ) || 0;
  const totalContentFromStats =
    (dashboardStats?.totalContent || dashboardStats?.courses || 0) +
    (dashboardStats?.assessments || 0) +
    (dashboardStats?.exams || 0);
  const totalContentDisplay = totalContentFromStats || totalContentFromAdmins;
  const totalStudents =
    analytics?.reduce((sum, admin) => sum + (admin.stats?.students || 0), 0) || 0;
  const totalTeachers =
    analytics?.reduce((sum, admin) => sum + (admin.stats?.teachers || 0), 0) || 0;

  if (isLoading) {
    return (
      <SuperAdminInnerPage>
        <SuperAdminEmptyState icon={BarChart3Icon} title="Loading analytics" description="Aggregating school performance…" />
      </SuperAdminInnerPage>
    );
  }

  return (
    <SuperAdminInnerPage>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SuperAdminStatCard label="School admins" value={analytics?.length || 0} icon={CrownIcon} accent="gold" hint="Active administrators" />
        <SuperAdminStatCard label="Total students" value={totalStudents} icon={UsersIcon} accent="emerald" hint="Across all schools" />
        <SuperAdminStatCard label="Total teachers" value={totalTeachers} icon={AwardIcon} accent="sky" />
        <SuperAdminStatCard label="Learning assets" value={totalContentDisplay} icon={BookIcon} accent="navy" hint="Videos, assessments, exams" />
      </div>

      {ottStats ? (
        <SuperAdminInnerCard
          title="VISWAM OTT — Platform streaming"
          description="Watch time and completions across all schools"
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SuperAdminStatCard label="Watch hours" value={ottStats.totalWatchHours} icon={TrendingUpIcon} accent="emerald" />
            <SuperAdminStatCard label="Sessions" value={ottStats.totalWatchSessions} icon={BarChart3Icon} accent="sky" />
            <SuperAdminStatCard label="Completed" value={ottStats.videosCompleted} icon={BookIcon} accent="gold" />
            <SuperAdminStatCard label="Completion rate" value={`${ottStats.completionRate}%`} icon={AwardIcon} accent="navy" />
          </div>
        </SuperAdminInnerCard>
      ) : null}

      <SuperAdminInnerCard
        title="School performance overview"
        description="Tap a school to drill into detailed metrics"
      >
        <div className="space-y-3">
          {analytics?.map((admin) => {
            const schoolId = String(admin.id || admin._id || "");
            const interactive = Boolean(onSelectSchool && schoolId);
            return (
              <div
                key={schoolId || admin.email}
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                onClick={
                  interactive
                    ? () =>
                        onSelectSchool!({
                          id: schoolId,
                          name: admin.name || admin.schoolName || "School",
                          email: admin.email || "",
                        })
                    : undefined
                }
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectSchool!({
                            id: schoolId,
                            name: admin.name || admin.schoolName || "School",
                            email: admin.email || "",
                          });
                        }
                      }
                    : undefined
                }
                className={`flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-r from-white to-slate-50/80 p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                  interactive ? "cursor-pointer hover:border-emerald-300/60 hover:shadow-md" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-navy)]/8">
                    <Building2 className="h-5 w-5 text-[var(--brand-navy)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{admin.schoolName || admin.name}</p>
                    <p className="text-sm text-slate-500">{admin.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                        {admin.stats?.students || 0} students
                      </Badge>
                      <Badge variant="outline" className="rounded-lg border-slate-200 text-xs">
                        {admin.stats?.teachers || 0} teachers
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 sm:text-right">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Avg score</p>
                    <p className="text-2xl font-bold text-[var(--brand-emerald)]">{admin.stats?.averageScore || "0"}%</p>
                  </div>
                  {interactive ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-navy)]">
                      Open <ArrowUpRight className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!analytics?.length ? (
            <p className="py-8 text-center text-sm text-slate-500">No schools registered yet.</p>
          ) : null}
        </div>
      </SuperAdminInnerCard>

      <Card className="sa-inner-card border-slate-200/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <TrendingUpIcon className="h-5 w-5 text-[var(--brand-emerald)]" />
            Platform summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Total exams taken</p>
            <p className="text-xl font-bold text-slate-900">
              {analytics?.reduce((s, a) => s + (a.stats?.totalExamsTaken || 0), 0) || 0}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Avg accuracy</p>
            <p className="text-xl font-bold text-slate-900">
              {analytics?.length
                ? (
                    analytics.reduce((s, a) => s + parseFloat(a.stats?.averageAccuracy || "0"), 0) / analytics.length
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Schools active</p>
            <p className="text-xl font-bold text-slate-900">{analytics?.filter((a) => a.status === "active").length || 0}</p>
          </div>
        </CardContent>
      </Card>
    </SuperAdminInnerPage>
  );
}
