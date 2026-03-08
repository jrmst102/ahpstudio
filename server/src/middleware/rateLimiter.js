const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login endpoint
 * 10 requests per minute per IP
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: {
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: {
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * PIN verification rate limiter
 * 5 attempts per 15 minutes per IP
 */
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: {
      message: 'Too many PIN attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  apiLimiter,
  pinLimiter,
};
