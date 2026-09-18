const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getSession } = require('../src/services/demoService');
const storage = require('../src/services/storageService');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/auth', require('../src/routes/authRoutes'));
app.use('/problems', require('../src/routes/problemRoutes'));
app.use('/compute', require('../src/routes/computeRoutes'));
app.use('/admin', require('../src/routes/adminRoutes'));
app.use('/participate', require('../src/routes/participationRoutes'));

const originalMode = process.env.DEMO_MODE;
beforeEach(() => { delete process.env.DEMO_MODE; });
afterAll(() => {
  if (originalMode === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = originalMode;
});

async function openDemo() {
  const browser = request.agent(app);
  const response = await browser.get('/auth/me').expect(200);
  expect(response.headers['cache-control']).toBe('private, no-store');
  return { browser, user: response.body.user, cookie: response.headers['set-cookie'][0] };
}

test('opens without credentials, preloads one complete sample, and preserves the session', async () => {
  const { browser, user, cookie } = await openDemo();
  expect(user).toMatchObject({ isDemo: true, role: 'STUDENT' });
  expect(cookie).toContain('HttpOnly');
  expect(cookie).toContain('SameSite=Lax');
  const token = cookie.split(';')[0].split('=')[1];
  expect((await getSession(token)).id).toBe(user.id);
  const again = await browser.get('/auth/me').expect(200);
  expect(again.body.user.id).toBe(user.id);
  const list = await browser.get('/problems').expect(200);
  expect(list.body.problems).toHaveLength(1);
  expect(list.body.problems[0].id).toBe(user.sampleProblemId);
  const loaded = await browser.get(`/problems/${user.sampleProblemId}`).expect(200);
  const data = loaded.body.problem.data;
  expect(data.criteria).toEqual(['Cost', 'Performance', 'Portability']);
  expect(data.alternatives).toHaveLength(3);
  expect(data.participants[0].name).toBe(user.fullName);
  const participant = data.participants[0];
  await request(app).get(`/participate/${user.sampleProblemId}/${participant.token}`).expect(200);
});

test('the sample computes consistent matrices and meaningful rankings without credentials', async () => {
  const { browser, user } = await openDemo();
  const loaded = await browser.get(`/problems/${user.sampleProblemId}`).expect(200);
  const { criteriaMatrix, altMatrices } = loaded.body.problem.data;
  for (const matrix of [criteriaMatrix, ...Object.values(altMatrices)]) {
    const consistency = await browser.post('/compute/consistency').send({ matrix }).expect(200);
    expect(consistency.body.isConsistent).toBe(true);
    expect(consistency.body.cr).toBeLessThan(0.1);
    matrix.forEach((row, i) => row.forEach((value, j) => {
      expect(value * matrix[j][i]).toBeCloseTo(1);
    }));
  }
  const results = await browser.get(`/problems/${user.sampleProblemId}/aggregate-results`).expect(200);
  const ranking = results.body.globalResults.normalized;
  expect(Object.values(ranking).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  expect(ranking['Budget Laptop']).toBeGreaterThan(ranking['Lightweight Laptop']);
  expect(ranking['Lightweight Laptop']).toBeGreaterThan(ranking['Performance Laptop']);
});

test('edits survive reloads, browsers are isolated, and restoring leaves other problems intact', async () => {
  const first = await openDemo();
  const second = await openDemo();
  expect(first.user.id).not.toBe(second.user.id);
  const id = first.user.sampleProblemId;
  await second.browser.get(`/problems/${id}`).expect(404);
  const loaded = await first.browser.get(`/problems/${id}`).expect(200);
  const data = loaded.body.problem.data;
  data.criteriaMatrix[0][1] = 3;
  data.criteriaMatrix[1][0] = 1 / 3;
  await first.browser.post(`/problems/${id}/save`).send(data).expect(200);
  const reloaded = await first.browser.get(`/problems/${id}`).expect(200);
  expect(reloaded.body.problem.data.criteriaMatrix[0][1]).toBe(3);
  expect(reloaded.body.problem.data.participants[0].roundData['1'].comparisons.criteriaMatrix[0][1]).toBe(3);
  const custom = await first.browser.post('/problems').send({ title: 'My presentation' }).expect(201);
  const restored = await first.browser.post('/problems/sample/restore').expect(200);
  expect(restored.body.problem.id).toBe(id);
  const sample = await first.browser.get(`/problems/${id}`).expect(200);
  expect(sample.body.problem.data.criteriaMatrix[0][1]).toBe(2);
  await first.browser.get(`/problems/${custom.body.problem.id}`).expect(200);
  await first.browser.delete(`/problems/${id}`).expect(200);
  await first.browser.post('/problems/sample/restore').expect(200);
  const list = await first.browser.get('/problems').expect(200);
  expect(list.body.problems).toHaveLength(2);
  const download = await first.browser.get(`/problems/${id}/download`).expect(200);
  expect(download.body.downloadUrl).toMatch(/^data:application\/json/);
});

test('demo cannot access administration, credentials, or an existing account via JWT', async () => {
  const { browser, user } = await openDemo();
  await browser.get('/admin/users').expect(403);
  await browser.post('/auth/change-password').send({}).expect(403);
  await browser.post('/auth/login').send({ username: 'admin', password: 'unused' }).expect(403);
  const token = jwt.sign({ userId: 'real-account', role: 'ADMIN' }, 'test-only-secret');
  const response = await browser.get('/auth/me').set('Cookie', `jwt=${token}`).expect(200);
  expect(response.body.user.isDemo).toBe(true);
  expect(response.body.user.id).not.toBe('real-account');
  expect(user.isDemo).toBe(true);
  expect(await storage.getJSON('data/users.json')).toBeNull();
});

test('optional participant PINs work without configuring a JWT secret', async () => {
  const { browser, user } = await openDemo();
  const id = user.sampleProblemId;
  const loaded = await browser.get(`/problems/${id}`).expect(200);
  const participant = loaded.body.problem.data.participants[0];
  await browser.put(`/problems/${id}/config`).send({ pinProtection: true }).expect(200);
  const pin = await browser.post(`/problems/${id}/participants/${participant.id}/regenerate-pin`).expect(200);
  const guest = request.agent(app);
  const locked = await guest.get(`/participate/${id}/${participant.token}`).expect(200);
  expect(locked.body.requiresPin).toBe(true);
  await guest.post(`/participate/${id}/${participant.token}/verify-pin`).send({ pin: pin.body.pin }).expect(200);
  const unlocked = await guest.get(`/participate/${id}/${participant.token}`).expect(200);
  expect(unlocked.body.requiresPin).not.toBe(true);
});

test('DEMO_MODE=false restores authentication and rejects demo cookies', async () => {
  const { browser } = await openDemo();
  process.env.DEMO_MODE = 'false';
  await browser.get('/auth/me').expect(401);
  await browser.get('/problems').expect(401);
  await browser.post('/compute/priorities').send({ matrix: [[1, 2], [0.5, 1]] }).expect(401);
});

test('a lost session returns a recovery signal instead of switching workspaces mid-request', async () => {
  const { browser, user, cookie } = await openDemo();
  const token = cookie.split(';')[0].split('=')[1];
  await storage.deleteKey(`sessions/${token}.json`);
  const response = await browser.get(`/problems/${user.sampleProblemId}/participants`).expect(409);
  expect(response.body.error.code).toBe('DEMO_SESSION_EXPIRED');
  expect(response.headers['set-cookie']).toBeUndefined();
  const reopened = await browser.get('/auth/me').expect(200);
  const sample = reopened.body.user.sampleProblemId;
  const participants = await browser.get(`/problems/${sample}/participants`).expect(200);
  expect(participants.body.participants[0].name).toBe('Demo Presenter');
});
