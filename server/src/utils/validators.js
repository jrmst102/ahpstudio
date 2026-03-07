/**
 * Validation utilities for AHP Studio
 */

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);
  
  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
  
  return {
    isValid,
    errors: [
      password.length < minLength && `Password must be at least ${minLength} characters`,
      !hasUpperCase && 'Password must contain at least one uppercase letter',
      !hasLowerCase && 'Password must contain at least one lowercase letter',
      !hasDigit && 'Password must contain at least one digit',
      !hasSpecialChar && 'Password must contain at least one special character (@$!%*?&#)',
    ].filter(Boolean),
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
function validateUsername(username) {
  const minLength = 3;
  const maxLength = 30;
  const validChars = /^[a-zA-Z0-9_-]+$/;
  
  const isValid = username.length >= minLength && username.length <= maxLength && validChars.test(username);
  
  return {
    isValid,
    errors: [
      username.length < minLength && `Username must be at least ${minLength} characters`,
      username.length > maxLength && `Username must be no more than ${maxLength} characters`,
      !validChars.test(username) && 'Username can only contain letters, numbers, hyphens, and underscores',
    ].filter(Boolean),
  };
}

/**
 * Validate AHP problem constraints
 * @param {Object} problem - Problem data
 * @returns {Object} Validation result
 */
function validateProblem(problem) {
  const errors = [];
  
  // Check alternatives count
  if (problem.alternatives && problem.alternatives.length > 12) {
    errors.push('Maximum 12 alternatives allowed');
  }
  
  // Check criteria count
  if (problem.criteria && problem.criteria.length > 10) {
    errors.push('Maximum 10 first-level criteria allowed');
  }
  
  // Check sub-criteria counts
  if (problem.criteria) {
    problem.criteria.forEach((criterion, idx) => {
      if (criterion.subCriteria && criterion.subCriteria.length > 7) {
        errors.push(`Criterion ${idx + 1} exceeds maximum of 7 sub-criteria`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Saaty scale value
 * @param {number} value - Value to validate
 * @returns {boolean} True if valid
 */
function validateSaatyScale(value) {
  // Valid values: 1/9, 1/8, 1/7, ..., 1/2, 1, 2, 3, ..., 8, 9
  if (value === 1) return true;
  if (value >= 2 && value <= 9 && Number.isInteger(value)) return true;
  if (value > 0 && value < 1) {
    const reciprocal = 1 / value;
    return reciprocal >= 2 && reciprocal <= 9 && Number.isInteger(reciprocal);
  }
  return false;
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  return str.trim().replace(/[<>]/g, '');
}

module.exports = {
  validatePassword,
  validateEmail,
  validateUsername,
  validateProblem,
  validateSaatyScale,
  sanitizeString,
};
