import { Link, useLocation } from "wouter";
import { BookOpen, User, Menu, LogOut, Video, LayoutDashboard } from "lucide-react";
import { API_BASE_URL } from '@/lib/api-config';
import { clearAuthData, getAuthToken, getUser, setUser } from '@/lib/auth-utils';
import { fetchAuthUser } from '@/lib/auth-session';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { ViswamLogo } from "@/components/brand/ViswamLogo";
import { usePageTitle } from "@/hooks/use-page-title";

const NAV_INITIALS_KEY = "viswam_lms_nav_initials";

function initialsFromName(name: string | undefined | null): string {
  if (!name || !String(name).trim()) return '';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts.map((n) => n[0]).join('').toUpperCase().slice(0, 3);
}

function initialsFromUser(user: any): string {
  if (!user) return '';
  return initialsFromName(user.fullName || user.name);
}

function initialsFromEmail(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return '';
  const local = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return '';
}

/** Sync read so avatar does not flash "U" when Navigation remounts on route change. */
function readInitialsForNav(): string {
  try {
    const cached = sessionStorage.getItem(NAV_INITIALS_KEY);
    if (cached && cached.trim()) return cached.trim().slice(0, 3);
  } catch {
    /* ignore */
  }
  const fromStoredUser = initialsFromUser(getUser());
  if (fromStoredUser) return fromStoredUser;
  try {
    return initialsFromEmail(localStorage.getItem('userEmail'));
  } catch {
    return '';
  }
}

export default function Navigation() {
  usePageTitle("Student Portal");
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInitials, setUserInitials] = useState<string>(() => readInitialsForNav());

  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setUserInitials('');
        try {
          sessionStorage.removeItem(NAV_INITIALS_KEY);
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        const user = await fetchAuthUser();
        if (user && typeof user === 'object') {
          try {
            setUser(user);
          } catch {
            /* ignore */
          }
          const next =
            initialsFromName((user as { fullName?: string; name?: string }).fullName || (user as { name?: string }).name) ||
            initialsFromEmail((user as { email?: string }).email) ||
            readInitialsForNav();
          setUserInitials(next);
          if (next) {
            try {
              sessionStorage.setItem(NAV_INITIALS_KEY, next);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        setUserInitials(readInitialsForNav());
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = getAuthToken();
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with logout even if API call fails
        }
      }
      
      // Clear all authentication data
      clearAuthData();
      
      // Redirect to login page
      setLocation('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear storage and redirect even on error
      clearAuthData();
      setLocation('/signin');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const prefetchStudentRoute = (path: string) => {
    switch (path) {
      case "/dashboard":
        void import("@/pages/dashboard");
        break;
      case "/learning-paths":
        void import("@/pages/learning-paths");
        break;
      case "/edu-ott":
        void import("@/pages/edu-ott");
        break;
      default:
        break;
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Home", icon: LayoutDashboard },
    { path: "/learning-paths", label: "Learning Paths", icon: BookOpen },
    { path: "/edu-ott", label: "VISWAM OTT", icon: Video },
  ];

  const getCompactLabel = (label: string) => {
    if (label === "Learning Paths") return "Learn";
    if (label === "VISWAM OTT") return "OTT";
    if (label === "Home") return "Home";
    return label;
  };

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          location === item.path ||
          (item.path === "/dashboard" && (location === "/" || location === ""));

        return (
          <Link key={item.path} href={item.path}>
            <Button
              onMouseEnter={() => prefetchStudentRoute(item.path)}
              onFocus={() => prefetchStudentRoute(item.path)}
              variant="ghost"
              className={`w-full justify-start rounded-xl transition-all duration-200 ${
                isActive 
                  ? "bg-[var(--brand-emerald)] text-white" 
                  : "text-[var(--text-primary)] hover:bg-muted"
              }`}
            >
              <Icon className={`w-3 h-3 sm:w-4 sm:h-4 mr-3 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Header - Modern Gradient Theme */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--brand-navy)] border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-[4.25rem]">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <div className="cursor-pointer scale-[0.92] sm:scale-100 origin-left">
                  <ViswamLogo subtitle="Student Portal" variant="light" size="sm" showCompany={false} />
                </div>
              </Link>
            </div>
            
            {/* Navigation Links - Modern Design */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-1 rounded-xl bg-white/5 p-1 border border-white/10">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
          location === item.path ||
          (item.path === "/dashboard" && (location === "/" || location === ""));

                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        onMouseEnter={() => prefetchStudentRoute(item.path)}
                        onFocus={() => prefetchStudentRoute(item.path)}
                        className={`relative px-3 lg:px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${
                        isActive 
                          ? "bg-[var(--brand-emerald)] text-white shadow-sm" 
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}>
                        <Icon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="font-medium text-xs lg:text-sm">{getCompactLabel(item.label)}</span>
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Section - Enhanced */}
            <div className="flex items-center space-x-3">
              {isMobile ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-11 w-11 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-72 border-l border-slate-200 bg-[#f8fafc]">
                    <div className="mt-8 flex flex-col space-y-3">
                      <Link href="/dashboard">
                        <div className="mb-6 cursor-pointer border-b border-slate-200 pb-4 hover:opacity-90">
                          <ViswamLogo subtitle="Student Portal" variant="dark" size="md" showCompany={false} />
                        </div>
                      </Link>
                      <NavContent />
                      <div className="border-t border-slate-200 pt-4">
                        <Button 
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:bg-red-50/50 rounded-xl transition-all duration-300"
                        >
                          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-3" />
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Link href="/profile">
                    <div className="w-10 h-10 lg:w-11 lg:h-11 bg-[var(--brand-emerald)] rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white/20 hover:brightness-110 transition-all duration-200 group">
                      {userInitials ? (
                        <span className="text-xs lg:text-sm font-semibold text-white group-hover:scale-110 transition-transform">
                          {userInitials}
                        </span>
                      ) : (
                        <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white opacity-95" aria-hidden />
                      )}
                    </div>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="ghost"
                    className="rounded-full border border-red-200/60 px-3 py-2 text-red-600 hover:bg-red-50 lg:px-5 lg:py-2.5 font-medium"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4 lg:mr-2" />
                    <span className="hidden lg:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

    </>
  );
}
