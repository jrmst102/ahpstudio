const express = require('express');
const participationController = require('../controllers/participationController');
const { apiLimiter, pinLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All participation routes are UNAUTHENTICATED — the token is the credential.
router.use(apiLimiter);

// Verify PIN (more aggressive rate limiting)
router.post('/:problemId/:token/verify-pin', pinLimiter, participationController.verifyPin);

// Get problem structure and participant's data
router.get('/:problemId/:token', participationController.getParticipation);

// Save or submit comparisons
router.put('/:problemId/:token', participationController.saveParticipation);

module.exports = router;
