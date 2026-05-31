import { useLocation } from 'wouter';
import { Calculator, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuthData, getUser } from '@/lib/auth-utils';
import { usePageTitle } from '@/hooks/use-page-title';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AbacusShell({ title, subtitle, children }: Props) {
  usePageTitle(title);
  const [, setLocation] = useLocation();
  const user = getUser();

  const logout = () => {
    clearAuthData();
    localStorage.removeItem('productLine');
    setLocation('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/40 to-white">
      <header className="sticky top-0 z-20 border-b border-amber-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Viswam Abacus</p>
              <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user?.fullName ? (
              <span className="hidden text-sm text-slate-600 sm:inline">{user.fullName}</span>
            ) : null}
            <Button variant="outline" size="sm" className="border-amber-200" onClick={logout}>
              <LogOut className="mr-1 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
