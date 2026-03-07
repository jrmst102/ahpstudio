/**
 * Middleware to check if user has required role(s)
 * @param  {...string} allowedRoles - Allowed roles
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: 'Insufficient permissions' },
      });
    }
    
    next();
  };
}

module.exports = authorize;
