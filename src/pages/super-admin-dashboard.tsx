import { Suspense, lazy, useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { motion } from "framer-motion";
import SuperAdminSidebar from "@/components/dashboard/SuperAdminSidebar";
import { SuperAdminTopBar } from "@/components/super-admin/premium/SuperAdminTopBar";
import type { SuperAdminView } from "@/lib/super-admin-views";
const AdminManagement = lazy(() => import("@/components/admin/AdminManagement"));
const CombinedSuperAdminAnalytics = lazy(() => import("./combined-super-admin-analytics"));
const ProductManagement = lazy(() => import("@/components/super-admin/ProductManagement"));
const SubjectManagement = lazy(() => import("@/components/super-admin/subject-management"));
const ProductCurriculumHub = lazy(() => import("@/components/super-admin/ProductCurriculumHub"));
const SuperAdminOttStudio = lazy(() => import("@/components/super-admin/super-admin-ott-studio"));
const SuperAdminCalendar = lazy(() => import("@/components/super-admin/super-admin-calendar"));
const SuperAdminProductPeriods = lazy(() => import("@/components/super-admin/SuperAdminProductPeriods"));
const AbacusManagement = lazy(() => import("@/components/super-admin/AbacusManagement"));
const SubscriptionManagement = lazy(() => import("@/components/super-admin/subscription-management"));
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BellIcon, UsersIcon, Users2, TrendingUpIcon, BookIcon, UserPlusIcon, BookPlusIcon, SettingsIcon, DownloadIcon, HomeIcon, CrownIcon, BarChart3Icon, ArrowUpRightIcon, ArrowDownRightIcon, StarIcon, TargetIcon, BrainIcon, ZapIcon, AlertTriangleIcon, TrendingDownIcon, RefreshCw, Sparkles, MessageSquare, Clock, Plus, Monitor, Grid3x3, Shield, Search, Camera, PieChart, User, Download, Circle, Square, Bot, UploadIcon, BrainCircuitIcon, AlertTriangle } from "lucide-react";
import { LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api-config";
import { cn } from "@/lib/utils";
import { useSuperAdminDrawerNav } from "@/hooks/use-mobile";
import { ArrowLeft, Play } from "lucide-react";
import { SuperAdminPageHeader } from "@/components/super-admin/premium/SuperAdminPageHeader";
import { SuperAdminStatCard } from "@/components/super-admin/premium/SuperAdminStatCard";
import { SuperAdminActionTile } from "@/components/super-admin/premium/SuperAdminActionTile";
import { SuperAdminSection } from "@/components/super-admin/premium/SuperAdminSection";
import {
  GraduationCap,
  School,
  LineChart as LineChartIcon,
  FileStack,
  Users,
  TrendingUp,
  Activity,
  FileText as FileTextIcon,
  ClipboardCheck,
} from "lucide-react";
import { getUser } from "@/lib/auth-utils";
import {
  clearSuperAdminDashboardQueryFromUrl,
  consumeSuperAdminViewRestore,
  isRestorableSuperAdminView,
  parseSuperAdminViewFromHash,
  parseSuperAdminViewFromQuery,
} from "@/lib/super-admin-nav";

const lazySectionFallback = (
  <div className="sa-premium-loading">
    <RefreshCw className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
    <p className="text-sm font-medium text-slate-600">Loading premium workspace…</p>
  </div>
);

export default function SuperAdminDashboard() {
  usePageTitle('Super Admin');
  const { toast } = useToast();
  const superAdminDrawerNav = useSuperAdminDrawerNav();
  const [currentView, setCurrentView] = useState<SuperAdminView>("dashboard");
  const [user] = useState(() => {
    const stored = getUser();
    return {
      fullName: stored?.fullName || "Super Admin",
      role: "super-admin" as const,
      email: stored?.email || "super.admin@viswamedutech.com",
    };
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    courses: 0,
    assessments: 0,
    exams: 0,
    examResults: 0,
    activeVideos: 0,
    activeAssessments: 0,
    avgExamsPerStudent: 0,
    contentEngagement: 0,
    passRate: 0,
    activeStudents: 0,
    activeStudentsPercentage: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);
  useEffect(() => {
    const restore =
      parseSuperAdminViewFromQuery() ??
      parseSuperAdminViewFromHash() ??
      consumeSuperAdminViewRestore();
    if (restore) {
      setCurrentView(restore);
    }
    clearSuperAdminDashboardQueryFromUrl();
  }, []);

  useEffect(() => {
    const applyRestore = (view: SuperAdminView | null | undefined) => {
      if (view) setCurrentView(view);
    };
    const onHash = () => applyRestore(parseSuperAdminViewFromHash());
    const onSaRestore = (e: Event) => {
      const detail = (e as CustomEvent<{ view?: string }>).detail?.view;
      if (detail && isRestorableSuperAdminView(detail)) {
        applyRestore(detail);
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("viswam-sa-restore", onSaRestore);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("viswam-sa-restore", onSaRestore);
    };
  }, []);

  const handleViewChange = (view: SuperAdminView) => {
    const next = view === ("exams" as SuperAdminView) ? "dashboard" : view;
    setCurrentView(next);
    clearSuperAdminDashboardQueryFromUrl();
  };

  // Fetch real dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/super-admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        } else {
          console.error('Failed to fetch dashboard stats:', response.status);
          toast({
            title: "Error",
            description: "Failed to fetch dashboard statistics",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [toast]);

  // Defer heavy analytics request so first paint is faster.
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchRealtimeAnalytics();
    }, 1200);

    return () => {
      window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRealtimeAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/analytics/realtime`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRealtimeAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  /** Same page as sidebar “Subject & Content” (current design). */
  const openSubjectAndContent = () => {
    setCurrentView("subjects-and-content");
    clearSuperAdminDashboardQueryFromUrl();
  };

  const openAnalytics = () => {
    setCurrentView("analytics");
    clearSuperAdminDashboardQueryFromUrl();
  };

  const openStudentAnalytics = () => {
    setCurrentView("student-analytics");
    clearSuperAdminDashboardQueryFromUrl();
    void fetchRealtimeAnalytics();
  };

  // Chart data - will be populated from real analytics when available
  const [totalStudentsData, setTotalStudentsData] = useState<Array<{name: string, value: number}>>([]);
  const [passRateData, setPassRateData] = useState<Array<{name: string, value: number}>>([]);

  // Chart data will be populated from real analytics when available
  const [coursesPerBoardData, setCoursesPerBoardData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [studentsPerAdminData, setStudentsPerAdminData] = useState<Array<{[key: string]: string | number}>>([]);

  const renderDashboardContent = () => {
    return (
    <div className="sa-premium-scope space-y-6 overflow-x-hidden">
        <SuperAdminPageHeader
          title={`Welcome back, ${user.fullName.split(" ")[0]}`}
          description="Manage products, schools, content, and enterprise analytics from one command center."
          icon={CrownIcon}
          badge="Live"
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200"
              onClick={() => void fetchRealtimeAnalytics()}
              disabled={isLoadingAnalytics}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingAnalytics && "animate-spin")} />
              Refresh data
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SuperAdminStatCard
            label="Total students"
            value={isLoadingStats ? "…" : (stats.totalStudents || 0).toLocaleString()}
            icon={GraduationCap}
            accent="emerald"
            hint="Across all schools"
          />
          <SuperAdminStatCard
            label="School admins"
            value={isLoadingStats ? "…" : (stats.totalAdmins || 0).toLocaleString()}
            icon={School}
            accent="navy"
          />
          <SuperAdminStatCard
            label="Pass rate"
            value={isLoadingStats ? "…" : `${(stats.passRate || 0).toFixed(0)}%`}
            icon={TrendingUp}
            accent="gold"
          />
          <SuperAdminStatCard
            label="Active learners"
            value={
              isLoadingStats
                ? "…"
                : `${(stats.activeStudents || 0).toLocaleString()} (${stats.activeStudentsPercentage || 0}%)`
            }
            icon={Activity}
            accent="sky"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quick actions</h2>
          <SuperAdminActionTile
            title="Product catalog"
            subtitle="Define products schools subscribe to"
            icon={Users2}
            variant="navy"
            onClick={() => {
              setCurrentView("products");
              clearSuperAdminDashboardQueryFromUrl();
            }}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SuperAdminActionTile
              title="Subject & Content"
              subtitle="Videos, notes, and structured learning materials"
              icon={FileStack}
              variant="sky"
              onClick={openSubjectAndContent}
            />
            <SuperAdminActionTile
              title="Analytics"
              subtitle="School performance, content usage, and platform insights"
              icon={LineChartIcon}
              variant="emerald"
              onClick={openAnalytics}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={openStudentAnalytics}
          className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="sa-premium-icon-ring h-10 w-10">
                <Users className="h-4 w-4 text-[var(--brand-emerald)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student analytics</h3>
                <p className="text-sm text-slate-500">Engagement and assessment depth</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-[var(--brand-emerald)]">
              View details <ArrowUpRightIcon className="h-4 w-4" />
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Total students</p>
              <p className="text-lg font-bold text-slate-900">
                {isLoadingStats ? "…" : (stats.totalStudents || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Active students</p>
              <p className="text-lg font-bold text-emerald-700">
                {isLoadingStats ? "…" : (stats.activeStudents || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Avg exams / student</p>
              <p className="text-lg font-bold text-slate-900">
                {isLoadingStats ? "…" : (Number(stats.avgExamsPerStudent) || 0).toFixed(1)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-xs text-slate-600">
              <span>Content engagement</span>
              <span className="font-semibold text-slate-900">
                {isLoadingStats ? "…" : `${(stats.contentEngagement || 0).toFixed(0)}%`}
              </span>
            </div>
            <div className="sa-premium-progress">
              <div style={{ width: `${isLoadingStats ? 0 : stats.contentEngagement || 0}%` }} />
            </div>
          </div>
        </button>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Real-time analytics</h2>
          <Button
            onClick={() => void fetchRealtimeAnalytics()}
            disabled={isLoadingAnalytics}
            size="sm"
            className="rounded-xl bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingAnalytics && "animate-spin")} />
            Sync
          </Button>
        </div>

        {isLoadingAnalytics ? (
          <div className="sa-premium-loading">
            <BarChart3Icon className="h-10 w-10 animate-pulse text-[var(--brand-emerald)]" />
            <p className="text-sm text-slate-600">Loading live analytics…</p>
          </div>
        ) : realtimeAnalytics ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SuperAdminStatCard
                label="Total students"
                value={stats.totalStudents || realtimeAnalytics.overallMetrics?.totalStudents || 0}
                icon={GraduationCap}
                accent="emerald"
              />
              <SuperAdminStatCard
                label="Total exams"
                value={realtimeAnalytics.overallMetrics?.totalExams || 0}
                icon={FileTextIcon}
                accent="sky"
              />
              <SuperAdminStatCard
                label="Exam results"
                value={realtimeAnalytics.overallMetrics?.totalExamResults || 0}
                icon={ClipboardCheck}
                accent="gold"
              />
              <SuperAdminStatCard
                label="Overall average"
                value={`${realtimeAnalytics.overallMetrics?.overallAverage || 0}%`}
                icon={TrendingUp}
                accent="navy"
              />
            </div>

            {/* Top Scorers by Exam */}
            {realtimeAnalytics.topScorersByExam && realtimeAnalytics.topScorersByExam.length > 0 && (
              <Card className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Top scorers by exam</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realtimeAnalytics.topScorersByExam.slice(0, 3).map((exam: any, examIdx: number) => {
                      const colorSchemes = [
                        { bg: 'from-orange-300 to-orange-400', border: 'border-orange-200' },
                        { bg: 'from-sky-300 to-sky-400', border: 'border-sky-200' },
                        { bg: 'from-teal-400 to-teal-500', border: 'border-teal-200' }
                      ];
                      const colorScheme = colorSchemes[examIdx % 3];
                      
                      return (
                        <div key={`${exam.examId || exam.examTitle || 'exam'}-${examIdx}`} className={`border-2 ${colorScheme.border} rounded-lg p-4 bg-gradient-to-br ${colorScheme.bg} text-white`}>
                          <h4 className="font-semibold text-white mb-3">{exam.examTitle}</h4>
                          <div className="space-y-2">
                            {exam.topScorers.slice(0, 5).map((scorer: any, idx: number) => (
                              <div key={`${scorer.studentId || scorer.studentEmail || scorer.studentName || 'scorer'}-${idx}`} className="flex items-center justify-between p-2 bg-white/90 backdrop-blur-sm rounded border border-white/50 shadow-sm">
                                <div>
                                  <p className="font-medium text-gray-900">{scorer.studentName}</p>
                                  <p className="text-xs text-gray-600">{scorer.studentEmail}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-600">{scorer.percentage?.toFixed(1)}%</p>
                                  <p className="text-xs text-gray-600">{scorer.marks}/{scorer.totalMarks} marks</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low-performing Admins */}
            {realtimeAnalytics.lowPerformingAdmins && realtimeAnalytics.lowPerformingAdmins.length > 0 && (
              <Card className="rounded-2xl border-red-200/80 bg-red-50/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-900">
                    <AlertTriangleIcon className="mr-2 h-5 w-5" />
                    Schools needing attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realtimeAnalytics.lowPerformingAdmins.map((admin: any, idx: number) => (
                      <div key={`${admin.adminId || admin.adminEmail || admin.adminName || 'admin'}-${idx}`} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                        <div>
                          <p className="font-semibold text-gray-900">{admin.adminName}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{admin.adminEmail}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {admin.totalStudents} students • {admin.totalExams} exams
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-red-600">{admin.averageScore}%</p>
                          <p className="text-xs text-gray-600">Average Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Performance Overview */}
            {realtimeAnalytics.adminAnalytics && realtimeAnalytics.adminAnalytics.length > 0 && (
              <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-gradient-to-br from-slate-50 to-emerald-50/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-900">
                    <TrendingUpIcon className="mr-2 h-5 w-5 text-[var(--brand-emerald)]" />
                    School performance overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {realtimeAnalytics.adminAnalytics.slice(0, 5).map((admin: any, idx: number) => (
                      <div key={`${admin.adminId || admin.adminEmail || admin.adminName || 'admin'}-${idx}`} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900">{admin.adminName}</h3>
                            <p className="text-gray-600">{admin.adminEmail || `${admin.totalStudents} students`}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-base sm:text-lg">{admin.averageScore}%</p>
                            <p className="text-xs text-gray-600">Avg Score</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="sa-premium-loading">
            <BarChart3Icon className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-600">No analytics data available yet</p>
          </div>
        )}
      </div>

      {realtimeAnalytics && realtimeAnalytics.insights && realtimeAnalytics.insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Platform insights</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {realtimeAnalytics.insights.slice(0, 2).map((insight: any, index: number) => (
              <Card key={`${insight.id || insight.title || insight.description || 'insight'}-${index}`} className="rounded-2xl border-slate-200/80 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-emerald)]/10">
                      <BarChart3Icon className="h-5 w-5 text-[var(--brand-emerald)]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {insight.title || insight.description || 'Insight'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {insight.generatedAt ? new Date(insight.generatedAt).toLocaleString() : 'Recently generated'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderAdminsContent = () => (
    <Suspense fallback={lazySectionFallback}>
      <AdminManagement />
    </Suspense>
  );

  const renderAnalyticsContent = () => (
    <Suspense fallback={lazySectionFallback}>
      <CombinedSuperAdminAnalytics />
    </Suspense>
  );

  const renderStudentAnalyticsContent = () => (
    <div className="sa-premium-scope space-y-6 overflow-x-hidden">
      <SuperAdminPageHeader
        title="Student analytics"
        description="Engagement, assessments, and learner activity across all schools."
        icon={Users}
        badge="Live"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200"
            onClick={() => void fetchRealtimeAnalytics()}
            disabled={isLoadingAnalytics}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingAnalytics && "animate-spin")} />
            Sync
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SuperAdminStatCard
          label="Total students"
          value={isLoadingStats ? "…" : (stats.totalStudents || 0).toLocaleString()}
          icon={GraduationCap}
          accent="emerald"
        />
        <SuperAdminStatCard
          label="Active students"
          value={isLoadingStats ? "…" : (stats.activeStudents || 0).toLocaleString()}
          icon={Activity}
          accent="sky"
        />
        <SuperAdminStatCard
          label="Avg exams / student"
          value={isLoadingStats ? "…" : (Number(stats.avgExamsPerStudent) || 0).toFixed(1)}
          icon={FileTextIcon}
          accent="gold"
        />
        <SuperAdminStatCard
          label="Content engagement"
          value={isLoadingStats ? "…" : `${(stats.contentEngagement || 0).toFixed(0)}%`}
          icon={TrendingUp}
          accent="navy"
        />
      </div>

      {isLoadingAnalytics ? (
        <div className="sa-premium-loading">
          <BarChart3Icon className="h-10 w-10 animate-pulse text-[var(--brand-emerald)]" />
          <p className="text-sm text-slate-600">Loading live analytics…</p>
        </div>
      ) : realtimeAnalytics ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SuperAdminStatCard
              label="Total students"
              value={stats.totalStudents || realtimeAnalytics.overallMetrics?.totalStudents || 0}
              icon={GraduationCap}
              accent="emerald"
            />
            <SuperAdminStatCard
              label="Total exams"
              value={realtimeAnalytics.overallMetrics?.totalExams || 0}
              icon={FileTextIcon}
              accent="sky"
            />
            <SuperAdminStatCard
              label="Exam results"
              value={realtimeAnalytics.overallMetrics?.totalExamResults || 0}
              icon={ClipboardCheck}
              accent="gold"
            />
            <SuperAdminStatCard
              label="Overall average"
              value={`${realtimeAnalytics.overallMetrics?.overallAverage || 0}%`}
              icon={TrendingUp}
              accent="navy"
            />
          </div>

          {realtimeAnalytics.topScorersByExam && realtimeAnalytics.topScorersByExam.length > 0 && (
            <Card className="rounded-2xl border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Top scorers by exam</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {realtimeAnalytics.topScorersByExam.slice(0, 3).map((exam: any, examIdx: number) => {
                    const colorSchemes = [
                      { bg: 'from-orange-300 to-orange-400', border: 'border-orange-200' },
                      { bg: 'from-sky-300 to-sky-400', border: 'border-sky-200' },
                      { bg: 'from-teal-400 to-teal-500', border: 'border-teal-200' },
                    ];
                    const colorScheme = colorSchemes[examIdx % 3];

                    return (
                      <div
                        key={`${exam.examId || exam.examTitle || 'exam'}-${examIdx}`}
                        className={`border-2 ${colorScheme.border} rounded-lg p-4 bg-gradient-to-br ${colorScheme.bg} text-white`}
                      >
                        <h4 className="font-semibold text-white mb-3">{exam.examTitle}</h4>
                        <div className="space-y-2">
                          {exam.topScorers.slice(0, 5).map((scorer: any, idx: number) => (
                            <div
                              key={`${scorer.studentId || scorer.studentEmail || scorer.studentName || 'scorer'}-${idx}`}
                              className="flex items-center justify-between p-2 bg-white/90 backdrop-blur-sm rounded border border-white/50 shadow-sm"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{scorer.studentName}</p>
                                <p className="text-xs text-gray-600">{scorer.studentEmail}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-orange-600">{scorer.percentage?.toFixed(1)}%</p>
                                <p className="text-xs text-gray-600">
                                  {scorer.marks}/{scorer.totalMarks} marks
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="sa-premium-loading">
          <BarChart3Icon className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-600">No student analytics data available yet</p>
        </div>
      )}

      {realtimeAnalytics?.insights && realtimeAnalytics.insights.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Platform insights</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {realtimeAnalytics.insights.slice(0, 2).map((insight: any, index: number) => (
              <Card
                key={`${insight.id || insight.title || insight.description || 'insight'}-${index}`}
                className="rounded-2xl border-slate-200/80 shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-emerald)]/10">
                      <BarChart3Icon className="h-5 w-5 text-[var(--brand-emerald)]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {insight.title || insight.description || 'Insight'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {insight.generatedAt
                          ? new Date(insight.generatedAt).toLocaleString()
                          : 'Recently generated'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderSubscriptionsContent = () => (
    <Suspense fallback={lazySectionFallback}>
      <SubscriptionManagement />
    </Suspense>
  );

  const renderSettingsContent = () => (
    <SuperAdminSection view="settings">
      <div className="flex flex-col items-center justify-center py-10 text-center sm:py-14">
        <div className="sa-premium-icon-ring mb-5 h-16 w-16">
          <SettingsIcon className="h-7 w-7 text-[var(--brand-emerald)]" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Platform configuration</h3>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Shortcuts to core modules. Secrets and database URLs are configured on the server.
        </p>
        <Button
          type="button"
          className="mt-6 rounded-xl bg-[var(--brand-navy)] px-6 hover:bg-[var(--brand-navy-hover)]"
          onClick={() => setSystemSettingsOpen(true)}
        >
          Open settings hub
        </Button>
      </div>
    </SuperAdminSection>
  );

  const wrapWithSection = (view: SuperAdminView, node: React.ReactNode) => {
    if (
      view === "dashboard" ||
      view === "products" ||
      view === "subjects-and-content" ||
      view === "content" ||
      view === "viswam-ott"
    ) {
      return node;
    }
    return (
      <SuperAdminSection view={view} flush>
        {node}
      </SuperAdminSection>
    );
  };

  const renderContent = () => {
    const view = currentView;
    let body: React.ReactNode;
    switch (view) {
      case "dashboard":
        body = renderDashboardContent();
        break;
      case "products":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <ProductManagement />
          </Suspense>
        );
        break;
      case "admins":
        body = renderAdminsContent();
        break;
      case "abacus":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <AbacusManagement />
          </Suspense>
        );
        break;
      case "subjects-and-content":
      case "content":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <ProductCurriculumHub />
          </Suspense>
        );
        break;
      case "viswam-ott":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <SuperAdminOttStudio />
          </Suspense>
        );
        break;
      case "subjects":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <SubjectManagement />
          </Suspense>
        );
        break;
      case "periods":
        return (
          <SuperAdminSection view="periods" flush>
            <Suspense fallback={lazySectionFallback}>
              <SuperAdminProductPeriods />
            </Suspense>
          </SuperAdminSection>
        );
      case "calendar":
        body = (
          <Suspense fallback={lazySectionFallback}>
            <SuperAdminCalendar />
          </Suspense>
        );
        break;
      case "analytics":
        body = renderAnalyticsContent();
        break;
      case "student-analytics":
        body = renderStudentAnalyticsContent();
        break;
      case "subscriptions":
        body = renderSubscriptionsContent();
        break;
      case "settings":
        return renderSettingsContent();
      default:
        body = renderDashboardContent();
    }
    return wrapWithSection(view, body);
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminUser');
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('authToken');
    window.location.href = '/auth/login';
  };

  const isOttView = currentView === "viswam-ott";

  const systemSettingsDialog = (
    <Dialog open={systemSettingsOpen} onOpenChange={setSystemSettingsOpen}>
      <DialogContent className="rounded-2xl border-slate-200 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>System settings</DialogTitle>
          <DialogDescription>
            Shortcuts to main modules. Secrets and database URLs are set on the server, not here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-foreground">Quick links</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSystemSettingsOpen(false);
                  setCurrentView("calendar");
                }}
              >
                School Calendar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSystemSettingsOpen(false);
                  setCurrentView("admins");
                }}
              >
                School Management
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSystemSettingsOpen(false);
                  setCurrentView("subjects-and-content");
                }}
              >
                Subject &amp; Content
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSystemSettingsOpen(false);
                  setCurrentView("analytics");
                }}
              >
                Analytics
              </Button>
              <Button
                type="button"
                variant="outline"
                className="justify-start"
                onClick={() => {
                  setSystemSettingsOpen(false);
                  setCurrentView("subscriptions");
                }}
              >
                Subscriptions
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To change JWT secrets or database URLs, update the backend{" "}
            <code className="rounded bg-muted px-1">.env</code> and redeploy.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => setSystemSettingsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isOttView) {
    return (
      <div className="min-h-screen bg-[#f0fdf4]">
        <header className="sticky top-0 z-50 border-b border-emerald-200/60 bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              className="text-emerald-900 hover:bg-emerald-50"
              onClick={() => handleViewChange("dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Button>
            <div className="flex items-center gap-2 text-emerald-950">
              <Play className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold sm:text-base">Viswam OTT Studio</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </header>
        <main className="w-full">{renderContent()}</main>
        {systemSettingsDialog}
      </div>
    );
  }

  return (
    <div className="sa-premium-shell min-h-screen">
      <SuperAdminSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col overflow-x-hidden",
          superAdminDrawerNav ? "ml-0 pt-14 pb-20 sm:pb-0" : "sm:ml-[68px] lg:ml-[17.5rem]",
        )}
      >
        <main
          className={cn(
            "mx-auto w-full max-w-[1600px] flex-1",
            superAdminDrawerNav ? "px-3 py-4 sm:px-4" : "px-3 py-4 sm:px-5 lg:px-8 lg:py-6",
          )}
        >
          <SuperAdminTopBar currentView={currentView} userName={user.fullName} />
          {renderContent()}
        </main>
      </div>

      {systemSettingsDialog}
    </div>
  );
}
