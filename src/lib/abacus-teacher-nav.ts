import {
  LayoutDashboard,
  BookOpen,
  Calculator,
  Hand,
  Users,
  Wrench,
} from 'lucide-react';
import type { PremiumNavItem } from '@/components/layout/PremiumDashboardShell';
import { ABACUS_ROUTES } from '@/lib/abacus-routes';

export const ABACUS_TEACHER_NAV: PremiumNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: ABACUS_ROUTES.teacherDashboard },
  { id: 'about', label: 'About Abacus', icon: BookOpen, href: ABACUS_ROUTES.about },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    href: `${ABACUS_ROUTES.teacherDashboard}?tab=students`,
  },
  { id: 'tool', label: 'Teacher Tool', icon: Wrench, href: ABACUS_ROUTES.teacherTool },
  { id: 'digital', label: 'Digital', icon: Calculator, href: ABACUS_ROUTES.practice },
  { id: 'physical', label: 'Physical', icon: Hand, href: ABACUS_ROUTES.physicalPractice },
];

export function abacusTeacherNavActiveId(pathname: string, search = ''): string {
  if (pathname === ABACUS_ROUTES.about) return 'about';
  if (pathname === ABACUS_ROUTES.teacherTool) return 'tool';
  if (pathname === ABACUS_ROUTES.practice || pathname === ABACUS_ROUTES.practiceResults) {
    return 'digital';
  }
  if (pathname === ABACUS_ROUTES.physicalPractice) return 'physical';
  if (pathname === ABACUS_ROUTES.teacherDashboard) {
    const tab = new URLSearchParams(search.startsWith('?') ? search : `?${search}`).get('tab');
    if (tab === 'students') return 'students';
    return 'overview';
  }
  return 'overview';
}

export type AbacusTeacherDashboardTab = 'overview' | 'students';

export function abacusTeacherDashboardTab(pathname: string, search = ''): AbacusTeacherDashboardTab {
  const active = abacusTeacherNavActiveId(pathname, search);
  if (active === 'students') return 'students';
  return 'overview';
}
