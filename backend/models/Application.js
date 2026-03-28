const mongoose = require('mongoose');

// Screening result embedded in application (1:1)
const screeningSchema = new mongoose.Schema({
  overallScore:   { type: Number, default: 0 },
  skillMatchPct:  { type: Number, default: 0 },
  skillsMatched:  [String],
  skillsMissing:  [String],
  educationMet:   { type: Boolean, default: false },
  experienceMet:  { type: Boolean, default: false },
  experienceYears:{ type: Number, default: 0 },
  screenedAt:     { type: Date, default: Date.now },
}, { _id: false });

const applicationSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    jobId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Job',     required: true },
    status:    {
      type: String,
      enum: ['Selected', 'Rejected', 'Under Review', 'Pending'],
      default: 'Pending',
    },
    screening: { type: screeningSchema, default: null },
  },
  { timestamps: true }
);

// One application per user per job
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
