import { getUser } from '@/lib/auth-utils';
import { isAbacusLogin } from '@/lib/abacus-api';

export type AbacusUser = {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  productLine?: string;
  category?: string;
  level?: string;
  className?: string;
};

function readAbacusEmail(user?: AbacusUser | null): string {
  return String(user?.email || localStorage.getItem('userEmail') || '').trim();
}

export function isAbacusUser(user?: AbacusUser | null): boolean {
  try {
    if (localStorage.getItem('productLine') === 'ABACUS') return true;

    const stored = getUser() as AbacusUser | null;
    const resolved = user ?? stored;
    if (resolved?.productLine === 'ABACUS') return true;

    const email = readAbacusEmail(resolved);
    if (isAbacusLogin(email)) return true;

    if (localStorage.getItem('student')) return true;

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/abacus')) {
      return true;
    }
  } catch {
    /* ignore storage errors */
  }
  return false;
}

export function getAbacusUser(): AbacusUser | null {
  return getUser() as AbacusUser | null;
}

export function abacusDashboardPath(role?: string): string {
  if (role === 'teacher') return '/abacus/teacher';
  if (role === 'student') return '/abacus/student';
  const user = getAbacusUser();
  if (user?.role === 'teacher') return '/abacus/teacher';
  if (user?.role === 'student') return '/abacus/student';
  return '/auth/login';
}
