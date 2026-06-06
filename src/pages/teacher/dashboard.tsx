import { usePageTitle } from "@/hooks/use-page-title";
import { TeacherPortalHome } from "@/components/teacher/TeacherPortalHome";
export default function TeacherDashboard() {
  usePageTitle("Teacher Portal");
  return <TeacherPortalHome />;
}
