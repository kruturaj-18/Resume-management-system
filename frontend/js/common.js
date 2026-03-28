/* =====================================================
   Shared JS utility — included on every page
   ===================================================== */

const API_BASE = 'http://localhost:5000/api';

/* ── Token helpers ─────────────────────────────────── */
const getToken = () => localStorage.getItem('rms_token');
const getUser  = () => {
  try { return JSON.parse(localStorage.getItem('rms_user') || 'null'); } catch { return null; }
};
const saveAuth = (token, user) => {
  localStorage.setItem('rms_token', token);
  localStorage.setItem('rms_user',  JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('rms_token');
  localStorage.removeItem('rms_user');
};

/* ── Redirect helpers ──────────────────────────────── */
const requireAuth = () => {
  if (!getToken()) { window.location.href = '/index.html'; return false; }
  return true;
};

const redirectIfLoggedIn = () => {
  if (getToken()) { window.location.href = '/dashboard.html'; }
};

/* ── Fetch wrapper ─────────────────────────────────── */
const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/index.html';
    return null;
  }

  return { ok: res.ok, status: res.status, data };
};

/* ── Toast notification ────────────────────────────── */
const showToast = (message, type = 'info') => {
  const existing = document.querySelector('.rms-toast');
  if (existing) existing.remove();

  const colors = {
    success: '#10b981',
    error:   '#ef4444',
    info:    '#3b82f6',
    warning: '#f59e0b',
  };

  const toast = document.createElement('div');
  toast.className = 'rms-toast';
  toast.innerHTML = message;
  Object.assign(toast.style, {
    position:    'fixed',
    bottom:      '1.5rem',
    right:       '1.5rem',
    background:  '#161b22',
    border:      `1px solid ${colors[type]}`,
    color:       colors[type],
    padding:     '0.85rem 1.25rem',
    borderRadius:'10px',
    boxShadow:   '0 8px 24px rgba(0,0,0,0.5)',
    fontSize:    '0.875rem',
    fontWeight:  '600',
    zIndex:      '9999',
    maxWidth:    '320px',
    animation:   'slideUp 0.3s ease',
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};

/* ── Sidebar active link ────────────────────────────── */
const setActiveSidebarLink = () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
};

/* ── Populate sidebar user info ─────────────────────── */
const populateSidebarUser = () => {
  const user = getUser();
  if (!user) return;
  const nameEl  = document.getElementById('sidebar-user-name');
  const emailEl = document.getElementById('sidebar-user-email');
  const avatarEl= document.getElementById('sidebar-avatar');
  if (nameEl)  nameEl.textContent  = user.full_name || 'User';
  if (emailEl) emailEl.textContent = user.email || '';
  if (avatarEl) avatarEl.textContent = (user.full_name || 'U')[0].toUpperCase();
};

/* ── Logout ─────────────────────────────────────────── */
const logout = () => {
  clearAuth();
  window.location.href = '/index.html';
};

/* ── Status badge helper ────────────────────────────── */
const statusBadge = (status) => {
  const map = {
    'Selected':    'badge-selected',
    'Rejected':    'badge-rejected',
    'Under Review':'badge-review',
    'Pending':     'badge-pending',
  };
  return `<span class="badge ${map[status] || 'badge-pending'}">${status}</span>`;
};

/* ── Education level label ──────────────────────────── */
const eduLabel = (level) => {
  const labels = { 1:'High School', 2:'Diploma', 3:"Bachelor's", 4:"Master's", 5:'PhD' };
  return labels[level] || `Level ${level}`;
};

/* ── Format date ─────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '—';
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'short' }) : 'Present';

/* ── Score color ─────────────────────────────────────── */
const scoreColor = (score) => {
  if (score >= 70) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
};

/* ── Mobile sidebar toggle ──────────────────────────── */
const initMobileSidebar = () => {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.querySelector('.sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
};

/* ── Init shared UI on DOMContentLoaded ─────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setActiveSidebarLink();
  populateSidebarUser();
  initMobileSidebar();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
});
