import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  LogOut,
  Sparkles,
  Users,
  Clock,
  BookMarked,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassCard } from "@/components/teacher/ClassCard";
import { TeacherLearningPathsPanel } from "@/components/teacher/TeacherLearningPathsPanel";
import { TeacherPeriodsPanel } from "@/components/teacher/TeacherPeriodsPanel";
import { TeacherOttPanel } from "@/components/teacher/TeacherOttPanel";
import {
  fetchTeacherDashboard,
  type TeacherProductScope,
} from "@/lib/teacher-api";

type AssignedClass = {
  id: string;
  name: string;
  classNumber?: string;
  section?: string;
  subject?: string;
  schedule?: string;
  room?: string;
  studentCount?: number;
  assignedSubjects?: { name?: string }[];
};

type DashboardStats = {
  totalStudents: number;
  totalClasses: number;
  totalVideos: number;
  averagePerformance: number;
};

export function TeacherPortalHome() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [productScope, setProductScope] = useState<TeacherProductScope | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const teacherEmail = localStorage.getItem("userEmail") || "Teacher";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const data = await fetchTeacherDashboard();
    if (data) {
      setStats((data.stats as DashboardStats) || null);
      setProductScope((data.productScope as TeacherProductScope) || null);
      setAssignedClasses((data.assignedClasses as AssignedClass[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboard();
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam === "content" || tabParam === "periods" || tabParam === "classes" || tabParam === "overview" || tabParam === "ott") {
      setTab(tabParam);
    }
  }, [loadDashboard]);

  const productFilterBar = useMemo(
    () => (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Filter by product:</span>
        <Button
          size="sm"
          variant={selectedProduct === "all" ? "default" : "outline"}
          onClick={() => setSelectedProduct("all")}
        >
          All
        </Button>
        {(productScope?.products || []).map((p) => (
          <Button
            key={p.productCode}
            size="sm"
            variant={selectedProduct === p.productCode ? "default" : "outline"}
            onClick={() => setSelectedProduct(p.productCode)}
          >
            {p.productName}
          </Button>
        ))}
      </div>
    ),
    [productScope?.products, selectedProduct],
  );

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    setLocation("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Teacher Portal</p>
              <h1 className="font-semibold text-slate-900 truncate">{teacherEmail}</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Students", value: stats?.totalStudents ?? 0, icon: Users },
            { label: "Classes", value: stats?.totalClasses ?? 0, icon: Layers },
            { label: "Products", value: productScope?.products?.length ?? 0, icon: BookMarked },
            { label: "Avg score", value: `${stats?.averagePerformance ?? 0}%`, icon: Sparkles },
          ].map((item) => (
            <Card key={item.label} className="border-slate-200/80 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">My Content</TabsTrigger>
            <TabsTrigger value="ott" className="gap-1.5">
              <Tv className="h-3.5 w-3.5" />
              Viswam OTT
            </TabsTrigger>
            <TabsTrigger value="periods">Periods</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <Card className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  Your assigned products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!productScope?.products?.length ? (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    No products assigned yet. Ask your school admin to assign book products,
                    classes/levels, and subjects in Teacher Management.
                  </p>
                ) : (
                  productScope.products.map((product) => (
                    <motion.div
                      key={product.productCode}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <p className="font-semibold text-slate-900">{product.productName}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {product.structureType === "level_based" ? "Level-based" : "Class-based"}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {product.slots.map((slot) => (
                          <div
                            key={`${product.productCode}-${slot.classNumber}`}
                            className="rounded-lg bg-white border border-slate-100 px-3 py-2"
                          >
                            <p className="text-sm font-medium text-slate-800">{slot.label}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {slot.subjects.length
                                ? slot.subjects.join(" · ")
                                : `All ${slot.tag}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-0">
            {productFilterBar}
            <TeacherLearningPathsPanel
              productScope={productScope}
              selectedProduct={selectedProduct}
            />
          </TabsContent>

          <TabsContent value="ott" className="space-y-4 mt-0">
            <TeacherOttPanel />
          </TabsContent>

          <TabsContent value="periods" className="space-y-4 mt-0">
            <Card className="border-slate-200/80">
              <CardHeader className="pb-2 border-b bg-slate-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Assigned product periods
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {productFilterBar}
                <TeacherPeriodsPanel
                  productScope={productScope}
                  selectedProduct={selectedProduct}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="mt-0">
            {assignedClasses.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-slate-500 text-sm">
                  No classes assigned yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedClasses.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    name={cls.name}
                    subject={cls.subject || "General"}
                    studentCount={cls.studentCount ?? 0}
                    schedule={cls.schedule || "Not scheduled"}
                    room={cls.room || "—"}
                    expanded={expandedClassId === cls.id}
                    onToggleStudents={() =>
                      setExpandedClassId((prev) => (prev === cls.id ? null : cls.id))
                    }
                    students={[]}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
