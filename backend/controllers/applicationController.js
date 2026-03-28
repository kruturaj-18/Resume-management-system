const mongoose             = require('mongoose');
const Application          = require('../models/Application');
const Profile              = require('../models/Profile');
const Job                  = require('../models/Job');
const { runScreening }     = require('../utils/screeningEngine');

// ── Helper: format application for API response ────────
const formatApp = (app, job) => {
  const s = app.screening || {};
  return {
    application_id:      app._id,
    job_id:              app.jobId,
    applied_at:          app.createdAt,
    status:              app.status,
    job_title:           job?.title           || '',
    job_company:         job?.company         || '',
    job_location:        job?.location        || '',
    job_description:     job?.description     || '',
    min_education_level: job?.minEducationLevel  || 0,
    min_experience_years:job?.minExperienceYears || 0,
    overall_score:       s.overallScore   ?? null,
    skill_match_pct:     s.skillMatchPct  ?? null,
    education_met:       s.educationMet   ?? null,
    experience_met:      s.experienceMet  ?? null,
    experience_years:    s.experienceYears ?? null,
    skills_matched:      s.skillsMatched  || [],
    skills_missing:      s.skillsMissing  || [],
    screened_at:         s.screenedAt     || null,
  };
};

// ── POST /api/applications/apply/:jobId ───────────────
const applyForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId  = req.params.jobId;

    // Validate jobId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: 'Invalid job ID.' });
    }

    // Check job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Check already applied
    const existing = await Application.findOne({ userId, jobId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    // Check profile exists
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before applying.',
      });
    }

    // Run screening
    const screening = await runScreening(userId, jobId);

    // Create application with embedded screening result
    const application = await Application.create({
      userId,
      jobId,
      status:    screening.status,
      screening: {
        overallScore:    screening.overallScore,
        skillMatchPct:   screening.skillMatchPct,
        skillsMatched:   screening.skillsMatched,
        skillsMissing:   screening.skillsMissing,
        educationMet:    screening.educationMet,
        experienceMet:   screening.experienceMet,
        experienceYears: screening.experienceYears,
        screenedAt:      new Date(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application_id:   application._id,
        status:           screening.status,
        overall_score:    screening.overallScore,
        skill_match_pct:  screening.skillMatchPct,
        education_met:    screening.educationMet,
        experience_met:   screening.experienceMet,
        skills_matched:   screening.skillsMatched,
        skills_missing:   screening.skillsMissing,
        experience_years: screening.experienceYears,
      },
    });
  } catch (err) {
    console.error('applyForJob error:', err);
    return res.status(500).json({ success: false, message: 'Server error during application.' });
  }
};

// ── GET /api/applications ─────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user.id })
      .populate('jobId')
      .sort({ createdAt: -1 });

    const data = apps.map(app => formatApp(app, app.jobId));
    return res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('getMyApplications error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/applications/dashboard ──────────────────
const getDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Aggregation for stats
    const [statsResult, recentApps, profile] = await Promise.all([
      Application.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id:          null,
            total:        { $sum: 1 },
            selected:     { $sum: { $cond: [{ $eq: ['$status', 'Selected']    }, 1, 0] } },
            rejected:     { $sum: { $cond: [{ $eq: ['$status', 'Rejected']    }, 1, 0] } },
            under_review: { $sum: { $cond: [{ $eq: ['$status', 'Under Review'] }, 1, 0] } },
            avg_score:    { $avg: '$screening.overallScore' },
          },
        },
      ]),
      Application.find({ userId: req.user.id })
        .populate('jobId')
        .sort({ createdAt: -1 })
        .limit(5),
      Profile.findOne({ userId: req.user.id }),
    ]);

    const stats = statsResult[0]
      ? {
          total:        statsResult[0].total,
          selected:     statsResult[0].selected,
          rejected:     statsResult[0].rejected,
          under_review: statsResult[0].under_review,
          avg_score:    statsResult[0].avg_score
            ? parseFloat(statsResult[0].avg_score.toFixed(1))
            : 0,
        }
      : { total: 0, selected: 0, rejected: 0, under_review: 0, avg_score: 0 };

    const profileData = profile
      ? {
          full_name: profile.fullName,
          phone:     profile.phone,
          city:      profile.city,
          state:     profile.state,
          dob:       profile.dob,
        }
      : null;

    return res.json({
      success: true,
      data: {
        stats,
        recent_applications: recentApps.map(app => formatApp(app, app.jobId)),
        profile: profileData,
      },
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/applications/:id ─────────────────────────
const getApplicationById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID.' });
    }

    const app = await Application.findOne({
      _id:    req.params.id,
      userId: req.user.id,
    }).populate('jobId');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    return res.json({ success: true, data: formatApp(app, app.jobId) });
  } catch (err) {
    console.error('getApplicationById error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { applyForJob, getMyApplications, getDashboard, getApplicationById };
