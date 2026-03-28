/* auth.js – login & register pages */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, go to dashboard
  redirectIfLoggedIn();

  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  /* ── Login ────────────────────────────────────────── */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';
      clearAlert();

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
      });

      btn.disabled = false;
      btn.innerHTML = 'Sign In';

      if (!res) return;

      if (res.ok) {
        saveAuth(res.data.token, res.data.user);
        showToast('Login successful! Redirecting…', 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 600);
      } else {
        showAlert(res.data.message || 'Login failed.', 'error');
      }
    });
  }

  /* ── Register ─────────────────────────────────────── */
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating…';
      clearAlert();

      const full_name        = document.getElementById('full_name').value.trim();
      const email            = document.getElementById('email').value.trim();
      const password         = document.getElementById('password').value;
      const confirm_password = document.getElementById('confirm_password').value;

      if (password !== confirm_password) {
        showAlert('Passwords do not match!', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
        return;
      }

      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body:   JSON.stringify({ full_name, email, password }),
      });

      btn.disabled = false;
      btn.innerHTML = 'Create Account';

      if (!res) return;

      if (res.ok) {
        saveAuth(res.data.token, res.data.user);
        showToast('Account created! Welcome 🎉', 'success');
        setTimeout(() => window.location.href = '/dashboard.html', 600);
      } else {
        const msg = res.data.errors
          ? res.data.errors.map(e => e.message).join(', ')
          : res.data.message || 'Registration failed.';
        showAlert(msg, 'error');
      }
    });
  }
});

/* ── Alert helpers ─────────────────────────────────── */
function showAlert(msg, type = 'error') {
  const box = document.getElementById('alert-box');
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type === 'error' ? 'error' : 'success'}">${msg}</div>`;
}

function clearAlert() {
  const box = document.getElementById('alert-box');
  if (box) box.innerHTML = '';
}
