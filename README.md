# 📄 Resume Management System

> Full-stack Online Resume Management System — **DBMS Project**
> **Stack:** Node.js + Express · **MongoDB + Mongoose** · HTML/CSS/JS · JWT Auth

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | JWT-based login & registration |
| 👤 Profile | Personal info with embedded education, experience, skills |
| 💼 Jobs | Browse 12+ listings with search & experience filter |
| ⚡ Auto-Screening | Instant weighted score on every application |
| 📊 Dashboard | Stats using MongoDB Aggregation Pipeline |
| 📋 History | Full application history with screening breakdown |

---

## 🗺️ MongoDB Schema Design

```
Collection: users
  { email, password, createdAt }

Collection: profiles  (embedded subdocuments)
  {
    userId (ref→users),
    fullName, phone, street, city, state, pincode, dob,
    education:  [{ degree, institution, yearOfPassing, score, educationLevel }],
    experience: [{ jobTitle, company, startDate, endDate, isCurrent, responsibilities }],
    skills:     [{ skillName, proficiency }]
  }

Collection: jobs
  {
    title, description, company, location,
    minEducationLevel, minExperienceYears,
    requiredSkills: [{ name, isMandatory }],
    salaryMin, salaryMax, isActive, deadline
  }

Collection: applications  (embedded screening result)
  {
    userId (ref→users), jobId (ref→jobs),
    status,
    screening: {
      overallScore, skillMatchPct,
      skillsMatched[], skillsMissing[],
      educationMet, experienceMet, experienceYears
    }
  }
```

---

## 📁 Folder Structure

```
resume-management-system/
├── package.json
├── .env
├── database/
│   ├── seed.js                  ← npm run seed
│   └── queries_mongodb.js       ← Aggregation pipeline reference
├── backend/
│   ├── server.js
│   ├── config/
│   │   ├── db.js               ← Mongoose connection
│   │   └── auth.js             ← JWT helpers
│   ├── models/
│   │   ├── User.js             ← Mongoose schema
│   │   ├── Profile.js          ← Embedded edu/exp/skills
│   │   ├── Job.js              ← With requiredSkills array
│   │   └── Application.js      ← With embedded screening
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
│       └── screeningEngine.js  ← Pure JS scoring, Mongoose queries
└── frontend/                   ← HTML/CSS/JS (unchanged)
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) v6+ (running locally)
  - OR use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free cloud)
- npm

---

## 🚀 Setup Instructions

### Step 1 — Install dependencies

```bash
cd resume-management-system
npm install
```

### Step 2 — Configure Environment

The `.env` file is already created. Edit it if needed:

```env
MONGODB_URI=mongodb://localhost:27017/resume_db
JWT_SECRET=resumems_jwt_secret_2024_change_me
PORT=5000
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster.mongodb.net/resume_db`

### Step 3 — Make sure MongoDB is running

```bash
# Windows (if installed as service, it's already running)
# Or start manually:
mongod --dbpath C:\data\db
```

### Step 4 — Seed the database

```bash
npm run seed
```

Output:
```
✅  Connected to MongoDB
🗑   Cleared existing data
✅  Inserted 12 jobs
✅  Inserted 3 users with full profiles
🎉  Seeding complete!
```

### Step 5 — Start the server

```bash
npm run dev
```

Output:
```
✅  MongoDB connected: localhost → resume_db
🚀  Server running on http://localhost:5000
📁  Frontend: http://localhost:5000
🔗  API:      http://localhost:5000/api
```

### Step 6 — Open in Browser

Visit: **http://localhost:5000**

---

## 🧪 Demo Accounts

> Password for all: `password123`

| User | Email | Profile |
|------|-------|---------|
| Alice Johnson | alice@example.com | M.Tech + ~3 yrs exp + 8 skills → **Selected** on most jobs |
| Bob Smith | bob@example.com | B.Tech + ~4 yrs exp + 8 skills → **Selected** on dev jobs |
| Charlie Kumar | charlie@example.com | B.Sc + 6 months exp + 6 skills → **Under Review / Rejected** |

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/profile` | ✅ | Full profile |
| PUT | `/api/profile` | ✅ | Update personal info |
| POST | `/api/profile/education` | ✅ | Add education |
| PUT | `/api/profile/education/:id` | ✅ | Edit education |
| DELETE | `/api/profile/education/:id` | ✅ | Remove education |
| POST | `/api/profile/experience` | ✅ | Add experience |
| PUT | `/api/profile/experience/:id` | ✅ | Edit experience |
| DELETE | `/api/profile/experience/:id` | ✅ | Remove experience |
| POST | `/api/profile/skills` | ✅ | Add skill |
| DELETE | `/api/profile/skills/:id` | ✅ | Remove skill |
| GET | `/api/jobs` | ❌ | List all jobs |
| GET | `/api/jobs/:id` | ❌ | Job detail |
| POST | `/api/applications/apply/:jobId` | ✅ | Apply + auto-screen |
| GET | `/api/applications` | ✅ | My applications |
| GET | `/api/applications/dashboard` | ✅ | Dashboard stats |
| GET | `/api/applications/:id` | ✅ | Application detail |

---

## 🧮 Screening Algorithm

```
Skill Score      = (matched / required) × 100          [Weight: 50%]
Education Score  = candidate_level ≥ required ? 100 : partial  [Weight: 25%]
Experience Score = total_years ≥ required ? 100 : partial       [Weight: 25%]

Overall = (Skill × 0.5) + (Edu × 0.25) + (Exp × 0.25)

Status:
  ✅ Selected     → Overall ≥ 70 AND edu_met AND exp_met
  🔍 Under Review → Overall ≥ 50 AND (edu_met OR exp_met)
  ❌ Rejected     → otherwise
```

---

## 📜 License

MIT — built for educational/DBMS project purposes.
