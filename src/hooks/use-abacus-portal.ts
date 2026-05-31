import { useEffect, useState } from 'react';
import {
  fetchAbacusPortalMe,
  type AbacusPortalProfile,
} from '@/lib/abacus-api';
import { abacusDashboardPath } from '@/lib/abacus-auth';
import { abacusLogout } from '@/lib/abacus-logout';

type UseAbacusPortalOptions = {
  role?: 'student' | 'teacher';
  /** When true (default), redirect if JWT role does not match `role`. */
  strict?: boolean;
};

export function useAbacusPortal({ role, strict = true }: UseAbacusPortalOptions = {}) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AbacusPortalProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = localStorage.getItem('authToken');
      if (!token || localStorage.getItem('productLine') !== 'ABACUS') {
        window.location.href = '/auth/login';
        return;
      }

      try {
        const data = await fetchAbacusPortalMe();
        if (cancelled) return;

        if (strict && role && data.user.role !== role) {
          window.location.href = abacusDashboardPath(data.user.role);
          return;
        }

        localStorage.setItem(
          'student',
          JSON.stringify({
            id: data.student.id,
            username: data.student.username,
            name: data.student.name,
            email: data.student.email,
            category: data.student.category,
            level: data.student.level,
            rank: data.student.rank,
            role: data.student.role,
          }),
        );

        setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [role, strict]);

  return { loading, profile, error, logout: abacusLogout };
}
