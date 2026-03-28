const mongoose = require('mongoose');

// ── Subdocument schemas ───────────────────────────────
const educationSchema = new mongoose.Schema({
  degree:         { type: String, required: true },
  institution:    { type: String, required: true },
  yearOfPassing:  { type: Number },
  score:          { type: Number },
  scoreType:      { type: String, enum: ['percentage', 'cgpa'], default: 'percentage' },
  educationLevel: {
    type: Number, min: 1, max: 5, required: true, default: 3,
    // 1=High School, 2=Diploma, 3=Bachelor, 4=Master, 5=PhD
  },
}, { _id: true }); // keeps generated _id for subdoc lookup

const experienceSchema = new mongoose.Schema({
  jobTitle:        { type: String, required: true },
  company:         { type: String, required: true },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, default: null },
  isCurrent:       { type: Boolean, default: false },
  responsibilities:{ type: String, default: null },
}, { _id: true });

const skillSchema = new mongoose.Schema({
  skillName:  { type: String, required: true },
  proficiency:{
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate',
  },
}, { _id: true });

// ── Main Profile schema ───────────────────────────────
const profileSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName:  { type: String, required: true, trim: true },
    phone:     { type: String, default: null },
    street:    { type: String, default: null },
    city:      { type: String, default: null },
    state:     { type: String, default: null },
    pincode:   { type: String, default: null },
    dob:       { type: Date,   default: null },
    education: [educationSchema],
    experience:[experienceSchema],
    skills:    [skillSchema],
  },
  { timestamps: true }
);

// Prevent duplicate skill names for the same user
profileSchema.index({ userId: 1, 'skills.skillName': 1 });

module.exports = mongoose.model('Profile', profileSchema);
