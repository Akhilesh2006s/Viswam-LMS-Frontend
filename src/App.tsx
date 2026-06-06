import { Suspense, lazy } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/not-found"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const LearningPaths = lazy(() => import("./pages/learning-paths"));
const PracticeTests = lazy(() => import("./pages/practice-tests"));
const Profile = lazy(() => import("./pages/profile"));
const Login = lazy(() => import("./pages/auth/login"));
const Register = lazy(() => import("./pages/auth/register"));
const AdminDashboard = lazy(() => import("./pages/admin/dashboard"));
const AdminSubjectContent = lazy(() => import("./pages/admin/subject-content"));
const AdminPeriodDetailPage = lazy(() => import("./pages/admin/period-detail"));
const TimetableManagementPage = lazy(() => import("./pages/admin/timetable"));
const TeacherDashboard = lazy(() => import("./pages/teacher/dashboard"));
const TeacherTimetablePage = lazy(() => import("./pages/teacher/timetable"));
const TeacherPeriodDetailPage = lazy(() => import("./pages/teacher/period-detail"));
const TeacherSubjectContent = lazy(() => import("./pages/teacher/subject-content"));
const AsliPrepContentPage = lazy(() => import("./pages/asli-prep-content"));
const SubjectContent = lazy(() => import("./pages/subject-content"));
const EduOTT = lazy(() => import("./pages/edu-ott"));
const EduOTTWatch = lazy(() => import("./pages/edu-ott-watch"));
const EduOTTSearch = lazy(() => import("./pages/edu-ott-search"));
const EduOTTCourse = lazy(() => import("./pages/edu-ott-course"));
const EduOTTDownloads = lazy(() => import("./pages/edu-ott-downloads"));
const EduOTTMyLearning = lazy(() => import("./pages/edu-ott-my-learning"));
import StudentPageLoader from "@/components/student/StudentPageLoader";
const QuizPage = lazy(() => import("./pages/quiz"));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin-dashboard"));
const SuperAdminSchoolWorkspace = lazy(() => import("./pages/super-admin-school-workspace"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));
const Contact = lazy(() => import("./pages/contact"));
const AbacusTeacherDashboard = lazy(() => import("./pages/abacus/teacher-dashboard"));
const AbacusStudentDashboard = lazy(() => import("./pages/abacus/student-dashboard"));
const AbacusHomePage = lazy(() => import("./pages/abacus/home"));
const AbacusPracticePage = lazy(() => import("./pages/abacus/practice"));
const AbacusPhysicalPracticePage = lazy(() => import("./pages/abacus/physical-practice"));
const AbacusAssessmentPage = lazy(() => import("./pages/abacus/assessment"));
const AbacusAssessmentResultsPage = lazy(() => import("./pages/abacus/assessment-results"));
const AbacusTeacherToolPage = lazy(() => import("./pages/abacus/teacher-tool"));
const AbacusPracticeResultsPage = lazy(() => import("./pages/abacus/practice-results"));
const AbacusResultsHistoryPage = lazy(() => import("./pages/abacus/results-history"));
const AbacusChangePasswordPage = lazy(() => import("./pages/abacus/change-password"));
const AbacusAboutPage = lazy(() => import("./pages/abacus/about"));

function RouteFallback() {
  const [location] = useLocation();
  const isStaffRoute =
    location.startsWith("/admin") ||
    location.startsWith("/super-admin") ||
    location.startsWith("/teacher");
  if (isStaffRoute) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }
  const isAbacus = location.startsWith("/abacus");
  const isAuthRoute =
    location === "/" ||
    location === "/signin" ||
    location === "/login" ||
    location.startsWith("/auth/");
  return (
    <StudentPageLoader
      showNavigation={!isAbacus && !isAuthRoute}
      message="Loading page..."
    />
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/learning-paths" component={LearningPaths} />
      <Route path="/tests" component={PracticeTests} />
      <Route path="/asli-prep-content" component={AsliPrepContentPage} />
      <Route path="/edu-ott" component={EduOTT} />
      <Route path="/edu-ott/watch/:id" component={EduOTTWatch} />
      <Route path="/edu-ott/search" component={EduOTTSearch} />
      <Route path="/edu-ott/course/:id" component={EduOTTCourse} />
      <Route path="/edu-ott/downloads" component={EduOTTDownloads} />
      <Route path="/edu-ott/my-learning" component={EduOTTMyLearning} />
      <Route path="/quiz/:id" component={QuizPage} />
      <Route path="/subject/:id" component={SubjectContent} />
      <Route path="/profile" component={Profile} />
      <Route path="/auth/login" component={Login} />
      <Route path="/signin" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/period/:id" component={AdminPeriodDetailPage} />
      <Route path="/admin/subject/:id" component={AdminSubjectContent} />
      <Route path="/admin/timetable" component={TimetableManagementPage} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/teacher/period/:id" component={TeacherPeriodDetailPage} />
      <Route path="/teacher/timetable" component={TeacherTimetablePage} />
      <Route path="/teacher/subject/:id" component={TeacherSubjectContent} />
      <Route path="/abacus/teacher" component={AbacusTeacherDashboard} />
      <Route path="/abacus/student" component={AbacusStudentDashboard} />
      <Route path="/abacus/home" component={AbacusHomePage} />
      <Route path="/abacus/practice/results" component={AbacusPracticeResultsPage} />
      <Route path="/abacus/practice" component={AbacusPracticePage} />
      <Route path="/abacus/physical-practice" component={AbacusPhysicalPracticePage} />
      <Route path="/abacus/assessment/results" component={AbacusAssessmentResultsPage} />
      <Route path="/abacus/assessment" component={AbacusAssessmentPage} />
      <Route path="/abacus/teacher-tool" component={AbacusTeacherToolPage} />
      <Route path="/abacus/results" component={AbacusResultsHistoryPage} />
      <Route path="/abacus/change-password" component={AbacusChangePasswordPage} />
      <Route path="/abacus/about" component={AbacusAboutPage} />
      <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
      <Route path="/super-admin/schools/:id" component={SuperAdminSchoolWorkspace} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
