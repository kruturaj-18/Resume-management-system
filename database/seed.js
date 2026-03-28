/**
 * MongoDB Seed Script
 * Run: npm run seed
 * Seeds the database with 12 sample jobs and 3 test users with full profiles.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// Models
const User        = require('../backend/models/User');
const Profile     = require('../backend/models/Profile');
const Job         = require('../backend/models/Job');
const Application = require('../backend/models/Application');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_db');
    console.log('✅  Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
    ]);
    console.log('🗑   Cleared existing data');

    // ── Jobs ─────────────────────────────────────────────
    const jobs = await Job.insertMany([
      {
        title: 'Full Stack Developer', company: 'TechCorp Solutions',
        location: 'Pune, Maharashtra',
        description: 'Build and maintain web applications using React and Node.js. Collaborate with cross-functional teams to deliver high-quality software.',
        minEducationLevel: 3, minExperienceYears: 2,
        salaryMin: 600000, salaryMax: 1200000,
        requiredSkills: [
          { name: 'JavaScript', isMandatory: true  },
          { name: 'React',      isMandatory: true  },
          { name: 'Node.js',    isMandatory: true  },
          { name: 'MySQL',      isMandatory: true  },
          { name: 'HTML',       isMandatory: false },
          { name: 'CSS',        isMandatory: false },
          { name: 'REST API',   isMandatory: true  },
        ],
      },
      {
        title: 'Data Scientist', company: 'Analytics Hub',
        location: 'Bangalore, Karnataka',
        description: 'Analyze large datasets, build ML models, and present actionable insights to stakeholders.',
        minEducationLevel: 4, minExperienceYears: 3,
        salaryMin: 800000, salaryMax: 1800000,
        requiredSkills: [
          { name: 'Python',           isMandatory: true  },
          { name: 'Machine Learning', isMandatory: true  },
          { name: 'SQL',              isMandatory: true  },
          { name: 'Data Analysis',    isMandatory: true  },
          { name: 'TensorFlow',       isMandatory: false },
          { name: 'Pandas',           isMandatory: true  },
          { name: 'Statistics',       isMandatory: false },
        ],
      },
      {
        title: 'Backend Engineer', company: 'CloudBase Inc',
        location: 'Mumbai, Maharashtra',
        description: 'Design and implement scalable RESTful APIs and microservices architecture.',
        minEducationLevel: 3, minExperienceYears: 1,
        salaryMin: 500000, salaryMax: 1000000,
        requiredSkills: [
          { name: 'Node.js',  isMandatory: true  },
          { name: 'REST API', isMandatory: true  },
          { name: 'MySQL',    isMandatory: true  },
          { name: 'JavaScript', isMandatory: true },
          { name: 'Docker',   isMandatory: false },
          { name: 'Redis',    isMandatory: false },
        ],
      },
      {
        title: 'UI/UX Designer', company: 'Creative Agency',
        location: 'Hyderabad, Telangana',
        description: 'Create wireframes, prototypes, and final UI designs for web and mobile products.',
        minEducationLevel: 3, minExperienceYears: 1.5,
        salaryMin: 400000, salaryMax: 900000,
        requiredSkills: [
          { name: 'Figma',         isMandatory: true  },
          { name: 'UI Design',     isMandatory: true  },
          { name: 'CSS',           isMandatory: true  },
          { name: 'Prototyping',   isMandatory: false },
          { name: 'User Research', isMandatory: false },
        ],
      },
      {
        title: 'DevOps Engineer', company: 'InfraCloud',
        location: 'Remote',
        description: 'Manage CI/CD pipelines, containerize applications, and monitor cloud infrastructure.',
        minEducationLevel: 3, minExperienceYears: 2,
        salaryMin: 700000, salaryMax: 1400000,
        requiredSkills: [
          { name: 'Docker',     isMandatory: true  },
          { name: 'Kubernetes', isMandatory: true  },
          { name: 'AWS',        isMandatory: true  },
          { name: 'CI/CD',      isMandatory: true  },
          { name: 'Linux',      isMandatory: true  },
          { name: 'Python',     isMandatory: false },
        ],
      },
      {
        title: 'Machine Learning Engineer', company: 'AI Ventures',
        location: 'Bangalore, Karnataka',
        description: 'Develop and deploy ML/DL models for production AI systems.',
        minEducationLevel: 4, minExperienceYears: 2,
        salaryMin: 900000, salaryMax: 2000000,
        requiredSkills: [
          { name: 'Python',           isMandatory: true  },
          { name: 'TensorFlow',       isMandatory: true  },
          { name: 'Machine Learning', isMandatory: true  },
          { name: 'Deep Learning',    isMandatory: true  },
          { name: 'PyTorch',          isMandatory: false },
          { name: 'SQL',              isMandatory: false },
        ],
      },
      {
        title: 'Android Developer', company: 'MobileFirst Tech',
        location: 'Noida, Uttar Pradesh',
        description: 'Design and build advanced Android applications for the consumer market.',
        minEducationLevel: 3, minExperienceYears: 1,
        salaryMin: 450000, salaryMax: 1000000,
        requiredSkills: [
          { name: 'Kotlin',      isMandatory: true  },
          { name: 'Java',        isMandatory: true  },
          { name: 'Android SDK', isMandatory: true  },
          { name: 'REST API',    isMandatory: false },
          { name: 'Firebase',    isMandatory: false },
        ],
      },
      {
        title: 'Database Administrator', company: 'DataSafe Corp',
        location: 'Chennai, Tamil Nadu',
        description: 'Manage, optimize, and secure MongoDB and PostgreSQL databases.',
        minEducationLevel: 3, minExperienceYears: 3,
        salaryMin: 500000, salaryMax: 1100000,
        requiredSkills: [
          { name: 'MongoDB',              isMandatory: true  },
          { name: 'PostgreSQL',           isMandatory: true  },
          { name: 'SQL',                  isMandatory: true  },
          { name: 'Database Optimization',isMandatory: true  },
          { name: 'Linux',                isMandatory: false },
        ],
      },
      {
        title: 'Cybersecurity Analyst', company: 'SecureNet',
        location: 'Delhi, NCR',
        description: 'Monitor security systems, respond to incidents, and conduct vulnerability assessments.',
        minEducationLevel: 3, minExperienceYears: 2,
        salaryMin: 600000, salaryMax: 1300000,
        requiredSkills: [
          { name: 'Network Security',   isMandatory: true  },
          { name: 'Linux',              isMandatory: true  },
          { name: 'Python',             isMandatory: false },
          { name: 'Penetration Testing',isMandatory: false },
        ],
      },
      {
        title: 'Cloud Architect', company: 'SkyOps Ltd',
        location: 'Remote',
        description: 'Design cloud infrastructure solutions on AWS/Azure, ensure scalability and security.',
        minEducationLevel: 4, minExperienceYears: 5,
        salaryMin: 1200000, salaryMax: 2500000,
        requiredSkills: [
          { name: 'AWS',        isMandatory: true  },
          { name: 'Azure',      isMandatory: true  },
          { name: 'Kubernetes', isMandatory: true  },
          { name: 'Docker',     isMandatory: true  },
          { name: 'Terraform',  isMandatory: false },
          { name: 'CI/CD',      isMandatory: false },
        ],
      },
      {
        title: 'Frontend Developer', company: 'WebWave Agency',
        location: 'Pune, Maharashtra',
        description: 'Build responsive, pixel-perfect UIs using React and Vue.js.',
        minEducationLevel: 3, minExperienceYears: 1,
        salaryMin: 400000, salaryMax: 800000,
        requiredSkills: [
          { name: 'JavaScript', isMandatory: true  },
          { name: 'React',      isMandatory: true  },
          { name: 'HTML',       isMandatory: true  },
          { name: 'CSS',        isMandatory: true  },
          { name: 'Vue.js',     isMandatory: false },
        ],
      },
      {
        title: 'Product Manager', company: 'InnoProduct Co',
        location: 'Mumbai, Maharashtra',
        description: 'Define product roadmap, work with engineering and design to ship features.',
        minEducationLevel: 3, minExperienceYears: 3,
        salaryMin: 1000000, salaryMax: 2000000,
        requiredSkills: [
          { name: 'Product Management', isMandatory: true  },
          { name: 'Agile',              isMandatory: true  },
          { name: 'User Research',      isMandatory: false },
          { name: 'Data Analysis',      isMandatory: false },
        ],
      },
    ]);
    console.log(`✅  Inserted ${jobs.length} jobs`);

    // ── Users + Profiles ──────────────────────────────────
    const password = 'password123'; // Pass raw to let pre-save hook do the hashing

    const alice = await User.create({ email: 'alice@example.com', password });
    await Profile.create({
      userId:   alice._id,
      fullName: 'Alice Johnson',
      phone:    '9876543210',
      street:   '12 MG Road',
      city:     'Pune',
      state:    'Maharashtra',
      pincode:  '411001',
      dob:      new Date('1999-05-15'),
      education: [
        { degree: 'B.Tech Computer Science', institution: 'COEP Pune',    yearOfPassing: 2021, score: 8.5,  scoreType: 'cgpa',       educationLevel: 3 },
        { degree: 'M.Tech Data Science',     institution: 'IIT Bombay',   yearOfPassing: 2023, score: 9.1,  scoreType: 'cgpa',       educationLevel: 4 },
      ],
      experience: [
        { jobTitle: 'Software Engineer Intern', company: 'Infosys',       startDate: new Date('2022-06-01'), endDate: new Date('2022-12-01'), isCurrent: false, responsibilities: 'Built REST APIs using Node.js and Express. Wrote unit tests.' },
        { jobTitle: 'Junior Data Analyst',      company: 'TCS Analytics',  startDate: new Date('2023-02-01'), endDate: null,                   isCurrent: true,  responsibilities: 'Analyze business data using Python and SQL. Create dashboards.' },
      ],
      skills: [
        { skillName: 'Python',           proficiency: 'advanced'     },
        { skillName: 'Machine Learning', proficiency: 'intermediate' },
        { skillName: 'SQL',              proficiency: 'advanced'     },
        { skillName: 'Data Analysis',    proficiency: 'advanced'     },
        { skillName: 'TensorFlow',       proficiency: 'intermediate' },
        { skillName: 'Pandas',           proficiency: 'advanced'     },
        { skillName: 'Statistics',       proficiency: 'intermediate' },
        { skillName: 'JavaScript',       proficiency: 'beginner'     },
      ],
    });

    const bob = await User.create({ email: 'bob@example.com', password });
    await Profile.create({
      userId:   bob._id,
      fullName: 'Bob Smith',
      phone:    '9123456789',
      street:   '45 Anna Nagar',
      city:     'Chennai',
      state:    'Tamil Nadu',
      pincode:  '600040',
      dob:      new Date('1997-08-22'),
      education: [
        { degree: 'B.Tech Information Technology', institution: 'VIT Chennai', yearOfPassing: 2020, score: 78.5, scoreType: 'percentage', educationLevel: 3 },
      ],
      experience: [
        { jobTitle: 'Backend Developer', company: 'Wipro', startDate: new Date('2020-07-01'), endDate: null, isCurrent: true, responsibilities: 'Develop and maintain microservices in Node.js. Database design in MySQL.' },
      ],
      skills: [
        { skillName: 'Node.js',    proficiency: 'advanced'     },
        { skillName: 'JavaScript', proficiency: 'advanced'     },
        { skillName: 'MySQL',      proficiency: 'advanced'     },
        { skillName: 'REST API',   proficiency: 'advanced'     },
        { skillName: 'Docker',     proficiency: 'intermediate' },
        { skillName: 'React',      proficiency: 'intermediate' },
        { skillName: 'HTML',       proficiency: 'intermediate' },
        { skillName: 'CSS',        proficiency: 'intermediate' },
      ],
    });

    const charlie = await User.create({ email: 'charlie@example.com', password });
    await Profile.create({
      userId:   charlie._id,
      fullName: 'Charlie Kumar',
      phone:    '9988776655',
      street:   '78 Koramangala',
      city:     'Bangalore',
      state:    'Karnataka',
      pincode:  '560034',
      dob:      new Date('2000-01-10'),
      education: [
        { degree: 'B.Sc Computer Science', institution: 'Bangalore University', yearOfPassing: 2022, score: 82.0, scoreType: 'percentage', educationLevel: 3 },
      ],
      experience: [
        { jobTitle: 'Trainee Developer', company: 'StartupXYZ', startDate: new Date('2023-01-01'), endDate: new Date('2023-06-30'), isCurrent: false, responsibilities: 'Frontend development using React and CSS.' },
      ],
      skills: [
        { skillName: 'JavaScript', proficiency: 'intermediate' },
        { skillName: 'React',      proficiency: 'intermediate' },
        { skillName: 'HTML',       proficiency: 'advanced'     },
        { skillName: 'CSS',        proficiency: 'advanced'     },
        { skillName: 'Figma',      proficiency: 'beginner'     },
        { skillName: 'Node.js',    proficiency: 'beginner'     },
      ],
    });

    console.log('✅  Inserted 3 users with full profiles');
    console.log('\n🎉  Seeding complete!');
    console.log('──────────────────────────────────────');
    console.log('Demo accounts (password: password123)');
    console.log('  alice@example.com   – M.Tech + 3 yrs');
    console.log('  bob@example.com     – B.Tech + 4 yrs');
    console.log('  charlie@example.com – B.Sc + fresher');
    console.log('──────────────────────────────────────');
  } catch (err) {
    console.error('❌  Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  MongoDB disconnected');
    process.exit(0);
  }
}

seed();
