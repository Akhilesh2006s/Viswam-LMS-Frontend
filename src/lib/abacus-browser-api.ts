import { fetchAbacusPortalMe } from '@/lib/abacus-api';
import { isAbacusPortalSession } from '@/lib/abacus-auth';

declare global {
  interface Window {
    __ABACUS_SPA?: boolean;
    AbacusAPI?: {
      base: () => string;
      token: () => string;
      logout: () => void;
      fetch: (path: string, options?: RequestInit) => Promise<unknown>;
      ensureSession: () => Promise<boolean>;
    };
  }
}

/** Bridge for legacy abacus JS (`/abacus/js/*.js`) inside React pages. */
export function installAbacusBrowserApi() {
  window.__ABACUS_SPA = true;
  window.AbacusAPI = {
    base() {
      return `${window.location.origin}/abacus-api`;
    },
    token() {
      return localStorage.getItem('authToken') || '';
    },
    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('student');
      localStorage.removeItem('abacusUser');
      localStorage.removeItem('productLine');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    },
    async fetch(path, options = {}) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      };
      const apiPath = path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
      const res = await fetch(`${this.base()}${apiPath}`, { ...options, headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Request failed (${res.status})`);
      }
      return json;
    },
    async ensureSession() {
      if (!this.token() || !isAbacusPortalSession()) {
        window.location.href = '/auth/login';
        return false;
      }
      const cached = localStorage.getItem('student');
      if (cached) {
        try {
          JSON.parse(cached);
          return true;
        } catch {
          localStorage.removeItem('student');
        }
      }
      const data = await fetchAbacusPortalMe();
      localStorage.setItem('student', JSON.stringify(data.student));
      localStorage.setItem('abacusUser', JSON.stringify(data.user));
      localStorage.setItem('productLine', 'ABACUS');
      return true;
    },
  };
}
