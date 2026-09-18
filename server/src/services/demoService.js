const { randomUUID } = require('crypto');
const storage = require('./storageService');

const COOKIE_NAME = 'ahp_demo';

async function seedSample(user) {
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
  await storage.putJSON(fileKey, {
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
  const problems = await storage.getJSON(indexKey) || [];
  await storage.putJSON(indexKey, [problem, ...problems.filter(p => p.id !== id)]);
  const tokens = await storage.getJSON('data/participation-tokens.json') || {};
  // Remove previous sample invitations when restoring the example.
  for (const [token, mapping] of Object.entries(tokens)) {
    if (mapping.problemId === id) delete tokens[token];
  }
  tokens[participant.token] = { userId: user.id, problemId: id, participantId: participant.id };
  await storage.putJSON('data/participation-tokens.json', tokens);
  return problem;
}

async function getSession(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(token)) return null;
  return storage.getJSON(`sessions/${token}.json`);
}

async function authenticateDemo(req, res, next) {
  res.set('Cache-Control', 'private, no-store');
  try {
    let token = req.cookies?.[COOKIE_NAME];
    let user = await getSession(token);
    if (!user) {
      // Only bootstrap can replace a missing session. Otherwise a stale editor
      // would silently switch workspaces and show misleading problem 404s.
      if (req.path !== '/me') {
        return res.status(409).json({ error: {
          code: 'DEMO_SESSION_EXPIRED',
          message: 'The demo session has expired. Reopen the demo to continue.',
        } });
      }
      token = randomUUID();
      user = {
        id: randomUUID(), username: 'presenter', fullName: 'Demo Presenter',
        role: 'STUDENT', isDemo: true, sampleProblemId: randomUUID(),
      };
      await seedSample(user);
      await storage.putJSON(`sessions/${token}.json`, user);
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true, sameSite: 'lax', secure: req.secure,
      });
    }
    req.user = { ...user };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { COOKIE_NAME, getSession, authenticateDemo, seedSample };
