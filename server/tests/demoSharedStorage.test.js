const request = require('supertest');
const jwt = require('jsonwebtoken');

// Independent module registries represent separate server processes sharing
// only the object store, never their sessions or in-memory documents.
const mockDocuments = new Map();
const mockKeys = [];
let mockUnavailable = false;
jest.mock('@aws-sdk/client-s3', () => {
  const commands = Object.fromEntries(['GetObjectCommand', 'PutObjectCommand', 'DeleteObjectCommand', 'ListObjectsV2Command']
    .map(type => [type, class { constructor(input) { this.input = input; this.type = type; } }]));
  return {
    ...commands,
    S3Client: class {
      async send(command) {
        if (mockUnavailable) throw new Error('Storage unavailable');
        const { Key, Body, Prefix } = command.input;
        mockKeys.push(Key || Prefix);
        if (command.type === 'PutObjectCommand') { mockDocuments.set(Key, Body); return {}; }
        if (command.type === 'DeleteObjectCommand') { mockDocuments.delete(Key); return {}; }
        if (command.type === 'ListObjectsV2Command') {
          return { Contents: [...mockDocuments.keys()].filter(key => key.startsWith(Prefix)).map(Key => ({ Key })) };
        }
        if (!mockDocuments.has(Key)) throw Object.assign(new Error('Missing'), { name: 'NoSuchKey' });
        return { Body: { transformToString: async () => mockDocuments.get(Key) } };
      }
    },
  };
});

function createWorker() {
  let worker;
  jest.isolateModules(() => {
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use(require('cookie-parser')());
    app.use('/auth', require('../src/routes/authRoutes'));
    app.use('/problems', require('../src/routes/problemRoutes'));
    app.use((err, req, res, next) => res.status(500).json({ error: { message: err.message } }));
    worker = { app, secret: require('../src/config/demo').participationSecret() };
  });
  return worker;
}

const envKeys = ['DEMO_MODE', 'SPACES_ENDPOINT', 'SPACES_BUCKET', 'SPACES_KEY', 'SPACES_SECRET'];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
beforeEach(() => {
  delete process.env.DEMO_MODE;
  Object.assign(process.env, {
    SPACES_ENDPOINT: 'https://example.invalid', SPACES_BUCKET: 'test-only',
    SPACES_KEY: 'test-only-key', SPACES_SECRET: 'test-only-secret',
  });
  mockDocuments.clear();
  mockKeys.length = 0;
  mockUnavailable = false;
});
afterAll(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('participants and edits survive switching instances and restarting the server', async () => {
  const first = createWorker();
  const second = createWorker();
  const opened = await request(first.app).get('/auth/me').expect(200);
  const cookie = opened.headers['set-cookie'][0].split(';')[0];
  const user = opened.body.user;
  const path = `/problems/${user.sampleProblemId}`;
  const resumed = await request(second.app).get('/auth/me').set('Cookie', cookie).expect(200);
  expect(resumed.body.user).toEqual(user);
  expect(resumed.headers['set-cookie']).toBeUndefined();
  const participants = await request(second.app).get(`${path}/participants`).set('Cookie', cookie).expect(200);
  expect(participants.body.participants[0].name).toBe('Demo Presenter');
  await request(second.app).post(`${path}/participants`).set('Cookie', cookie).send({ name: 'Guest Presenter' }).expect(201);
  await request(second.app).put(path).set('Cookie', cookie).send({ title: 'My edited demo' }).expect(200);

  const restarted = createWorker();
  const loaded = await request(restarted.app).get(path).set('Cookie', cookie).expect(200);
  expect(loaded.body.problem.title).toBe('My edited demo');
  expect(loaded.body.problem.data.participants.map(p => p.name)).toEqual(['Demo Presenter', 'Guest Presenter']);
  const list = await request(restarted.app).get('/problems').set('Cookie', cookie).expect(200);
  expect(list.body.problems).toHaveLength(1);
  const pinSession = jwt.sign({ token: 'participant' }, first.secret);
  expect(jwt.verify(pinSession, restarted.secret).token).toBe('participant');
  expect(mockKeys.every(key => key.startsWith('demo/'))).toBe(true);
});

test('demo storage cannot read or overwrite normal account data', async () => {
  const accountKey = 'data/users.json';
  const accounts = JSON.stringify([{ id: 'private-account' }]);
  mockDocuments.set(accountKey, accounts);
  const { app } = createWorker();
  const first = await request(app).get('/auth/me').expect(200);
  const second = await request(app).get('/auth/me').expect(200);
  const cookie = second.headers['set-cookie'][0].split(';')[0];
  await request(app).get(`/problems/${first.body.user.sampleProblemId}/participants`).set('Cookie', cookie).expect(404);
  expect(mockDocuments.get(accountKey)).toBe(accounts);
  expect(mockKeys.every(key => key.startsWith('demo/'))).toBe(true);
});

test('a temporary storage failure does not replace a valid demo session', async () => {
  const { app } = createWorker();
  const opened = await request(app).get('/auth/me').expect(200);
  const cookie = opened.headers['set-cookie'][0].split(';')[0];
  mockUnavailable = true;
  const failed = await request(app).get('/auth/me').set('Cookie', cookie).expect(500);
  expect(failed.headers['set-cookie']).toBeUndefined();
  mockUnavailable = false;
  const recovered = await request(app).get('/auth/me').set('Cookie', cookie).expect(200);
  expect(recovered.body.user).toEqual(opened.body.user);
});
