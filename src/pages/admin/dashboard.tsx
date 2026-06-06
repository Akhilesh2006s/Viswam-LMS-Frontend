// @ts-nocheck
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
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
import { useLocation, useSearch } from 'wouter';
const ClassDashboard = lazy(() => import('@/components/admin/class-dashboard'));
const PeriodManagement = lazy(() => import('@/components/admin/PeriodManagement'));
import AdminLearningPaths from '@/components/admin/learning-paths';
const AdminEduOTT = lazy(() => import('@/components/admin/admin-eduott'));
const AdminCalendar = lazy(() => import('@/components/admin/admin-calendar'));
const TimetableManagement = lazy(() => import('@/components/admin/timetable-management'));
const AdminHome = lazy(() => import('@/components/admin/AdminHome'));

const lazySectionFallback = (
  <div className="rounded-xl border border-sky-100 bg-white p-3 sm:p-4 lg:p-6 text-xs sm:text-sm text-slate-600 shadow-sm">
    Loading section...
  </div>
);

const VALID_ADMIN_TABS = new Set([
  'overview',
  'classes',
  'periods',
  'learning-paths',
  'eduott',
  'calendar',
  'timetable',
]);

const AdminDashboard = () => {
  usePageTitle('Admin Dashboard');
  const [, setLocation] = useLocation();
  const search = useSearch() || '';
  const [activeTab, setActiveTab] = useState('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const adminNavItems: PremiumNavItem[] = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'classes', label: 'Classes', icon: GraduationCap },
    { id: 'periods', label: 'Periods', icon: Clock },
    { id: 'learning-paths', label: 'Learning Paths', icon: Target },
    { id: 'eduott', label: 'Viswam OTT', icon: Play, ottAccent: true },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ];


  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          window.location.href = '/signin';
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Admin dashboard auth check - user data:', data);
          if (data.user && data.user.role === 'admin') {
            console.log('Admin user authenticated successfully');
            setUserData(data.user);
            setAdminId(data.user._id || data.user.id);
            setIsAuthenticated(true);
          } else {
            console.log('User is not admin, role:', data.user?.role);
            window.location.href = '/signin';
          }
        } else {
          console.log('Admin dashboard auth check failed with status:', response.status);
          const errorText = await response.text();
          console.log('Response text:', errorText);
          alert(`Authentication failed. Status: ${response.status}, Response: ${errorText}`);
          window.location.href = '/signin';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/signin';
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dashboard-no-scrollbar');
    document.body.classList.add('dashboard-no-scrollbar');
    return () => {
      document.documentElement.classList.remove('dashboard-no-scrollbar');
      document.body.classList.remove('dashboard-no-scrollbar');
    };
  }, []);

  useEffect(() => {
    const raw = search || '';
    const q = raw.startsWith('?') ? raw.slice(1) : raw;
    const tab = new URLSearchParams(q).get('tab');
    if (tab === 'subjects') {
      setActiveTab('overview');
      return;
    }
    if (tab === 'students' || tab === 'teachers') {
      setActiveTab('classes');
      return;
    }
    if (tab && VALID_ADMIN_TABS.has(tab)) {
      setActiveTab(tab);
    }
  }, [search]);

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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <PremiumDashboardShell
      subtitle="School Admin"
      navItems={adminNavItems}
      activeId={activeTab}
      onNavChange={setActiveTab}
      onLogout={handleLogout}
      userName={userData?.schoolName || userData?.fullName}
      userEmail={userData?.email}
      sidebarPosition="right"
      hideMobileNav
      contentMaxWidth={activeTab === 'periods' || activeTab === 'eduott' ? 'wide' : 'centered'}
      mainClassName={
        activeTab === 'eduott'
          ? 'viswam-premium-main-cinema'
          : activeTab === 'periods'
            ? '!max-w-none'
            : undefined
      }
    >
          {activeTab === 'overview' && (
            <Suspense fallback={lazySectionFallback}>
              <AdminHome
                schoolName={userData?.schoolName || userData?.fullName}
                onNavigate={setActiveTab}
              />
            </Suspense>
          )}


          {activeTab === 'classes' && (
            <Suspense fallback={lazySectionFallback}>
              <ClassDashboard readOnly />
            </Suspense>
          )}
          {activeTab === 'periods' && (
            <Suspense fallback={lazySectionFallback}>
              <PeriodManagement />
            </Suspense>
          )}
          {activeTab === 'learning-paths' && <AdminLearningPaths />}
          {activeTab === 'eduott' && (
            <Suspense fallback={lazySectionFallback}>
              <AdminEduOTT />
            </Suspense>
          )}
          {activeTab === 'calendar' && (
            <Suspense fallback={lazySectionFallback}>
              <AdminCalendar />
            </Suspense>
          )}
          {activeTab === 'timetable' && (
            <Suspense fallback={lazySectionFallback}>
              <TimetableManagement />
            </Suspense>
          )}
    </PremiumDashboardShell>
  );
};

export default AdminDashboard;
