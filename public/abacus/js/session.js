(function () {
  const path = window.location.pathname || '';
  if (path.endsWith('/index.html') || path.endsWith('/abacus/') || path.endsWith('/abacus')) {
    if (localStorage.getItem('authToken')) {
      window.location.replace('/abacus/Home.html');
    } else {
      window.location.replace('/auth/login');
    }
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    AbacusAPI.ensureSession().catch(() => AbacusAPI.logout());
  });
})();
