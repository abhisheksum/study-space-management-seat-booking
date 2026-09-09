'use strict';

const tokenKey = 'studyhub_admin_token';
const isLoginPage = window.location.pathname.endsWith('/login.html');

if (!isLoginPage && !sessionStorage.getItem(tokenKey)) {
  window.location.replace('login.html');
}

window.studyHubAdminFetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem(tokenKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
};

if (isLoginPage) {
  const form = document.getElementById('admin-login-form');
  const status = document.getElementById('admin-login-status');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Signing in...';
    status.hidden = false;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: form.elements.login.value,
          password: form.elements.password.value
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Login failed.');
      sessionStorage.setItem(tokenKey, payload.data.token);
      window.location.assign('index.html');
    } catch (error) {
      status.textContent = error.message;
      status.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
}
