import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Youtube } from "lucide-react";
import ProductCurriculumPanel from "@/components/super-admin/product-curriculum-panel";
import SuperAdminLearningPaths from "@/components/super-admin/super-admin-learning-paths";

export default function ProductCurriculumHub() {
  const [tab, setTab] = useState("curriculum");

  return (
    <div className="sa-premium-scope w-full max-w-[1920px] mx-auto pb-12">
      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--brand-emerald)] mb-1">
              Content studio
            </p>
            <h1 className="text-2xl font-semibold text-[var(--brand-navy)] tracking-tight">
              {tab === "curriculum" ? "Curriculum & uploads" : "Learning paths"}
            </h1>
          </div>
          <TabsList className="h-11 shrink-0 inline-flex bg-slate-100/90 p-1 rounded-xl">
            <TabsTrigger
              value="curriculum"
              className="rounded-lg gap-2 px-5 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-4 w-4" />
              Curriculum
            </TabsTrigger>
            <TabsTrigger
              value="learning-paths"
              className="rounded-lg gap-2 px-5 data-[state=active]:bg-[var(--brand-emerald)] data-[state=active]:text-white"
            >
              <Youtube className="h-4 w-4" />
              Learning paths
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="curriculum" className="mt-0 focus-visible:outline-none">
          <ProductCurriculumPanel />
        </TabsContent>
        <TabsContent value="learning-paths" className="mt-0 focus-visible:outline-none">
          <SuperAdminLearningPaths />
        </TabsContent>
      </Tabs>
    </div>
  );
}
