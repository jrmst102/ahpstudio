const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user (without password hash)
 */
async function createUser(userData) {
  const { username, email, password, fullName, role } = userData;
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      fullName,
      role: role || 'STUDENT',
    },
  });
  
  // Remove password hash from response
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByUsername(username) {
  return await prisma.user.findUnique({
    where: { username },
  });
}

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(userId, updates) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });
  
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Delete user and all associated data
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteUser(userId) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * List all users (admin only)
 * @returns {Promise<Array>} Array of users
 */
async function listAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  return users.map(user => {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

/**
 * Increment failed login attempts
 * @param {string} userId - User ID
 * @returns {Promise<number>} New failed attempts count
 */
async function incrementFailedAttempts(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  const newCount = user.failedAttempts + 1;
  
  // Lock account after 3 failed attempts
  if (newCount >= 3) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: newCount,
        isLocked: true,
        lockedAt: new Date(),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: newCount },
    });
  }
  
  return newCount;
}

/**
 * Reset failed login attempts
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function resetFailedAttempts(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedAttempts: 0 },
  });
}

/**
 * Unlock user account
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function unlockAccount(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isLocked: false,
      lockedAt: null,
      failedAttempts: 0,
    },
  });
  
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Update last login timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
async function updateLastLogin(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
async function changePassword(userId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

/**
 * Verify password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserById,
  updateUser,
  deleteUser,
  listAllUsers,
  incrementFailedAttempts,
  resetFailedAttempts,
  unlockAccount,
  updateLastLogin,
  changePassword,
  verifyPassword,
};
