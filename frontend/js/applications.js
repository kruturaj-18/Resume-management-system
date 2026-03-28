/* applications.js */

let allApplications = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadApplications();
  initFilters();
  initModal();
});

/* ── Load Applications ──────────────────────────────── */
async function loadApplications() {
  const res = await apiFetch('/applications');
  if (!res || !res.ok) {
    document.getElementById('apps-tbody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--danger)">Failed to load applications.</td></tr>`;
    return;
  }

  allApplications = res.data.data || [];
  renderTable(allApplications);
}

/* ── Render Table ───────────────────────────────────── */
function renderTable(list) {
  const tbody = document.getElementById('apps-tbody');
  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <span class="icon">📋</span>
        <h3>No applications found</h3>
        <p>Apply for jobs to see your application history here.</p>
        <a href="jobs.html" class="btn btn-primary btn-sm" style="margin-top:0.75rem">Browse Jobs</a>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(app => {
    const score = app.overall_score;
    const scoreColor2 = score != null ? scoreColor(score) : 'var(--text-muted)';
    const scoreText   = score != null ? score.toFixed(1) + '%' : '—';
    const skillPct    = app.skill_match_pct != null ? app.skill_match_pct.toFixed(0) + '%' : '—';
    const eduMet      = app.education_met != null ? (app.education_met ? '<span style="color:var(--success)">✅</span>' : '<span style="color:var(--danger)">❌</span>') : '—';
    const expMet      = app.experience_met != null ? (app.experience_met ? '<span style="color:var(--success)">✅</span>' : '<span style="color:var(--danger)">❌</span>') : '—';

    return `
      <tr>
        <td><strong style="color:var(--text-primary)">${app.job_title}</strong></td>
        <td>${app.job_company || '—'}</td>
        <td style="white-space:nowrap">${fmtDate(app.applied_at)}</td>
        <td style="font-weight:700;color:${scoreColor2}">${scoreText}</td>
        <td>${skillPct}</td>
        <td>${eduMet}</td>
        <td>${expMet}</td>
        <td>${statusBadge(app.status)}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="openDetail('${app.application_id}')">
            🔍 Details
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ── Filters ─────────────────────────────────────────── */
function initFilters() {
  document.getElementById('status-filter').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) { renderTable(allApplications); return; }
    renderTable(allApplications.filter(a => a.status === val));
  });
}

/* ── Detail Modal ───────────────────────────────────── */
function initModal() {
  const modal    = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('detail-modal-close');
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
}

window.openDetail = async (applicationId) => {
  const res = await apiFetch(`/applications/${applicationId}`);
  if (!res || !res.ok) { showToast('Failed to load details', 'error'); return; }

  const d = res.data.data;
  const statusColor = d.status === 'Selected' ? 'var(--success)' : d.status === 'Under Review' ? 'var(--warning)' : 'var(--danger)';

  document.getElementById('detail-modal-title').textContent = d.job_title;
  document.getElementById('detail-modal-body').innerHTML = `
    <!-- Status Banner -->
    <div style="text-align:center;padding:1.25rem;background:var(--bg-glass);border-radius:var(--radius-sm);margin-bottom:1rem;border:1px solid ${statusColor}30">
      <div style="font-size:1.5rem;font-weight:900;color:${statusColor}">${d.status}</div>
      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">
        Applied on ${fmtDate(d.applied_at)}
      </div>
    </div>

    <!-- Job Info -->
    <div class="screening-card" style="margin-bottom:1rem">
      <div class="screening-row"><span class="label">Company</span><span class="value">${d.job_company || '—'}</span></div>
      <div class="screening-row"><span class="label">Location</span><span class="value">${d.job_location || '—'}</span></div>
      <div class="screening-row"><span class="label">Required Edu.</span><span class="value">${eduLabel(d.min_education_level)}</span></div>
      <div class="screening-row"><span class="label">Required Exp.</span><span class="value">${d.min_experience_years > 0 ? d.min_experience_years + ' years' : 'Fresher OK'}</span></div>
    </div>

    <!-- Screening Scores -->
    <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.75rem">
      🎯 Screening Breakdown
    </div>

    <!-- Overall Score with bar -->
    <div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.35rem">
        <span style="font-weight:600">Overall Score</span>
        <span style="font-weight:700;color:${scoreColor(d.overall_score || 0)}">${d.overall_score != null ? d.overall_score.toFixed(1) + '%' : '—'}</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill ${d.overall_score >= 70 ? 'green' : d.overall_score >= 50 ? 'yellow' : 'red'}"
             style="width:${d.overall_score || 0}%"></div>
      </div>
    </div>

    <!-- Skill Match with bar -->
    <div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.35rem">
        <span>Skill Match</span>
        <span style="font-weight:600">${d.skill_match_pct != null ? d.skill_match_pct.toFixed(1) + '%' : '—'}</span>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width:${d.skill_match_pct || 0}%"></div>
      </div>
    </div>

    <div class="screening-card" style="margin-bottom:1rem">
      <div class="screening-row">
        <span class="label">Education Requirement</span>
        <span style="font-weight:600;color:${d.education_met ? 'var(--success)' : 'var(--danger)'}">
          ${d.education_met ? '✅ Met' : '❌ Not Met'}
        </span>
      </div>
      <div class="screening-row">
        <span class="label">Experience (${d.experience_years || 0} yrs)</span>
        <span style="font-weight:600;color:${d.experience_met ? 'var(--success)' : 'var(--danger)'}">
          ${d.experience_met ? '✅ Met' : '❌ Not Met'}
        </span>
      </div>
    </div>

    <!-- Matched/Missing Skills -->
    ${d.skills_matched?.length ? `
      <div style="margin-bottom:0.75rem">
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--success);margin-bottom:0.4rem">Matched Skills (${d.skills_matched.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
          ${d.skills_matched.map(s => `<span class="badge badge-selected">${s}</span>`).join('')}
        </div>
      </div>` : ''}

    ${d.skills_missing?.length ? `
      <div>
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--danger);margin-bottom:0.4rem">Missing Skills (${d.skills_missing.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
          ${d.skills_missing.map(s => `<span class="badge badge-rejected">${s}</span>`).join('')}
        </div>
      </div>` : ''}
  `;

  document.getElementById('detail-modal').classList.add('open');
};
