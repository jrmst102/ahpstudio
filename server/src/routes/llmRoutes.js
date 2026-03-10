const express = require('express');
const llmController = require('../controllers/llmController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All LLM routes require authentication
router.use(authenticate);

// LLM status
router.get('/status', llmController.getLlmStatus);

module.exports = router;
