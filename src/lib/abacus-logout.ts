export function abacusLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('student');
  localStorage.removeItem('abacusUser');
  localStorage.removeItem('productLine');
  localStorage.removeItem('userRole');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  window.location.href = '/auth/login';
}
