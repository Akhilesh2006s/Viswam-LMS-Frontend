import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Calculator,
  Hand,
  ClipboardCheck,
} from 'lucide-react';
import type { PremiumNavItem } from '@/components/layout/PremiumDashboardShell';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

export const ABACUS_STUDENT_NAV: PremiumNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: ABACUS_ROUTES.studentDashboard },
  { id: 'about', label: 'About Abacus', icon: BookOpen, href: ABACUS_ROUTES.about },
  { id: 'digital', label: 'Digital', icon: Calculator, href: ABACUS_ROUTES.practice },
  { id: 'physical', label: 'Physical', icon: Hand, href: ABACUS_ROUTES.physicalPractice },
  { id: 'assessment', label: 'Assessment', icon: ClipboardCheck, href: ABACUS_ROUTES.assessment },
  {
    id: 'results',
    label: 'My Results',
    icon: BarChart3,
    href: `${ABACUS_ROUTES.studentDashboard}?tab=results`,
  },
];

export function abacusStudentNavActiveId(pathname: string, search = ''): string {
  if (pathname === ABACUS_ROUTES.about) {
    return 'about';
  }
  if (pathname === ABACUS_ROUTES.practice || pathname === ABACUS_ROUTES.practiceResults) {
    return 'digital';
  }
  if (pathname === ABACUS_ROUTES.physicalPractice) {
    return 'physical';
  }
  if (pathname === ABACUS_ROUTES.assessment || pathname === ABACUS_ROUTES.assessmentResults) {
    return 'assessment';
  }
  if (pathname === ABACUS_ROUTES.resultsHistory) {
    return 'results';
  }
  if (pathname === ABACUS_ROUTES.studentDashboard) {
    const tab = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get('tab');
    return tab === 'results' ? 'results' : 'overview';
  }
  return 'overview';
}

export function abacusStudentDashboardTab(pathname: string, search = ''): 'overview' | 'results' {
  return abacusStudentNavActiveId(pathname, search) === 'results' ? 'results' : 'overview';
}
