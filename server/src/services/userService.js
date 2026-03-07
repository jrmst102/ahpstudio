const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { getJSON, putJSON } = require('./storageService');

const USERS_KEY = 'data/users.json';

// ── Internal helpers ──────────────────────────────────────────────────

async function loadUsers() {
  const users = await getJSON(USERS_KEY);
  return users || [];
}

async function saveUsers(users) {
  await putJSON(USERS_KEY, users);
}

// ── Public API ────────────────────────────────────────────────────────

async function createUser(userData) {
  const { username, email, password, fullName, role } = userData;
  const users = await loadUsers();

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const user = {
    id: uuidv4(),
    username,
    email,
    passwordHash,
    fullName,
    role: role || 'STUDENT',
    failedAttempts: 0,
    isLocked: false,
    lockedAt: null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };

  users.push(user);
  await saveUsers(users);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function findUserByUsername(username) {
  const users = await loadUsers();
  return users.find(u => u.username === username) || null;
}

async function findUserById(userId) {
  const users = await loadUsers();
  return users.find(u => u.id === userId) || null;
}

async function updateUser(userId, updates) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveUsers(users);

  const { passwordHash: _, ...userWithoutPassword } = users[idx];
  return userWithoutPassword;
}

async function deleteUser(userId) {
  let users = await loadUsers();
  users = users.filter(u => u.id !== userId);
  await saveUsers(users);
}

async function listAllUsers() {
  const users = await loadUsers();
  return users
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ passwordHash, ...rest }) => rest);
}

async function incrementFailedAttempts(userId) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  const newCount = users[idx].failedAttempts + 1;
  users[idx].failedAttempts = newCount;
  if (newCount >= 3) {
    users[idx].isLocked = true;
    users[idx].lockedAt = new Date().toISOString();
  }
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);
  return newCount;
}

async function resetFailedAttempts(userId) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].failedAttempts = 0;
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);
}

async function unlockAccount(userId) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  users[idx].isLocked = false;
  users[idx].lockedAt = null;
  users[idx].failedAttempts = 0;
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);

  const { passwordHash: _, ...userWithoutPassword } = users[idx];
  return userWithoutPassword;
}

async function updateLastLogin(userId) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx].lastLoginAt = new Date().toISOString();
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);
}

async function changePassword(userId, newPassword) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');

  users[idx].passwordHash = await bcrypt.hash(newPassword, 12);
  users[idx].updatedAt = new Date().toISOString();
  await saveUsers(users);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  createUser, findUserByUsername, findUserById, updateUser, deleteUser,
  listAllUsers, incrementFailedAttempts, resetFailedAttempts, unlockAccount,
  updateLastLogin, changePassword, verifyPassword,
};
