/* dashboard.js */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const user = getUser();
  if (user) {
    document.getElementById('welcome-msg').textContent =
      `Welcome back, ${user.full_name || user.email}! 👋`;
  }

  await loadDashboard();
});

async function loadDashboard() {
  const res = await apiFetch('/applications/dashboard');
  if (!res || !res.ok) return;

  const { stats, recent_applications, profile } = res.data.data;

  // ── Stats ────────────────────────────────────────────
  document.getElementById('stat-total').textContent    = stats.total;
  document.getElementById('stat-selected').textContent = stats.selected;
  document.getElementById('stat-review').textContent   = stats.under_review;
  document.getElementById('stat-rejected').textContent = stats.rejected;
  document.getElementById('stat-avg').textContent      = stats.avg_score
    ? stats.avg_score.toFixed(1) + '%' : '—';

  // ── Recent Applications Table ─────────────────────────
  const tbody = document.getElementById('recent-tbody');
  if (!recent_applications || recent_applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">
      <span class="icon">📋</span>
      <h3>No applications yet</h3>
      <p>Browse jobs and apply to get started!</p>
      <a href="jobs.html" class="btn btn-primary btn-sm" style="margin-top:0.75rem">Browse Jobs</a>
    </div></td></tr>`;
  } else {
    tbody.innerHTML = recent_applications.map(app => `
      <tr>
        <td><strong style="color:var(--text-primary)">${app.job_title}</strong></td>
        <td>${app.job_company}</td>
        <td>${fmtDate(app.applied_at)}</td>
        <td>
          <span style="color:${scoreColor(app.overall_score || 0)};font-weight:700">
            ${app.overall_score != null ? app.overall_score.toFixed(1) + '%' : '—'}
          </span>
        </td>
        <td>${statusBadge(app.status)}</td>
      </tr>
    `).join('');
  }

  // ── Profile Snapshot ──────────────────────────────────
  const snap = document.getElementById('profile-snapshot');
  if (profile) {
    snap.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:0.6rem">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Name</span>
          <span style="color:var(--text-primary);font-weight:600">${profile.full_name || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Phone</span>
          <span>${profile.phone || '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">City</span>
          <span>${profile.city ? profile.city + (profile.state ? ', ' + profile.state : '') : '—'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Date of Birth</span>
          <span>${profile.dob ? fmtDate(profile.dob) : '—'}</span>
        </div>
      </div>
    `;
  } else {
    snap.innerHTML = `<div class="empty-state" style="padding:1rem">
      <span class="icon">👤</span>
      <p>No profile yet. <a href="profile.html">Set it up →</a></p>
    </div>`;
  }
}
