const mongoose = require('mongoose');

const requiredSkillSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  isMandatory: { type: Boolean, default: true },
}, { _id: false });

const jobSchema = new mongoose.Schema(
  {
    title:               { type: String, required: true, trim: true },
    description:         { type: String, required: true },
    company:             { type: String, required: true, trim: true },
    location:            { type: String, default: null },
    minEducationLevel:   {
      type: Number, min: 1, max: 5, default: 3,
      // 1=High School, 2=Diploma, 3=Bachelor, 4=Master, 5=PhD
    },
    minExperienceYears:  { type: Number, default: 0, min: 0 },
    requiredSkills:      [requiredSkillSchema],
    salaryMin:           { type: Number, default: null },
    salaryMax:           { type: Number, default: null },
    isActive:            { type: Boolean, default: true },
    deadline:            { type: Date, default: null },
  },
  { timestamps: true }
);

// Text index for search
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ isActive: 1, minExperienceYears: 1 });

// Helper: human-readable education level
jobSchema.statics.educationLabel = function (level) {
  const labels = { 1:'High School', 2:'Diploma', 3:"Bachelor's Degree", 4:"Master's Degree", 5:'PhD' };
  return labels[level] || `Level ${level}`;
};

module.exports = mongoose.model('Job', jobSchema);
