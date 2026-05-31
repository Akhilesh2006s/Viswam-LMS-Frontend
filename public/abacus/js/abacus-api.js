/** Abacus portal API — proxied via Vite `/abacus-api` → abacus-backend. */
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
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${this.base()}${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json;
  },
  async ensureSession() {
    if (!this.token()) {
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
    const json = await this.fetch('/portal/me');
    localStorage.setItem('student', JSON.stringify(json.data.student));
    localStorage.setItem('abacusUser', JSON.stringify(json.data.user));
    localStorage.setItem('productLine', 'ABACUS');
    return true;
  },
};
