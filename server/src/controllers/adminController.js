const userService = require('../services/userService');

/**
 * List all users (admin only)
 */
async function listUsers(req, res) {
  try {
    const users = await userService.listAllUsers();
    res.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      error: { message: 'Failed to retrieve users' },
    });
  }
}

/**
 * Create a new user (admin only)
 */
async function createUser(req, res) {
  try {
    const { username, email, password, fullName, role } = req.body;
    
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        error: { message: 'All fields are required' },
      });
    }
    
    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: { message: 'Password must be at least 8 characters with uppercase, lowercase, digit, and special character' },
      });
    }
    
    // Check if username already exists
    const existing = await userService.findUserByUsername(username);
    if (existing) {
      return res.status(409).json({
        error: { message: 'Username already exists' },
      });
    }
    
    const user = await userService.createUser({
      username,
      email,
      password,
      fullName,
      role: role || 'STUDENT',
    });
    
    res.status(201).json({ user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: { message: 'Failed to create user' },
    });
  }
}

/**
 * Update a user (admin only)
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, email, fullName, role } = req.body;
    
    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }
    
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (fullName) updates.fullName = fullName;
    if (role) updates.role = role;
    
    const updated = await userService.updateUser(id, updates);
    
    res.json({ user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: { message: 'Failed to update user' },
    });
  }
}

/**
 * Delete a user (admin only)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }
    
    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({
        error: { message: 'Cannot delete your own account' },
      });
    }
    
    await userService.deleteUser(id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: { message: 'Failed to delete user' },
    });
  }
}

/**
 * Unlock a user account (admin only)
 */
async function unlockUser(req, res) {
  try {
    const { id } = req.params;
    
    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }
    
    const updated = await userService.unlockAccount(id);
    
    res.json({
      message: 'Account unlocked successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({
      error: { message: 'Failed to unlock account' },
    });
  }
}

/**
 * Reset user password (admin only)
 */
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({
        error: { message: 'New password is required' },
      });
    }
    
    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error: { message: 'Password must be at least 8 characters with uppercase, lowercase, digit, and special character' },
      });
    }
    
    const user = await userService.findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }
    
    await userService.changePassword(id, newPassword);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: { message: 'Failed to reset password' },
    });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
  resetPassword,
};
