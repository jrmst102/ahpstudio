const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        error: { message: 'Username and password are required' },
      });
    }
    
    // Find user
    const user = await userService.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        error: { message: 'Your account has been locked due to multiple failed login attempts. Please contact your administrator.' },
      });
    }
    
    // Verify password
    const isValid = await userService.verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      // Increment failed attempts
      await userService.incrementFailedAttempts(user.id);
      
      return res.status(401).json({
        error: { message: 'Invalid credentials' },
      });
    }
    
    // Reset failed attempts and update last login
    await userService.resetFailedAttempts(user.id);
    await userService.updateLastLogin(user.id);
    
    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    
    // Set httpOnly cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Login failed' },
    });
  }
}

/**
 * Logout user
 */
function logout(req, res) {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
}

/**
 * Get current authenticated user info
 */
async function getCurrentUser(req, res) {
  try {
    const user = await userService.findUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve user information' },
    });
  }
}

/**
 * Change password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: { message: 'Current password and new password are required' },
      });
    }
    
    // Validate new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: { message: 'Password must be at least 8 characters with uppercase, lowercase, digit, and special character' },
      });
    }
    
    // Verify current password
    const user = await userService.findUserById(req.user.id);
    const isValid = await userService.verifyPassword(currentPassword, user.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({
        error: { message: 'Current password is incorrect' },
      });
    }
    
    // Update password
    await userService.changePassword(req.user.id, newPassword);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: { message: 'Failed to change password' },
    });
  }
}

/**
 * SSO login from Decision Labs
 */
async function ssoLogin(req, res) {
  const crypto = require('crypto');
  const { token } = req.query;

  if (!token) {
    return res.redirect('/login');
  }

  const publicKeyStr = process.env.DECISIONLAB_SSO_PUBLIC_KEY;
  if (!publicKeyStr) {
    console.error('SSO: DECISIONLAB_SSO_PUBLIC_KEY not configured');
    return res.redirect('/login');
  }

  // Convert OpenSSH public key to a KeyObject for RS256 verification
  let publicKey;
  try {
    publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKeyStr),
      format: 'openssh',
    });
  } catch (err) {
    console.error('SSO: Failed to parse public key:', err.message);
    return res.redirect('/login');
  }

  // Verify the RS256 JWT
  let payload;
  try {
    payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('SSO: token expired');
    } else {
      console.warn('SSO: invalid token:', err.message);
    }
    return res.redirect('/login');
  }

  const { email, role, firstName, lastName } = payload;
  if (!email) {
    return res.redirect('/login');
  }

  try {
    // Find existing user by email
    let user = await userService.findUserByEmail(email);

    if (!user) {
      // Provision a new SSO user
      const { v4: uuidv4 } = require('uuid');
      const username = email.split('@')[0];
      const ahpRole = (role === 'ADMIN' || role === 'PROFESSOR') ? 'admin' : 'user';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || username;

      user = await userService.createUser({
        username,
        email,
        password: uuidv4(), // random; SSO users don't use passwords
        fullName,
        role: ahpRole,
      });
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Create session JWT (same as normal login)
    const sessionToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    res.cookie('jwt', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect('/');
  } catch (err) {
    console.error('SSO: user provisioning failed:', err);
    return res.redirect('/login');
  }
}

module.exports = {
  login,
  logout,
  getCurrentUser,
  changePassword,
  ssoLogin,
};
