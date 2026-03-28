const { body }       = require('express-validator');
const User           = require('../models/User');
const Profile        = require('../models/Profile');
const { signToken }  = require('../config/auth');
const { validate }   = require('../middleware/validationMiddleware');

// ── Validation rules ──────────────────────────────────
const registerRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().trim().withMessage('Full name is required'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// ── POST /api/auth/register ───────────────────────────
const register = [
  ...registerRules,
  validate,
  async (req, res) => {
    try {
      const { email, password, full_name } = req.body;

      // Check for duplicate email
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }

      // Create user (password hashed in pre-save hook)
      const user = await User.create({ email, password });

      // Auto-create profile with full_name
      await Profile.create({ userId: user._id, fullName: full_name });

      const token = signToken({ id: user._id, email: user.email });
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        token,
        user: { id: user._id, email: user.email, full_name },
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  },
];

// ── POST /api/auth/login ──────────────────────────────
const login = [
  ...loginRules,
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Select password field explicitly (excluded by toJSON)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const profile = await Profile.findOne({ userId: user._id });
      const token   = signToken({ id: user._id, email: user.email });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id:        user._id,
          email:     user.email,
          full_name: profile?.fullName || '',
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  },
];

// ── GET /api/auth/me ──────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user    = await User.findById(req.user.id);
    const profile = await Profile.findOne({ userId: req.user.id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({
      success: true,
      data: {
        id:        user._id,
        email:     user.email,
        full_name: profile?.fullName,
        phone:     profile?.phone,
        city:      profile?.city,
        state:     profile?.state,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
