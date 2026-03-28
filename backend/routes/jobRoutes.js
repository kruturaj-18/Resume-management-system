const router = require('express').Router();
const ctrl   = require('../controllers/jobController');

// Jobs are publicly viewable (no auth required)
router.get('/',    ctrl.getJobs);
router.get('/:id', ctrl.getJobById);

module.exports = router;
