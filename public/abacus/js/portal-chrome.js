(function () {
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', href: null, roles: ['student', 'teacher'] },
    { id: 'home', label: 'Home', href: 'Home.html', roles: ['student', 'teacher'] },
    { id: 'about', label: 'Know Abacus', href: 'about-abacus.html', roles: ['student', 'teacher'] },
    { id: 'practice', label: 'Digital Practice', href: 'Practice.html', roles: ['student', 'teacher'] },
    { id: 'physical', label: 'Physical Practice', href: 'Practice-Physical.html', roles: ['student', 'teacher'] },
    { id: 'assessment', label: 'Assessment', href: 'Assesment.html', roles: ['student'], className: 'student-assessment' },
    { id: 'teacher', label: 'Teacher Tool', href: 'Teacher.html', roles: ['teacher'], className: 'teacher-tool' },
    { id: 'results', label: 'My Results', href: 'results-history.html', roles: ['student', 'teacher'] },
    { id: 'password', label: 'Change Password', href: 'changepassword.html', roles: ['student', 'teacher'] },
  ];

  function dashboardPath(role) {
    if (role === 'teacher') return '/abacus/teacher';
    if (role === 'student') return '/abacus/student';
    return '/auth/login';
  }

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('student') || '{}');
    } catch {
      return {};
    }
  }

  function showRoleLinks(role) {
    document.querySelectorAll('.student-assessment').forEach((el) => {
      el.style.display = role === 'student' ? (el.classList.contains('viswam-abacus-nav-pill') ? 'inline-flex' : '') : 'none';
    });
    document.querySelectorAll('.teacher-tool').forEach((el) => {
      el.style.display = role === 'teacher' ? (el.classList.contains('viswam-abacus-nav-pill') ? 'inline-flex' : '') : 'none';
    });
  }

  function navVisible(item, role) {
    if (!item.roles.includes(role)) return false;
    if (item.className === 'student-assessment' && role !== 'student') return false;
    if (item.className === 'teacher-tool' && role !== 'teacher') return false;
    return true;
  }

  function renderNavItem(item, role, active, mobile) {
    if (!navVisible(item, role)) return '';

    const isActive = item.id === active;
    const cls = [
      mobile ? '' : 'viswam-abacus-nav-pill',
      mobile ? '' : isActive ? 'is-active' : '',
      mobile && isActive ? 'is-active' : '',
      item.className || '',
    ]
      .filter(Boolean)
      .join(' ');

    const href = item.id === 'dashboard' ? dashboardPath(role) : item.href;
    const tag = mobile ? 'a' : 'a';
    return `<${tag} class="${cls}" href="${href}">${item.label}</${tag}>`;
  }

  function mountHeader(active) {
    const mount = document.getElementById('viswam-abacus-header');
    if (!mount) return;

    const profile = getProfile();
    const role = profile.role || 'student';
    showRoleLinks(role);

    const desktopNav = NAV.map((item) => renderNavItem(item, role, active, false)).join('');
    const mobileNav = NAV.map((item) => renderNavItem(item, role, active, true)).join('');

    mount.innerHTML = `
      <div class="viswam-abacus-topnav">
        <div class="viswam-abacus-topnav-inner">
          <button type="button" class="viswam-abacus-brand" onclick="location.href='${dashboardPath(role)}'">
            <img src="/logo.png" alt="VISWAM LMS" />
            <span class="viswam-abacus-brand-text">
              <span class="viswam-abacus-brand-title">VISWAM LMS</span>
              <span class="viswam-abacus-brand-sub">Abacus Portal</span>
            </span>
          </button>
          <nav class="viswam-abacus-nav" aria-label="Abacus">${desktopNav}</nav>
          <div class="viswam-abacus-nav-actions">
            <button type="button" class="viswam-abacus-signout" id="viswamAbacusSignOut">Sign out</button>
            <button type="button" class="viswam-abacus-menu-btn" id="viswamAbacusMenuBtn" aria-label="Menu">☰</button>
          </div>
        </div>
        <div class="viswam-abacus-mobile-drawer" id="viswamAbacusMobileDrawer">${mobileNav}
          <button type="button" id="viswamAbacusMobileSignOut">Sign out</button>
        </div>
      </div>`;

    const menuBtn = document.getElementById('viswamAbacusMenuBtn');
    const drawer = document.getElementById('viswamAbacusMobileDrawer');
    if (menuBtn && drawer) {
      menuBtn.addEventListener('click', () => drawer.classList.toggle('is-open'));
    }

    function signOut() {
      if (window.AbacusAPI && typeof AbacusAPI.logout === 'function') {
        AbacusAPI.logout();
      } else {
        localStorage.clear();
        window.location.href = '/auth/login';
      }
    }

    document.getElementById('viswamAbacusSignOut')?.addEventListener('click', signOut);
    document.getElementById('viswamAbacusMobileSignOut')?.addEventListener('click', signOut);
  }

  function init() {
    document.body.classList.add('viswam-abacus-portal');
    const active = document.body.dataset.abacusPage || 'home';
    mountHeader(active);

    if (window.AbacusAPI && typeof AbacusAPI.ensureSession === 'function') {
      AbacusAPI.ensureSession()
        .then(() => {
          const profile = JSON.parse(localStorage.getItem('student') || '{}');
          const role = profile.role || 'student';
          showRoleLinks(role);
          mountHeader(active);
        })
        .catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ViswamAbacusChrome = { refresh: init, showRoleLinks };
})();
