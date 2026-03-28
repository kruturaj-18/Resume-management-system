const router  = require('express').Router();
const ctrl    = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

// All profile routes require authentication
router.use(protect);

// Personal profile
router.get('/',    ctrl.getProfile);
router.put('/',    ctrl.updateProfile);

// Education
router.post('/education',       ctrl.addEducation);
router.put('/education/:id',    ctrl.updateEducation);
router.delete('/education/:id', ctrl.deleteEducation);

// Experience
router.post('/experience',       ctrl.addExperience);
router.put('/experience/:id',    ctrl.updateExperience);
router.delete('/experience/:id', ctrl.deleteExperience);

// Skills
router.post('/skills',       ctrl.addSkill);
router.delete('/skills/:id', ctrl.deleteSkill);

module.exports = router;
