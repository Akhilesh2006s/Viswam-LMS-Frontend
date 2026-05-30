// @ts-nocheck
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { API_BASE_URL } from '@/lib/api-config';
import { usePageTitle } from '@/hooks/use-page-title';
import { ViswamLogo } from '@/components/brand/ViswamLogo';
import { 
  Users, 
  LayoutDashboard,
  GraduationCap,
  LogOut,
  Play,
  Target,
  Menu,
  Calendar as CalendarIcon,
  CalendarDays,
} from 'lucide-react';
import { useLocation, useSearch } from 'wouter';
const UserManagement = lazy(() => import('@/components/admin/user-management'));
const ClassDashboard = lazy(() => import('@/components/admin/class-dashboard'));
const TeacherManagement = lazy(() => import('@/components/admin/teacher-management'));
const AdminLearningPaths = lazy(() => import('@/components/admin/learning-paths'));
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
  'students',
  'classes',
  'teachers',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();


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
    if (tab && VALID_ADMIN_TABS.has(tab)) {
      setActiveTab(tab);
    }
  }, [search]);

  const handleMobileTabChange = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

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

  const navBtn = (tab: string, active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

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
    <div className="min-h-screen bg-slate-50 md:flex md:h-screen">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <ViswamLogo subtitle="Admin" variant="dark" size="sm" showCompany={false} />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white border-slate-200 p-0 flex flex-col">
                <div className="p-5 border-b border-slate-100">
                  <ViswamLogo subtitle="Admin Panel" variant="dark" size="md" showCompany={false} />
                    </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {[
                    { tab: 'overview', label: 'Home', icon: LayoutDashboard },
                    { tab: 'students', label: 'Students', icon: Users },
                    { tab: 'classes', label: 'Classes', icon: GraduationCap },
                    { tab: 'teachers', label: 'Teachers', icon: Users },
                    { tab: 'learning-paths', label: 'Learning Paths', icon: Target },
                    { tab: 'eduott', label: 'EduOTT', icon: Play },
                    { tab: 'timetable', label: 'Timetable', icon: CalendarDays },
                    { tab: 'calendar', label: 'Calendar', icon: CalendarIcon },
                  ].map(({ tab, label, icon: Icon }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => handleMobileTabChange(tab)}
                      className={navBtn(tab, activeTab === tab)}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
                <div className="p-4 border-t border-slate-100">
                  <button type="button" onClick={handleLogout} className={navBtn('logout', false)}>
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Logout</span>
                    </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen w-64 bg-white border-r border-slate-200 shrink-0">
        {/* Logo Section */}
        <div className="p-5 border-b border-slate-100">
          <ViswamLogo subtitle="Admin Panel" variant="dark" size="md" showCompany={false} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar">
          <button type="button" onClick={() => setActiveTab('overview')} className={navBtn('overview', activeTab === 'overview')}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Home</span>
          </button>
          
          <button type="button" onClick={() => setActiveTab('students')} className={navBtn('students', activeTab === 'students')}>
            <Users className="h-4 w-4 shrink-0" />
            <span>Students</span>
          </button>
          
          <button type="button" onClick={() => setActiveTab('classes')} className={navBtn('classes', activeTab === 'classes')}>
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span>Classes</span>
          </button>
          <button type="button" onClick={() => setActiveTab('teachers')} className={navBtn('teachers', activeTab === 'teachers')}>
            <Users className="h-4 w-4 shrink-0" />
            <span>Teachers</span>
          </button>
          <button type="button" onClick={() => setActiveTab('learning-paths')} className={navBtn('learning-paths', activeTab === 'learning-paths')}>
            <Target className="h-4 w-4 shrink-0" />
            <span>Learning Paths</span>
          </button>
          <button type="button" onClick={() => setActiveTab('eduott')} className={navBtn('eduott', activeTab === 'eduott')}>
            <Play className="h-4 w-4 shrink-0" />
            <span>EduOTT</span>
          </button>
          <button type="button" onClick={() => setActiveTab('timetable')} className={navBtn('timetable', activeTab === 'timetable')}>
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>Timetable</span>
                    </button>
          <button type="button" onClick={() => setActiveTab('calendar')} className={navBtn('calendar', activeTab === 'calendar')}>
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span>Calendar</span>
                    </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button type="button" onClick={handleLogout} className={navBtn('logout', false)}>
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      )}

        {/* Main Content Area */}
        <div className="flex-1 w-full min-w-0 flex flex-col relative z-10 md:h-screen md:overflow-y-auto hide-scrollbar">
          <div className={`flex-1 w-full ${isMobile ? 'pt-16 pb-8' : ''} px-4 sm:px-6 lg:px-8 py-6`}>
          {activeTab === 'overview' && (
            <Suspense fallback={lazySectionFallback}>
              <AdminHome
                schoolName={userData?.schoolName || userData?.fullName}
                onNavigate={setActiveTab}
              />
            </Suspense>
          )}


          {activeTab === 'students' && (
            <Suspense fallback={lazySectionFallback}>
              <UserManagement />
            </Suspense>
          )}
          {activeTab === 'classes' && (
            <Suspense fallback={lazySectionFallback}>
              <ClassDashboard />
            </Suspense>
          )}
          {activeTab === 'teachers' && (
            <Suspense fallback={lazySectionFallback}>
              <TeacherManagement />
            </Suspense>
          )}
          {activeTab === 'learning-paths' && (
            <Suspense fallback={lazySectionFallback}>
              <AdminLearningPaths />
            </Suspense>
          )}
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
          {/* Analytics tab removed */}
        </div>
      </div>
      
    </div>
  );
};

export default AdminDashboard;
