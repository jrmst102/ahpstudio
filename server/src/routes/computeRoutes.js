const express = require('express');
const computeController = require('../controllers/computeController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/priorities', computeController.computePriorities);
router.post('/consistency', computeController.computeConsistency);
router.post('/synthesize', computeController.synthesize);
router.post('/sensitivity', computeController.sensitivityAnalysis);
router.post('/aggregate', computeController.aggregateMatrices);

module.exports = router;
