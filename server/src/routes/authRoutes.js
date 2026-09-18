const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { isDemoMode } = require('../config/demo');

const router = express.Router();

router.use((req, res, next) => {
  if (isDemoMode() && req.path !== '/me') {
    return res.status(403).json({ error: { message: 'Accounts are disabled in presentation mode' } });
  }
  next();
});

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
