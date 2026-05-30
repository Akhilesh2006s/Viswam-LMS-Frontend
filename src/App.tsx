import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
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
const TimetableManagementPage = lazy(() => import("./pages/admin/timetable"));
const TeacherDashboard = lazy(() => import("./pages/teacher/dashboard"));
const TeacherTimetablePage = lazy(() => import("./pages/teacher/timetable"));
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
const SuperAdminSchoolDetail = lazy(() => import("./pages/super-admin-school-detail"));
const SuperAdminTest = lazy(() => import("./pages/super-admin-test"));
const Onboarding = lazy(() => import("./pages/onboarding"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));
const Contact = lazy(() => import("./pages/contact"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
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
      <Route path="/admin/subject/:id" component={AdminSubjectContent} />
      <Route path="/admin/timetable" component={TimetableManagementPage} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/teacher/timetable" component={TeacherTimetablePage} />
      <Route path="/teacher/subject/:id" component={TeacherSubjectContent} />
      <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
      <Route path="/super-admin/schools/:id" component={SuperAdminSchoolDetail} />
      <Route path="/super-admin/test" component={SuperAdminTest} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense
          fallback={
            <StudentPageLoader message="Loading page..." />
          }
        >
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
