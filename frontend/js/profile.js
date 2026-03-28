/* profile.js */

let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  initTabs();
  await loadProfile();
  initProfileForm();
  initEducationModal();
  initExperienceModal();
  initSkillsSection();
});

/* ── Tabs ───────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

/* ── Load all profile data ──────────────────────────── */
async function loadProfile() {
  const res = await apiFetch('/profile');
  if (!res || !res.ok) return;

  const { profile, education, experience, skills } = res.data.data;
  const user = getUser();

  // Personal info
  if (profile) {
    currentProfile = profile;
    document.getElementById('full_name').value = profile.full_name || '';
    document.getElementById('phone').value     = profile.phone || '';
    document.getElementById('street').value    = profile.street || '';
    document.getElementById('city').value      = profile.city || '';
    document.getElementById('state').value     = profile.state || '';
    document.getElementById('pincode').value   = profile.pincode || '';
    if (profile.dob) {
      document.getElementById('dob').value = profile.dob.split('T')[0];
    }
  }

  if (user) document.getElementById('p-email').value = user.email;

  renderEducation(education);
  renderExperience(experience);
  renderSkills(skills);
}

/* ── Personal Profile Form ──────────────────────────── */
function initProfileForm() {
  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-profile-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Saving…';

    const body = {
      full_name: document.getElementById('full_name').value.trim(),
      phone:     document.getElementById('phone').value.trim() || null,
      street:    document.getElementById('street').value.trim() || null,
      city:      document.getElementById('city').value.trim() || null,
      state:     document.getElementById('state').value.trim() || null,
      pincode:   document.getElementById('pincode').value.trim() || null,
      dob:       document.getElementById('dob').value || null,
    };

    const res = await apiFetch('/profile', { method: 'PUT', body: JSON.stringify(body) });
    btn.disabled = false;
    btn.innerHTML = '💾 Save Profile';

    if (res?.ok) {
      // Update localStorage user name
      const user = getUser();
      if (user) { user.full_name = body.full_name; saveAuth(getToken(), user); }
      populateSidebarUser();
      showToast('Profile saved successfully!', 'success');
      document.getElementById('profile-alert').innerHTML =
        `<div class="alert alert-success">✅ Profile updated!</div>`;
      setTimeout(() => document.getElementById('profile-alert').innerHTML = '', 3000);
    } else {
      showToast(res?.data?.message || 'Failed to save profile', 'error');
    }
  });
}

/* ── Education ──────────────────────────────────────── */
function renderEducation(list) {
  const container = document.getElementById('education-list');
  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty-state card">
      <span class="icon">🎓</span><h3>No education added</h3>
      <p>Add your academic qualifications to improve your profile score.</p></div>`;
    return;
  }
  container.innerHTML = list.map(edu => `
    <div class="card" style="margin-bottom:0.85rem" id="edu-${edu.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem">
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">${edu.degree}</div>
          <div style="color:var(--text-secondary);font-size:0.875rem;margin-top:0.2rem">${edu.institution}</div>
          <div style="margin-top:0.5rem;display:flex;gap:0.75rem;flex-wrap:wrap">
            ${edu.year_of_passing ? `<span class="badge badge-purple">📅 ${edu.year_of_passing}</span>` : ''}
            ${edu.score ? `<span class="badge badge-purple">📊 ${edu.score} ${edu.score_type === 'cgpa' ? ' CGPA' : '%'}</span>` : ''}
            <span class="badge badge-purple">🎓 ${eduLabel(edu.education_level)}</span>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-outline btn-sm" onclick="openEduEdit(${edu.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteEdu(${edu.id})">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function initEducationModal() {
  const modal    = document.getElementById('edu-modal');
  const closeBtn = document.getElementById('edu-modal-close');
  const addBtn   = document.getElementById('add-edu-btn');
  const form     = document.getElementById('edu-form');

  addBtn.addEventListener('click', () => {
    document.getElementById('edu-modal-title').textContent = 'Add Education';
    form.reset();
    document.getElementById('edu-id').value = '';
    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edu-id').value;
    const body = {
      degree:          document.getElementById('edu-degree').value.trim(),
      institution:     document.getElementById('edu-institution').value.trim(),
      year_of_passing: document.getElementById('edu-year').value || null,
      score:           document.getElementById('edu-score').value || null,
      score_type:      document.getElementById('edu-score-type').value,
      education_level: parseInt(document.getElementById('edu-level').value),
    };

    const endpoint = id ? `/profile/education/${id}` : '/profile/education';
    const method   = id ? 'PUT' : 'POST';
    const res = await apiFetch(endpoint, { method, body: JSON.stringify(body) });

    if (res?.ok) {
      modal.classList.remove('open');
      showToast(id ? 'Education updated!' : 'Education added!', 'success');
      await loadProfile();
    } else {
      showToast(res?.data?.message || 'Failed to save education', 'error');
    }
  });
}

window.openEduEdit = async (id) => {
  const res = await apiFetch('/profile');
  if (!res?.ok) return;
  const edu = res.data.data.education.find(e => e.id === id);
  if (!edu) return;

  document.getElementById('edu-modal-title').textContent = 'Edit Education';
  document.getElementById('edu-id').value          = edu.id;
  document.getElementById('edu-degree').value      = edu.degree;
  document.getElementById('edu-institution').value = edu.institution;
  document.getElementById('edu-year').value         = edu.year_of_passing || '';
  document.getElementById('edu-score').value        = edu.score || '';
  document.getElementById('edu-score-type').value   = edu.score_type || 'percentage';
  document.getElementById('edu-level').value        = edu.education_level;
  document.getElementById('edu-modal').classList.add('open');
};

window.deleteEdu = async (id) => {
  if (!confirm('Delete this education entry?')) return;
  const res = await apiFetch(`/profile/education/${id}`, { method: 'DELETE' });
  if (res?.ok) { showToast('Education deleted', 'success'); await loadProfile(); }
  else showToast('Failed to delete', 'error');
};

/* ── Experience ─────────────────────────────────────── */
function renderExperience(list) {
  const container = document.getElementById('experience-list');
  if (!list || list.length === 0) {
    container.innerHTML = `<div class="empty-state card">
      <span class="icon">💼</span><h3>No experience added</h3>
      <p>Add work experience to match job requirements better.</p></div>`;
    return;
  }
  container.innerHTML = list.map(exp => `
    <div class="card" style="margin-bottom:0.85rem" id="exp-${exp.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem">
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--text-primary)">${exp.job_title}</div>
          <div style="color:var(--text-secondary);font-size:0.875rem;margin-top:0.2rem">${exp.company}</div>
          <div style="margin-top:0.5rem;display:flex;gap:0.75rem;flex-wrap:wrap">
            <span class="badge badge-purple">
              📅 ${fmtDateShort(exp.start_date)} → ${exp.is_current ? '<b>Present</b>' : fmtDateShort(exp.end_date)}
            </span>
            ${exp.is_current ? '<span class="badge badge-selected">Current</span>' : ''}
          </div>
          ${exp.responsibilities ? `<p style="margin-top:0.65rem;font-size:0.825rem;color:var(--text-secondary);line-height:1.6">${exp.responsibilities}</p>` : ''}
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-outline btn-sm" onclick="openExpEdit(${exp.id})">✏️ Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteExp(${exp.id})">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

function initExperienceModal() {
  const modal    = document.getElementById('exp-modal');
  const closeBtn = document.getElementById('exp-modal-close');
  const addBtn   = document.getElementById('add-exp-btn');
  const form     = document.getElementById('exp-form');
  const currentChk = document.getElementById('exp-current');

  addBtn.addEventListener('click', () => {
    document.getElementById('exp-modal-title').textContent = 'Add Experience';
    form.reset();
    document.getElementById('exp-id').value = '';
    document.getElementById('exp-end').disabled = false;
    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  currentChk.addEventListener('change', () => {
    document.getElementById('exp-end').disabled = currentChk.checked;
    if (currentChk.checked) document.getElementById('exp-end').value = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('exp-id').value;
    const isCurrent = document.getElementById('exp-current').checked;
    const body = {
      job_title:       document.getElementById('exp-title').value.trim(),
      company:         document.getElementById('exp-company').value.trim(),
      start_date:      document.getElementById('exp-start').value,
      end_date:        isCurrent ? null : (document.getElementById('exp-end').value || null),
      is_current:      isCurrent,
      responsibilities: document.getElementById('exp-resp').value.trim() || null,
    };

    const endpoint = id ? `/profile/experience/${id}` : '/profile/experience';
    const method   = id ? 'PUT' : 'POST';
    const res = await apiFetch(endpoint, { method, body: JSON.stringify(body) });

    if (res?.ok) {
      modal.classList.remove('open');
      showToast(id ? 'Experience updated!' : 'Experience added!', 'success');
      await loadProfile();
    } else {
      const msg = res?.data?.errors?.map(e => e.message).join(', ') || res?.data?.message || 'Failed';
      showToast(msg, 'error');
    }
  });
}

window.openExpEdit = async (id) => {
  const res = await apiFetch('/profile');
  if (!res?.ok) return;
  const exp = res.data.data.experience.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('exp-modal-title').textContent = 'Edit Experience';
  document.getElementById('exp-id').value       = exp.id;
  document.getElementById('exp-title').value    = exp.job_title;
  document.getElementById('exp-company').value  = exp.company;
  document.getElementById('exp-start').value    = exp.start_date?.split('T')[0] || '';
  document.getElementById('exp-end').value      = exp.end_date?.split('T')[0] || '';
  document.getElementById('exp-current').checked = !!exp.is_current;
  document.getElementById('exp-end').disabled   = !!exp.is_current;
  document.getElementById('exp-resp').value     = exp.responsibilities || '';
  document.getElementById('exp-modal').classList.add('open');
};

window.deleteExp = async (id) => {
  if (!confirm('Delete this experience entry?')) return;
  const res = await apiFetch(`/profile/experience/${id}`, { method: 'DELETE' });
  if (res?.ok) { showToast('Experience deleted', 'success'); await loadProfile(); }
  else showToast('Failed to delete', 'error');
};

/* ── Skills ─────────────────────────────────────────── */
function renderSkills(list) {
  const container = document.getElementById('skills-list');
  if (!list || list.length === 0) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:0.875rem">No skills added yet. Add your first skill above.</span>';
    return;
  }
  container.innerHTML = list.map(s => `
    <span class="skill-tag">
      ${s.skill_name}
      <small style="opacity:0.7">(${s.proficiency})</small>
      <button class="remove" onclick="deleteSkill(${s.id})" title="Remove skill">✕</button>
    </span>
  `).join('');
}

function initSkillsSection() {
  document.getElementById('add-skill-btn').addEventListener('click', async () => {
    const name = document.getElementById('new-skill').value.trim();
    const prof = document.getElementById('new-proficiency').value;
    if (!name) { showToast('Enter a skill name', 'warning'); return; }

    const res = await apiFetch('/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ skill_name: name, proficiency: prof }),
    });

    if (res?.ok) {
      document.getElementById('new-skill').value = '';
      showToast(`Skill "${name}" added!`, 'success');
      await loadProfile();
    } else {
      showToast(res?.data?.message || 'Failed to add skill', 'error');
    }
  });

  document.getElementById('new-skill').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-skill-btn').click(); }
  });
}

window.deleteSkill = async (id) => {
  const res = await apiFetch(`/profile/skills/${id}`, { method: 'DELETE' });
  if (res?.ok) { showToast('Skill removed', 'success'); await loadProfile(); }
  else showToast('Failed to remove skill', 'error');
};
