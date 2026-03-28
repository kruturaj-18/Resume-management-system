const Profile = require('../models/Profile');
const Job     = require('../models/Job');

/**
 * Screening Engine (MongoDB version)
 * All data fetched via Mongoose — no raw SQL.
 *
 * Weights:  Skills 50%  |  Education 25%  |  Experience 25%
 *
 * Status:
 *   overall >= 70 AND edu_met AND exp_met  → Selected
 *   overall >= 50 AND (edu_met OR exp_met) → Under Review
 *   else                                   → Rejected
 */
const runScreening = async (userId, jobId) => {
  // ── 1. Fetch data in parallel ─────────────────────────
  const [profile, job] = await Promise.all([
    Profile.findOne({ userId }),
    Job.findById(jobId),
  ]);

  if (!job) throw new Error('Job not found');

  // ── 2. Skill matching ─────────────────────────────────
  const requiredSkills   = (job.requiredSkills || []).map(s => s.name.toLowerCase());
  const candidateSkills  = (profile?.skills   || []).map(s => s.skillName.toLowerCase());

  const skillsMatched  = requiredSkills.filter(s => candidateSkills.includes(s));
  const skillsMissing  = requiredSkills.filter(s => !candidateSkills.includes(s));
  const skillMatchPct  = requiredSkills.length > 0
    ? parseFloat(((skillsMatched.length / requiredSkills.length) * 100).toFixed(2))
    : 100;

  // ── 3. Education check ────────────────────────────────
  const education  = profile?.education || [];
  const highestEdu = education.reduce((max, e) => Math.max(max, e.educationLevel || 0), 0);
  const educationMet = highestEdu >= job.minEducationLevel;

  // ── 4. Experience calculation (in years) ──────────────
  const experience = profile?.experience || [];
  let totalDays = 0;
  for (const exp of experience) {
    const end   = exp.isCurrent ? new Date() : (exp.endDate || new Date());
    const start = new Date(exp.startDate);
    totalDays  += Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
  }
  const experienceYears = parseFloat((totalDays / 365.25).toFixed(1));
  const experienceMet   = experienceYears >= job.minExperienceYears;

  // ── 5. Component scores ───────────────────────────────
  // Education score (binary with soft partial credit)
  const eduScore = educationMet
    ? 100
    : Math.max(0, (highestEdu / Math.max(job.minEducationLevel, 1)) * 80);

  // Experience score (partial credit if close)
  let expScore;
  if (job.minExperienceYears === 0)  expScore = 100;
  else if (experienceMet)            expScore = 100;
  else expScore = Math.min((experienceYears / job.minExperienceYears) * 100, 99);

  // ── 6. Weighted overall score ─────────────────────────
  const overallScore = parseFloat(
    ((skillMatchPct * 0.50) + (eduScore * 0.25) + (expScore * 0.25)).toFixed(2)
  );

  // ── 7. Status logic ───────────────────────────────────
  let status;
  if (overallScore >= 70 && educationMet && experienceMet)       status = 'Selected';
  else if (overallScore >= 50 && (educationMet || experienceMet)) status = 'Under Review';
  else                                                            status = 'Rejected';

  return {
    overallScore,
    skillMatchPct,
    skillsMatched,
    skillsMissing,
    educationMet,
    experienceMet,
    experienceYears,
    status,
  };
};

module.exports = { runScreening };
