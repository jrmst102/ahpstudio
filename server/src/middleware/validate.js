const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }
  
  next();
}

module.exports = validate;
