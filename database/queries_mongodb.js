/**
 * MongoDB Query Reference
 * Equivalent showcase of the SQL queries, now in MongoDB aggregation pipeline syntax.
 * This file is for reference/study — not executed directly.
 */

// ── 1. Skill Match Percentage ─────────────────────────────────────────
/*
db.profiles.aggregate([
  { $match: { userId: ObjectId("<userId>") } },
  { $project: { skills: { $map: { input: "$skills", as: "s", in: { $toLower: "$$s.skillName" } } } } },
  {
    $lookup: {
      from: "jobs",
      pipeline: [
        { $match: { _id: ObjectId("<jobId>") } },
        { $project: { requiredSkills: { $map: { input: "$requiredSkills", as: "rs", in: { $toLower: "$$rs.name" } } } } }
      ],
      as: "job"
    }
  },
  { $unwind: "$job" },
  {
    $project: {
      matchedCount: { $size: { $setIntersection: ["$skills", "$job.requiredSkills"] } },
      totalRequired: { $size: "$job.requiredSkills" },
      matchPct: {
        $multiply: [
          { $divide: [{ $size: { $setIntersection: ["$skills", "$job.requiredSkills"] } }, { $size: "$job.requiredSkills" }] },
          100
        ]
      }
    }
  }
])
*/

// ── 2. Dashboard Stats per User ───────────────────────────────────────
/*
db.applications.aggregate([
  { $match: { userId: ObjectId("<userId>") } },
  {
    $group: {
      _id: null,
      total:       { $sum: 1 },
      selected:    { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
      rejected:    { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
      underReview: { $sum: { $cond: [{ $eq: ["$status", "Under Review"] }, 1, 0] } },
      avgScore:    { $avg: "$screening.overallScore" }
    }
  }
])
*/

// ── 3. All Applications with Job details ──────────────────────────────
/*
db.applications.aggregate([
  { $match: { userId: ObjectId("<userId>") } },
  {
    $lookup: {
      from: "jobs",
      localField: "jobId",
      foreignField: "_id",
      as: "job"
    }
  },
  { $unwind: "$job" },
  {
    $project: {
      status: 1,
      createdAt: 1,
      "job.title": 1,
      "job.company": 1,
      "job.location": 1,
      "screening.overallScore": 1,
      "screening.skillMatchPct": 1,
      "screening.educationMet": 1,
      "screening.experienceMet": 1,
      "screening.skillsMatched": 1,
      "screening.skillsMissing": 1,
    }
  },
  { $sort: { createdAt: -1 } }
])
*/

// ── 4. Top Candidates for a Job ───────────────────────────────────────
/*
db.applications.aggregate([
  { $match: { jobId: ObjectId("<jobId>") } },
  {
    $lookup: {
      from: "profiles",
      localField: "userId",
      foreignField: "userId",
      as: "profile"
    }
  },
  { $unwind: { path: "$profile", preserveNullAndEmpty: true } },
  {
    $project: {
      fullName: "$profile.fullName",
      status: 1,
      overallScore: "$screening.overallScore",
      skillMatchPct: "$screening.skillMatchPct",
      educationMet: "$screening.educationMet",
      experienceMet: "$screening.experienceMet",
    }
  },
  { $sort: { "screening.overallScore": -1 } }
])
*/

// ── 5. Score Distribution ─────────────────────────────────────────────
/*
db.applications.aggregate([
  { $match: { jobId: ObjectId("<jobId>") } },
  {
    $bucket: {
      groupBy: "$screening.overallScore",
      boundaries: [0, 50, 70, 90, 101],
      default: "Unknown",
      output: { count: { $sum: 1 } }
    }
  }
])
*/

// ── 6. Average Highest Education Level of Applicants for a Job ────────
/*
db.applications.aggregate([
  { $match: { jobId: ObjectId("<jobId>") } },
  {
    $lookup: {
      from: "profiles",
      localField: "userId",
      foreignField: "userId",
      as: "profile"
    }
  },
  { $unwind: "$profile" },
  { $unwind: "$profile.education" },
  {
    $group: {
      _id: "$userId",
      highestEdu: { $max: "$profile.education.educationLevel" }
    }
  },
  { $group: { _id: null, avgEdu: { $avg: "$highestEdu" } } }
])
*/

module.exports = {}; // placeholder export
