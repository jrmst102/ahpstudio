const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token from cookie
 */
function authenticate(req, res, next) {
  try {
    const token = req.cookies.jwt;
    
    if (!token) {
      return res.status(401).json({
        error: { message: 'Authentication required' },
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token expired' },
      });
    }
    
    return res.status(401).json({
      error: { message: 'Invalid token' },
    });
  }
}

module.exports = authenticate;
