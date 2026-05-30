import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Youtube } from "lucide-react";
import ProductCurriculumPanel from "@/components/super-admin/product-curriculum-panel";
import SuperAdminLearningPaths from "@/components/super-admin/super-admin-learning-paths";

export default function ProductCurriculumHub() {
  const [tab, setTab] = useState("curriculum");

  return (
    <div className="space-y-6 w-full max-w-[1800px]">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--brand-navy)] tracking-tight">Content studio</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-3xl">
          Build curriculum from your book products (classes, subjects, uploads). Add YouTube learning
          paths here. Uploaded streaming videos live under <strong>Viswam OTT</strong> in the sidebar.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="h-auto flex flex-wrap gap-1 bg-[var(--brand-navy)]/5 border border-[var(--brand-navy)]/10 p-1 rounded-xl">
          <TabsTrigger
            value="curriculum"
            className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--brand-navy)] data-[state=active]:shadow-sm text-[var(--brand-navy)]/70"
          >
            <BookOpen className="h-4 w-4" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger
            value="learning-paths"
            className="rounded-lg gap-2 data-[state=active]:bg-[var(--brand-emerald)] data-[state=active]:text-white data-[state=active]:shadow-md text-[var(--brand-navy)]/70"
          >
            <Youtube className="h-4 w-4" />
            Learning paths
          </TabsTrigger>
        </TabsList>

        <TabsContent value="curriculum" className="mt-0">
          <ProductCurriculumPanel />
        </TabsContent>
        <TabsContent value="learning-paths" className="mt-0 -mx-1">
          <SuperAdminLearningPaths />
        </TabsContent>
      </Tabs>
    </div>
  );
}
