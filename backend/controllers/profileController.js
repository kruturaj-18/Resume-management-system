const { body }   = require('express-validator');
const Profile    = require('../models/Profile');
const User       = require('../models/User');
const { validate } = require('../middleware/validationMiddleware');

// ── Helper: format profile for API response ───────────
const formatProfile = (profile, userEmail) => ({
  id:       profile._id,
  userId:   profile.userId,
  full_name:profile.fullName,
  email:    userEmail || null,
  phone:    profile.phone,
  street:   profile.street,
  city:     profile.city,
  state:    profile.state,
  pincode:  profile.pincode,
  dob:      profile.dob,
});

// ── Helper: format education/experience/skills for API response ──
const formatEdu = (e) => ({
  id:              e._id,
  degree:          e.degree,
  institution:     e.institution,
  year_of_passing: e.yearOfPassing,
  score:           e.score,
  score_type:      e.scoreType,
  education_level: e.educationLevel,
});

const formatExp = (e) => ({
  id:               e._id,
  job_title:        e.jobTitle,
  company:          e.company,
  start_date:       e.startDate,
  end_date:         e.endDate,
  is_current:       e.isCurrent ? 1 : 0,
  responsibilities: e.responsibilities,
});

const formatSkill = (s) => ({
  id:         s._id,
  skill_name: s.skillName,
  proficiency:s.proficiency,
});

// ── GET /api/profile ──────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [profile, user] = await Promise.all([
      Profile.findOne({ userId }),
      User.findById(userId),
    ]);

    return res.json({
      success: true,
      data: {
        profile:    profile ? formatProfile(profile, user?.email) : null,
        education:  (profile?.education  || []).map(formatEdu),
        experience: (profile?.experience || []).map(formatExp),
        skills:     (profile?.skills     || []).map(formatSkill),
      },
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PUT /api/profile ──────────────────────────────────
const updateProfile = [
  body('full_name').notEmpty().trim().withMessage('Full name is required'),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('Invalid date of birth'),
  validate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { full_name, phone, street, city, state, pincode, dob } = req.body;

      const profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: { fullName: full_name, phone, street, city, state, pincode, dob: dob || null } },
        { new: true, upsert: true, runValidators: true }
      );

      return res.json({
        success: true,
        message: 'Profile updated',
        data:    formatProfile(profile),
      });
    } catch (err) {
      console.error('updateProfile error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

// ─────────────────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────────────────

const addEducation = [
  body('degree').notEmpty().trim().withMessage('Degree is required'),
  body('institution').notEmpty().trim().withMessage('Institution is required'),
  body('education_level').isInt({ min: 1, max: 5 }).withMessage('Education level 1-5 required'),
  validate,
  async (req, res) => {
    try {
      const { degree, institution, year_of_passing, score, score_type, education_level } = req.body;

      const newEdu = {
        degree, institution,
        yearOfPassing:  year_of_passing  || null,
        score:          score            || null,
        scoreType:      score_type       || 'percentage',
        educationLevel: parseInt(education_level),
      };

      const profile = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        { $push: { education: newEdu } },
        { new: true, upsert: true }
      );

      const added = profile.education[profile.education.length - 1];
      return res.status(201).json({
        success: true,
        message: 'Education added',
        data:    formatEdu(added),
      });
    } catch (err) {
      console.error('addEducation error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

const updateEducation = [
  body('degree').notEmpty().trim().withMessage('Degree is required'),
  body('institution').notEmpty().trim().withMessage('Institution is required'),
  body('education_level').isInt({ min: 1, max: 5 }).withMessage('Education level 1-5 required'),
  validate,
  async (req, res) => {
    try {
      const { degree, institution, year_of_passing, score, score_type, education_level } = req.body;
      const eduId = req.params.id;

      const result = await Profile.findOneAndUpdate(
        { userId: req.user.id, 'education._id': eduId },
        {
          $set: {
            'education.$.degree':         degree,
            'education.$.institution':    institution,
            'education.$.yearOfPassing':  year_of_passing  || null,
            'education.$.score':          score            || null,
            'education.$.scoreType':      score_type       || 'percentage',
            'education.$.educationLevel': parseInt(education_level),
          },
        },
        { new: true }
      );

      if (!result) return res.status(404).json({ success: false, message: 'Education entry not found.' });
      return res.json({ success: true, message: 'Education updated' });
    } catch (err) {
      console.error('updateEducation error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

const deleteEducation = async (req, res) => {
  try {
    const result = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { education: { _id: req.params.id } } },
      { new: true }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Education not found.' });
    return res.json({ success: true, message: 'Education deleted' });
  } catch (err) {
    console.error('deleteEducation error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────
// EXPERIENCE
// ─────────────────────────────────────────────────────

const addExperience = [
  body('job_title').notEmpty().trim().withMessage('Job title is required'),
  body('company').notEmpty().trim().withMessage('Company is required'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  validate,
  async (req, res) => {
    try {
      const { job_title, company, start_date, end_date, is_current, responsibilities } = req.body;

      const newExp = {
        jobTitle:        job_title,
        company,
        startDate:       new Date(start_date),
        endDate:         is_current ? null : (end_date ? new Date(end_date) : null),
        isCurrent:       !!is_current,
        responsibilities: responsibilities || null,
      };

      const profile = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        { $push: { experience: newExp } },
        { new: true, upsert: true }
      );

      const added = profile.experience[profile.experience.length - 1];
      return res.status(201).json({
        success: true,
        message: 'Experience added',
        data:    formatExp(added),
      });
    } catch (err) {
      console.error('addExperience error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

const updateExperience = [
  body('job_title').notEmpty().trim().withMessage('Job title is required'),
  body('company').notEmpty().trim().withMessage('Company is required'),
  body('start_date').isISO8601().withMessage('Valid start date required'),
  validate,
  async (req, res) => {
    try {
      const { job_title, company, start_date, end_date, is_current, responsibilities } = req.body;
      const expId = req.params.id;

      const result = await Profile.findOneAndUpdate(
        { userId: req.user.id, 'experience._id': expId },
        {
          $set: {
            'experience.$.jobTitle':         job_title,
            'experience.$.company':          company,
            'experience.$.startDate':        new Date(start_date),
            'experience.$.endDate':          is_current ? null : (end_date ? new Date(end_date) : null),
            'experience.$.isCurrent':        !!is_current,
            'experience.$.responsibilities': responsibilities || null,
          },
        },
        { new: true }
      );

      if (!result) return res.status(404).json({ success: false, message: 'Experience entry not found.' });
      return res.json({ success: true, message: 'Experience updated' });
    } catch (err) {
      console.error('updateExperience error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

const deleteExperience = async (req, res) => {
  try {
    const result = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { experience: { _id: req.params.id } } },
      { new: true }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Experience not found.' });
    return res.json({ success: true, message: 'Experience deleted' });
  } catch (err) {
    console.error('deleteExperience error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────────────

const addSkill = [
  body('skill_name').notEmpty().trim().withMessage('Skill name required'),
  body('proficiency')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid proficiency'),
  validate,
  async (req, res) => {
    try {
      const { skill_name, proficiency } = req.body;
      const normalizedName = skill_name.trim();

      // Check for duplicate skill (case-insensitive)
      const existing = await Profile.findOne({
        userId: req.user.id,
        'skills.skillName': { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Skill already exists for this user' });
      }

      const newSkill = { skillName: normalizedName, proficiency: proficiency || 'intermediate' };

      const profile = await Profile.findOneAndUpdate(
        { userId: req.user.id },
        { $push: { skills: newSkill } },
        { new: true, upsert: true }
      );

      const added = profile.skills[profile.skills.length - 1];
      return res.status(201).json({
        success: true,
        message: 'Skill added',
        data:    formatSkill(added),
      });
    } catch (err) {
      console.error('addSkill error:', err);
      return res.status(500).json({ success: false, message: 'Server error.' });
    }
  },
];

const deleteSkill = async (req, res) => {
  try {
    const result = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { skills: { _id: req.params.id } } },
      { new: true }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Skill not found.' });
    return res.json({ success: true, message: 'Skill deleted' });
  } catch (err) {
    console.error('deleteSkill error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getProfile, updateProfile,
  addEducation, updateEducation, deleteEducation,
  addExperience, updateExperience, deleteExperience,
  addSkill, deleteSkill,
};
