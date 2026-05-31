import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import { abacusLogin, isAbacusEmail } from '@/lib/abacus-api';
import { abacusDashboardPath, isAbacusUser } from '@/lib/abacus-auth';
import { setAuthToken, setUser } from '@/lib/auth-utils';
import { invalidateAuthSessionCache } from '@/lib/auth-session';
import { invalidateDashboardBootstrapCache, fetchDashboardBootstrap } from '@/lib/dashboard-bootstrap';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { usePageTitle } from '@/hooks/use-page-title';
import { PRODUCT_NAME } from '@/lib/brand';

const Login = () => {
  usePageTitle('Login');
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectAfterLogin = (user: { role: string; productLine?: string }, usedAbacusApi = false) => {
    if (user.role === 'super-admin') {
      setLocation('/super-admin/dashboard');
    } else if (user.role === 'admin') {
      setLocation('/admin/dashboard');
    } else if (usedAbacusApi || isAbacusUser(user)) {
      setLocation(abacusDashboardPath(user.role));
    } else if (user.role === 'teacher') {
      setLocation('/teacher/dashboard');
    } else {
      void fetchDashboardBootstrap({ force: true });
      setLocation('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const useAbacusApi = isAbacusEmail(formData.email);
      let data: { token?: string; user?: { role: string; email?: string } };

      if (useAbacusApi) {
        data = await abacusLogin(formData.email, formData.password);
      } else {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });
        data = await response.json();
        if (!response.ok) {
          setError(data.message || 'Login failed');
          return;
        }
      }

      invalidateAuthSessionCache();
      invalidateDashboardBootstrapCache();

      if (data.token) setAuthToken(data.token);
      if (!data.user) {
        setError('Login failed: missing user profile');
        return;
      }

      const userRecord = useAbacusApi
        ? { ...data.user, productLine: 'ABACUS' as const }
        : data.user;
      setUser(userRecord);
      localStorage.setItem('userRole', userRecord.role);
      if (userRecord.email) localStorage.setItem('userEmail', userRecord.email);
      if (useAbacusApi) {
        localStorage.setItem('productLine', 'ABACUS');
        const u = userRecord as Record<string, string>;
        localStorage.setItem(
          'student',
          JSON.stringify({
            id: u.id,
            username: (u.email || '').split('@')[0],
            name: u.fullName,
            email: u.email,
            category: u.category,
            level: u.level,
            rank: 1,
            role: u.role,
          }),
        );
      }
      redirectAfterLogin(userRecord, useAbacusApi);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Sign in"
      description={`Welcome to ${PRODUCT_NAME}. Sign in with your institutional credentials.`}
    >
      {error && (
        <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@school.edu"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-[var(--text-primary)]">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)] pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--brand-navy)]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-[var(--text-secondary)] cursor-pointer">
            <input type="checkbox" className="rounded border-[var(--border)]" />
            Remember me
          </label>
          <button
            type="button"
            className="font-medium text-[var(--brand-emerald)] hover:text-[var(--brand-emerald-hover)]"
            onClick={() => setError('Please contact your school administrator to reset your password.')}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Need an account?{' '}
        <Link href="/auth/register" className="font-semibold text-[var(--brand-navy)] hover:underline">
          Register your school
        </Link>
      </p>
    </AuthSplitLayout>
  );
};

export default Login;
