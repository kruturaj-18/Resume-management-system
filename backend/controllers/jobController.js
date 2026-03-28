const Job = require('../models/Job');

// ── GET /api/jobs ─────────────────────────────────────
const getJobs = async (req, res) => {
  try {
    const { search, minExp, maxExp } = req.query;

    const filter = { isActive: true };

    // Text search across title, company, description
    if (search && search.trim()) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { company:     { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minExp !== undefined) filter.minExperienceYears = { $gte: parseFloat(minExp) };
    if (maxExp !== undefined) {
      filter.minExperienceYears = { ...(filter.minExperienceYears || {}), $lte: parseFloat(maxExp) };
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    // Format for frontend (keep required_skills as array of { name, is_mandatory })
    const formatted = jobs.map(job => ({
      id:                   job._id,
      title:                job.title,
      description:          job.description,
      company:              job.company,
      location:             job.location,
      min_education_level:  job.minEducationLevel,
      min_experience_years: job.minExperienceYears,
      salary_min:           job.salaryMin,
      salary_max:           job.salaryMax,
      is_active:            job.isActive,
      posted_at:            job.createdAt,
      deadline:             job.deadline,
      required_skills:      (job.requiredSkills || []).map(s => ({
        name:         s.name,
        is_mandatory: s.isMandatory,
      })),
    }));

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('getJobs error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/jobs/:id ─────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    return res.json({
      success: true,
      data: {
        id:                   job._id,
        title:                job.title,
        description:          job.description,
        company:              job.company,
        location:             job.location,
        min_education_level:  job.minEducationLevel,
        min_experience_years: job.minExperienceYears,
        salary_min:           job.salaryMin,
        salary_max:           job.salaryMax,
        posted_at:            job.createdAt,
        deadline:             job.deadline,
        education_label:      Job.educationLabel(job.minEducationLevel),
        required_skills:      (job.requiredSkills || []).map(s => ({
          name:         s.name,
          is_mandatory: s.isMandatory,
        })),
      },
    });
  } catch (err) {
    console.error('getJobById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getJobs, getJobById };
