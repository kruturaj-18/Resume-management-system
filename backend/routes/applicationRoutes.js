const router  = require('express').Router();
const ctrl    = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// All application routes require authentication
router.use(protect);

router.post('/apply/:jobId',  ctrl.applyForJob);
router.get('/dashboard',      ctrl.getDashboard);
router.get('/',               ctrl.getMyApplications);
router.get('/:id',            ctrl.getApplicationById);

module.exports = router;
