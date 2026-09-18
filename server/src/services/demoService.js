const { randomUUID } = require('crypto');
const storage = require('./demoStorage');

const sessions = new Map();
const COOKIE_NAME = 'ahp_demo';

function seedSample(user) {
  const now = new Date().toISOString();
  const id = user.sampleProblemId;
  const fileKey = `users/${user.id}/problems/${id}.AHP`;
  const problem = {
    id,
    userId: user.id,
    title: 'Sample: Choosing a Laptop',
    description: 'Choose a laptop for a student who balances affordability, performance, and portability. Compare a Budget Laptop, a Performance Laptop, and a Lightweight Laptop. Lower cost, faster performance, and easier portability are preferred. These illustrative judgments are ready to explore and change.',
    fileKey,
    createdAt: now,
    updatedAt: now,
  };
  const criteriaMatrix = [[1, 2, 4], [1 / 2, 1, 2], [1 / 4, 1 / 2, 1]];
  const altMatrices = {
    Cost: [[1, 4, 2], [1 / 4, 1, 1 / 2], [1 / 2, 2, 1]],
    Performance: [[1, 1 / 4, 1 / 2], [4, 1, 2], [2, 1 / 2, 1]],
    Portability: [[1, 2, 1 / 2], [1 / 2, 1, 1 / 4], [2, 4, 1]],
  };
  const participant = {
    id: randomUUID(), name: user.fullName, email: null,
    token: randomUUID(), pinHash: null, weight: 1,
    anonymousLabel: 'Participant A',
    roundData: {
      '1': {
        status: 'completed', completedAt: now,
        comparisons: { criteriaMatrix, altMatrices },
      },
    },
  };
  storage.putJSON(fileKey, {
    problem: { title: problem.title, description: problem.description },
    criteria: ['Cost', 'Performance', 'Portability'],
    alternatives: ['Budget Laptop', 'Performance Laptop', 'Lightweight Laptop'],
    criteriaMatrix, altMatrices,
    subCriteria: {}, subCriteriaMatrices: {}, subCriteriaAltMatrices: {},
    participants: [participant],
    config: { anonymousMode: false, pinProtection: false, delphiEnabled: false },
    currentRound: 1, roundStatus: 'open',
  });
  const indexKey = `users/${user.id}/problems/index.json`;
  const problems = storage.getJSON(indexKey) || [];
  storage.putJSON(indexKey, [problem, ...problems.filter(p => p.id !== id)]);
  const tokens = storage.getJSON('data/participation-tokens.json') || {};
  // Remove previous sample invitations when restoring the example.
  for (const [token, mapping] of Object.entries(tokens)) {
    if (mapping.problemId === id) delete tokens[token];
  }
  tokens[participant.token] = { userId: user.id, problemId: id, participantId: participant.id };
  storage.putJSON('data/participation-tokens.json', tokens);
  return problem;
}

function getSession(token) {
  return sessions.get(token);
}

function authenticateDemo(req, res, next) {
  let token = req.cookies?.[COOKIE_NAME];
  let user = getSession(token);
  if (!user) {
    token = randomUUID();
    user = {
      id: randomUUID(), username: 'presenter', fullName: 'Demo Presenter',
      role: 'STUDENT', isDemo: true, sampleProblemId: randomUUID(),
    };
    seedSample(user);
    sessions.set(token, user);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true, sameSite: 'lax', secure: req.secure,
    });
  }
  req.user = { ...user };
  next();
}

module.exports = { COOKIE_NAME, getSession, authenticateDemo, seedSample };
