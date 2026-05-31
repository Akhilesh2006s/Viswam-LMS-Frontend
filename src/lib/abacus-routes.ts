/** React routes for the Abacus portal (replaces legacy `.html` pages). */
export const ABACUS_ROUTES = {
  studentDashboard: '/abacus/student',
  teacherDashboard: '/abacus/teacher',
  home: '/abacus/home',
  practice: '/abacus/practice',
  physicalPractice: '/abacus/physical-practice',
  assessment: '/abacus/assessment',
  assessmentResults: '/abacus/assessment/results',
  teacherTool: '/abacus/teacher-tool',
  practiceResults: '/abacus/practice/results',
  resultsHistory: '/abacus/results',
  changePassword: '/abacus/change-password',
  about: '/abacus/about',
} as const;

export type AbacusModulePage =
  | 'dashboard'
  | 'home'
  | 'about'
  | 'practice'
  | 'physical'
  | 'assessment'
  | 'teacher'
  | 'results'
  | 'password';

export function abacusDashboardRoute(role?: string) {
  return role === 'teacher' ? ABACUS_ROUTES.teacherDashboard : ABACUS_ROUTES.studentDashboard;
}
