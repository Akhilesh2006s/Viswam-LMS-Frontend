// @ts-nocheck
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { PremiumDashboardShell, type PremiumNavItem } from '@/components/layout/PremiumDashboardShell';
import { API_BASE_URL } from '@/lib/api-config';
import { usePageTitle } from '@/hooks/use-page-title';
import {
  LayoutDashboard,
  GraduationCap,
  Play,
  Target,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
} from 'lucide-react';

const AdminPeriodDetail = lazy(() => import('@/components/admin/AdminPeriodDetail'));

const lazySectionFallback = (
  <div className="rounded-xl border border-sky-100 bg-white p-3 sm:p-4 lg:p-6 text-xs sm:text-sm text-slate-600 shadow-sm">
    Loading period...
  </div>
);

const adminNavItems: PremiumNavItem[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'classes', label: 'Classes', icon: GraduationCap },
  { id: 'periods', label: 'Periods', icon: Clock },
  { id: 'learning-paths', label: 'Learning Paths', icon: Target },
  { id: 'eduott', label: 'Viswam OTT', icon: Play, ottAccent: true },
  { id: 'timetable', label: 'Timetable', icon: CalendarDays },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

export default function AdminPeriodDetailPage() {
  const [, params] = useRoute('/admin/period/:id');
  const [, setLocation] = useLocation();
  const periodId = params?.id || '';
  usePageTitle('Period');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/signin';
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role === 'admin') {
            setUserData(data.user);
            setIsAuthenticated(true);
          } else {
            window.location.href = '/signin';
          }
        } else {
          window.location.href = '/signin';
        }
      } catch {
        window.location.href = '/signin';
      } finally {
        setIsLoading(false);
      }
    };
    void checkAuth();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch {
          /* ignore */
        }
      }
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
  }, []);

  const handleNavChange = useCallback(
    (id: string) => {
      setLocation(`/admin/dashboard?tab=${id}`);
    },
    [setLocation],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !periodId) {
    return null;
  }

  return (
    <PremiumDashboardShell
      subtitle="School Admin"
      navItems={adminNavItems}
      activeId="periods"
      onNavChange={handleNavChange}
      onLogout={handleLogout}
      userName={userData?.schoolName || userData?.fullName}
      userEmail={userData?.email}
      sidebarPosition="right"
      hideMobileNav
      contentMaxWidth="wide"
      mainClassName="!max-w-none"
    >
      <Suspense fallback={lazySectionFallback}>
        <AdminPeriodDetail periodId={periodId} />
      </Suspense>
    </PremiumDashboardShell>
  );
}
