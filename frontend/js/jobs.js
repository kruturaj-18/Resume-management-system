/* jobs.js */

let allJobs    = [];
let selectedJob = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadJobs();
  initSearch();
  initModals();
});

/* ── Load jobs ──────────────────────────────────────── */
async function loadJobs(params = {}) {
  const grid = document.getElementById('jobs-grid');
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
    <span style="font-size:2rem">⏳</span><p>Loading jobs…</p></div>`;

  let qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.minExp) qs.set('minExp', params.minExp);

  const res = await apiFetch(`/jobs?${qs.toString()}`);
  if (!res || !res.ok) {
    grid.innerHTML = `<div style="grid-column:1/-1" class="empty-state">
      <span class="icon">⚠️</span><h3>Failed to load jobs</h3></div>`;
    return;
  }

  allJobs = res.data.data || [];
  document.getElementById('job-count-label').textContent =
    `${allJobs.length} job${allJobs.length !== 1 ? 's' : ''} available`;

  if (allJobs.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1" class="empty-state card">
      <span class="icon">🔍</span><h3>No jobs found</h3>
      <p>Try different search keywords.</p></div>`;
    return;
  }

  grid.innerHTML = allJobs.map(job => renderJobCard(job)).join('');

  // Attach click events
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      const job = allJobs.find(j => String(j.id) === String(card.dataset.id));
      if (job) openJobModal(job);
    });
  });
}

/* ── Job Card HTML ──────────────────────────────────── */
function renderJobCard(job) {
  const skills = job.required_skills || [];
  const visibleSkills = skills.slice(0, 4);
  const extra = skills.length - 4;

  const eduMap = { 1:'High School', 2:'Diploma', 3:"Bachelor's", 4:"Master's", 5:'PhD' };
  const salaryText = job.salary_min
    ? `₹${(job.salary_min/100000).toFixed(1)}L – ₹${(job.salary_max/100000).toFixed(1)}L`
    : 'Salary not disclosed';

  return `
    <div class="job-card" data-id="${job.id}">
      <div class="job-card-header">
        <div>
          <div class="job-card-title">${job.title}</div>
          <div class="job-card-company">🏢 ${job.company}</div>
        </div>
      </div>
      <div class="job-meta">
        ${job.location ? `<span class="job-meta-item">📍 ${job.location}</span>` : ''}
        <span class="job-meta-item">🎓 ${eduMap[job.min_education_level] || 'Any'}</span>
        <span class="job-meta-item">⏳ ${job.min_experience_years > 0 ? job.min_experience_years + ' yrs exp' : 'Fresher OK'}</span>
        <span class="job-meta-item">💰 ${salaryText}</span>
      </div>
      <div class="job-skills">
        ${visibleSkills.map(s => `<span class="skill-tag" style="font-size:0.72rem">${s.name || s}${s.is_mandatory === false ? '' : ''}</span>`).join('')}
        ${extra > 0 ? `<span class="badge badge-purple">+${extra} more</span>` : ''}
      </div>
      <div style="margin-top:0.85rem;font-size:0.8rem;color:var(--text-muted)">
        Posted ${fmtDate(job.posted_at)}
        ${job.deadline ? ` · Deadline: <span style="color:var(--warning)">${fmtDate(job.deadline)}</span>` : ''}
      </div>
    </div>
  `;
}

/* ── Search ─────────────────────────────────────────── */
function initSearch() {
  const searchBtn = document.getElementById('search-btn');
  const clearBtn  = document.getElementById('clear-btn');

  searchBtn.addEventListener('click', () => {
    loadJobs({
      search: document.getElementById('search-input').value.trim(),
      minExp: document.getElementById('exp-filter').value,
    });
  });

  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });

  clearBtn.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('exp-filter').value   = '';
    loadJobs();
  });
}

/* ── Modals ─────────────────────────────────────────── */
function initModals() {
  const jobModal    = document.getElementById('job-modal');
  const resultModal = document.getElementById('result-modal');
  const applyBtn    = document.getElementById('apply-btn');

  document.getElementById('job-modal-close').addEventListener('click',  () => jobModal.classList.remove('open'));
  document.getElementById('job-modal-close2').addEventListener('click', () => jobModal.classList.remove('open'));
  document.getElementById('result-modal-close').addEventListener('click', () => resultModal.classList.remove('open'));
  document.getElementById('result-close2').addEventListener('click',     () => resultModal.classList.remove('open'));

  jobModal.addEventListener('click', (e)    => { if (e.target === jobModal)    jobModal.classList.remove('open'); });
  resultModal.addEventListener('click', (e) => { if (e.target === resultModal) resultModal.classList.remove('open'); });

  applyBtn.addEventListener('click', applyForJob);
}

function openJobModal(job) {
  selectedJob = job;
  const eduMap = { 1:'High School', 2:'Diploma', 3:"Bachelor's Degree", 4:"Master's Degree", 5:'PhD' };
  const skills = job.required_skills || [];

  document.getElementById('modal-job-title').textContent = job.title;
  document.getElementById('job-modal-body').innerHTML = `
    <div style="margin-bottom:1rem">
      <div style="font-size:1.05rem;font-weight:700;color:var(--accent-light)">${job.company}</div>
      ${job.location ? `<div style="color:var(--text-secondary);font-size:0.875rem;margin-top:0.2rem">📍 ${job.location}</div>` : ''}
    </div>

    <div class="screening-card" style="margin-bottom:1rem">
      <div class="screening-row">
        <span class="label">Min. Education</span>
        <span class="value">${eduMap[job.min_education_level] || 'Any'}</span>
      </div>
      <div class="screening-row">
        <span class="label">Min. Experience</span>
        <span class="value">${job.min_experience_years > 0 ? job.min_experience_years + ' years' : 'Fresher OK'}</span>
      </div>
      ${job.salary_min ? `<div class="screening-row">
        <span class="label">Salary Range</span>
        <span class="value">₹${(job.salary_min/100000).toFixed(1)}L – ₹${(job.salary_max/100000).toFixed(1)}L</span>
      </div>` : ''}
    </div>

    <div style="margin-bottom:1rem">
      <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.5rem">Required Skills</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem">
        ${skills.map(s => `<span class="skill-tag">${s.name || s}${!s.is_mandatory ? ' <small>(nice)</small>' : ''}</span>`).join('') || '<span style="color:var(--text-muted)">No specific skills listed</span>'}
      </div>
    </div>

    <div style="margin-bottom:0.5rem">
      <div style="font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:0.5rem">Job Description</div>
      <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7">${job.description}</p>
    </div>
  `;

  document.getElementById('job-modal').classList.add('open');
}

/* ── Apply ──────────────────────────────────────────── */
async function applyForJob() {
  if (!selectedJob) return;
  const applyBtn = document.getElementById('apply-btn');
  applyBtn.disabled = true;
  applyBtn.innerHTML = '<span class="spinner"></span> Applying…';

  const res = await apiFetch(`/applications/apply/${selectedJob.id}`, { method: 'POST' });

  applyBtn.disabled = false;
  applyBtn.innerHTML = '⚡ Apply Now';

  if (!res) return;

  document.getElementById('job-modal').classList.remove('open');

  if (res.ok) {
    const d = res.data.data;
    showScreeningResult(selectedJob.title, d);
  } else {
    const msg = res.data?.message || 'Application failed.';
    if (res.status === 409) {
      showToast(msg, 'warning');
    } else {
      showToast(msg, 'error');
    }
  }
}

/* ── Screening Result Modal ─────────────────────────── */
function showScreeningResult(jobTitle, result) {
  const { status, overall_score, skill_match_pct, education_met, experience_met, skills_matched, skills_missing, experience_years } = result;

  const color = status === 'Selected' ? 'var(--success)' : status === 'Under Review' ? 'var(--warning)' : 'var(--danger)';
  const icon  = status === 'Selected' ? '🎉' : status === 'Under Review' ? '🔍' : '❌';

  document.getElementById('result-modal-body').innerHTML = `
    <div style="text-align:center;padding:1rem 0 1.5rem">
      <div style="font-size:3rem;margin-bottom:0.5rem">${icon}</div>
      <div style="font-size:1.25rem;font-weight:800;color:${color}">${status}</div>
      <div style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.3rem">Application for "${jobTitle}"</div>
    </div>

    <div class="screening-card">
      <div class="screening-row">
        <span class="label">Overall Score</span>
        <span class="value" style="color:${scoreColor(overall_score)};font-size:1.1rem">${overall_score.toFixed(1)}%</span>
      </div>
      <div class="screening-row">
        <span class="label">Skill Match</span>
        <span class="value">${skill_match_pct.toFixed(1)}%</span>
      </div>
      <div class="screening-row">
        <span class="label">Education</span>
        <span class="value" style="color:${education_met ? 'var(--success)' : 'var(--danger)'}">
          ${education_met ? '✅ Met' : '❌ Not Met'}
        </span>
      </div>
      <div class="screening-row">
        <span class="label">Experience (${experience_years} yrs)</span>
        <span class="value" style="color:${experience_met ? 'var(--success)' : 'var(--danger)'}">
          ${experience_met ? '✅ Met' : '❌ Not Met'}
        </span>
      </div>
    </div>

    ${skills_matched?.length ? `
      <div style="margin-top:1rem">
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--success);margin-bottom:0.4rem">✅ Matched Skills</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
          ${skills_matched.map(s => `<span class="badge badge-selected">${s}</span>`).join('')}
        </div>
      </div>` : ''}

    ${skills_missing?.length ? `
      <div style="margin-top:0.85rem">
        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--danger);margin-bottom:0.4rem">❌ Missing Skills</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.35rem">
          ${skills_missing.map(s => `<span class="badge badge-rejected">${s}</span>`).join('')}
        </div>
      </div>` : ''}

    <div style="margin-top:1rem;padding:0.85rem;background:var(--bg-glass);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--text-secondary)">
      ${status === 'Selected'
        ? '🎉 Congratulations! You meet all the requirements for this position.'
        : status === 'Under Review'
        ? '🔍 Your application meets some criteria. You are under review.'
        : '💡 Tip: Improve your profile by adding more relevant skills or experience.'}
    </div>
  `;

  document.getElementById('result-modal').classList.add('open');
}
