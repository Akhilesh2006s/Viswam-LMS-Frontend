import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Users,
  GraduationCap,
  UserPlus,
  BookOpen,
  Loader2,
  Lock,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import {
  fetchAdminProductWorkspace,
  productLabel,
  type ProductWorkspace,
} from "@/lib/products";
import { cn } from "@/lib/utils";

type Props = {
  schoolName?: string;
  onNavigate: (tab: string) => void;
};

type StudentRow = { assignedClass?: string; id?: string; _id?: string };

export default function AdminHome({ schoolName, onNavigate }: Props) {
  const [workspace, setWorkspace] = useState<ProductWorkspace | null>(null);
  const [stats, setStats] = useState({ students: 0, teachers: 0, classes: 0 });
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      };

      const [w, statsRes, studentsRes] = await Promise.all([
        fetchAdminProductWorkspace(),
        fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/admin/students`, { headers }).catch(() => null),
      ]);

      setWorkspace(w);

      if (statsRes?.ok) {
        const j = await statsRes.json();
        const d = j.data || j;
        setStats({
          students: d.totalStudents ?? d.students ?? 0,
          teachers: d.totalTeachers ?? d.teachers ?? 0,
          classes: d.totalClasses ?? d.classes ?? 0,
        });
      }

      if (studentsRes?.ok) {
        const j = await studentsRes.json();
        const list: StudentRow[] = j.data || j || [];
        const counts: Record<string, number> = {};
        for (const s of list) {
          const cid = String(s.assignedClass || "");
          if (!cid) continue;
          counts[cid] = (counts[cid] || 0) + 1;
        }
        setClassCounts(counts);
      }

      setLoading(false);
    };
    load();
  }, []);

  const assignments = workspace?.admin.productAssignments || [];
  const products = workspace?.products || [];
  const classes = workspace?.classes || [];

  const classesByProduct = useMemo(() => {
    const map = new Map<string, typeof classes>();
    for (const a of assignments) {
      const code = a.productCode;
      const inRange = classes.filter((c) => {
        const n = parseInt(String(c.classNumber).replace(/\D/g, ""), 10);
        const from = parseInt(a.classesFrom, 10);
        const to = parseInt(a.classesTo, 10);
        if (!Number.isFinite(n) || !Number.isFinite(from) || !Number.isFinite(to)) return false;
        return n >= Math.min(from, to) && n <= Math.max(from, to);
      });
      map.set(`${code}-${a.classesFrom}-${a.classesTo}`, inRange);
    }
    return map;
  }, [assignments, classes]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!assignments.length) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-12 text-center text-sm text-slate-600">
          No book products assigned yet. Contact your platform administrator to configure your
          school license.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {schoolName || "Your school"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Licensed products and per-class capacity set by platform admin. Add teachers and
            students to the classes below (each class has its own student limit).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate("teachers")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Teachers
          </Button>
          <Button size="sm" onClick={() => onNavigate("students")}>
            <Users className="mr-2 h-4 w-4" />
            Students
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Students</p>
              <p className="text-xl font-semibold text-slate-900">{stats.students}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Teachers</p>
              <p className="text-xl font-semibold text-slate-900">{stats.teachers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Classes</p>
              <p className="text-xl font-semibold text-slate-900">{classes.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <Package className="h-4 w-4" />
          Your book products
        </h2>
        {assignments.map((a, i) => {
          const perClass = a.maxStrengthPerClass ?? a.maxStrength ?? 0;
          const slots =
            a.classSlotsInRange ??
            (() => {
              const from = parseInt(a.classesFrom, 10);
              const to = parseInt(a.classesTo, 10);
              if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
              return Math.max(0, Math.max(from, to) - Math.min(from, to) + 1);
            })();
          const totalMax = a.totalMaxStrength ?? perClass * slots;
          const used = a.currentCount ?? 0;
          const pct = totalMax > 0 ? Math.min(100, (used / totalMax) * 100) : 0;
          const key = `${a.productCode}-${a.classesFrom}-${a.classesTo}`;
          const linkedClasses =
            classesByProduct.get(key) ||
            classes.filter((c) => {
              const n = parseInt(String(c.classNumber).replace(/\D/g, ""), 10);
              const from = parseInt(a.classesFrom, 10);
              const to = parseInt(a.classesTo, 10);
              if (!Number.isFinite(n) || !Number.isFinite(from) || !Number.isFinite(to)) return false;
              return n >= Math.min(from, to) && n <= Math.max(from, to);
            });

          return (
            <Card key={key} className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 bg-slate-50/80 border-b border-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      {productLabel(a.productCode, products)}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Classes {a.classesFrom}–{a.classesTo}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      a.isFull ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200",
                    )}
                  >
                    <Lock className="h-3 w-3" />
                    {perClass} per class
                    {slots > 0 ? ` · ${used} / ${totalMax} total` : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Total capacity ({perClass} × {slots} classes)</span>
                    <span>{a.remaining ?? Math.max(0, totalMax - used)} seats left</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                {linkedClasses.length > 0 ? (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Classes in this range</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {linkedClasses.map((c) => {
                        const enrolled = classCounts[c._id] || 0;
                        const classFull = perClass > 0 && enrolled >= perClass;
                        const classPct =
                          perClass > 0 ? Math.min(100, (enrolled / perClass) * 100) : 0;
                        return (
                          <div
                            key={c._id}
                            className={cn(
                              "rounded-lg border bg-white px-3 py-2.5 text-sm",
                              classFull ? "border-red-100" : "border-slate-100",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-800">
                                Class {c.classNumber}
                                {c.section ? `-${c.section}` : ""}
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-medium tabular-nums",
                                  classFull ? "text-red-700" : "text-slate-600",
                                )}
                              >
                                {enrolled} / {perClass}
                              </span>
                            </div>
                            <Progress value={classPct} className="h-1.5 mt-2" />
                            <span className="text-slate-500 text-xs block mt-1">
                              {classFull
                                ? "Full"
                                : `${Math.max(0, perClass - enrolled)} seat${perClass - enrolled !== 1 ? "s" : ""} left`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                    Classes for this range are being set up. Refresh shortly or contact support if
                    this persists.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Learning Paths and EduOTT are available from the sidebar. Timetable and Calendar are under
        their menu items.
      </p>
    </div>
  );
}
