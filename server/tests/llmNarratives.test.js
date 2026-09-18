const mockCreate = jest.fn();
jest.mock('openai', () => jest.fn().mockImplementation(() => ({
  chat: { completions: { create: mockCreate } },
})));
const OpenAI = require('openai');
const service = require('../src/services/llmService');
const controller = require('../src/controllers/llmController');

const envKeys = ['OPENAI_API_KEY', 'LLM_ENABLED', 'OPENAI_MODEL', 'OPENAI_FALLBACK_MODEL', 'OPENAI_MAX_RETRIES', 'OPENAI_TIMEOUT_MS'];
const original = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const context = { problemTitle: 'Laptop', criteria: ['Cost'], globalRankings: { Budget: 0.6, Lightweight: 0.4 } };
const response = (content = '{"narrative":"Budget has the highest priority."}') => ({
  model: 'actual-model', choices: [{ message: { content } }],
});
beforeEach(() => {
  envKeys.forEach(key => delete process.env[key]);
  process.env.OPENAI_API_KEY = 'test-only-key';
  mockCreate.mockReset();
  OpenAI.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

async function requestNarrative(regenerate = false) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  await controller[regenerate ? 'regenerateNarratives' : 'generateNarratives']({
    user: { id: 'demo' }, params: { id: 'laptop' }, body: { contextPayload: context },
  }, res);
  return res;
}

test.each([
  ['missing key', ' ', undefined, 'LLM_NOT_CONFIGURED'],
  ['disabled', 'test-only-key', 'false', 'LLM_DISABLED'],
])('%s is reported without sending a provider request', async (label, key, flag, code) => {
  process.env.OPENAI_API_KEY = key;
  if (flag !== undefined) process.env.LLM_ENABLED = flag;
  const res = await requestNarrative();
  expect(res.status).toHaveBeenCalledWith(503);
  expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code, retryable: false }) });
  expect(mockCreate).not.toHaveBeenCalled();
  expect(service.getStatus().reason).toBe(code);
});

test('a configured demo generates JSON narratives with rankings and the actual model', async () => {
  process.env.LLM_ENABLED = ' TRUE ';
  mockCreate.mockResolvedValue(response());
  const res = await requestNarrative();
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
    narratives: { narrative: 'Budget has the highest priority.', model: 'actual-model' },
    model: 'actual-model', regenerationsRemaining: 3,
  }));
  expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 0, timeout: 14000 }));
  const [payload, options] = mockCreate.mock.calls[0];
  expect(payload.messages[1].content).toContain('"Budget":0.6');
  expect(payload.response_format).toEqual({ type: 'json_object' });
  expect(options.timeout).toBeLessThanOrEqual(14000);
});

test.each([
  [{ status: 401 }, 'LLM_AUTHENTICATION_FAILED', false, 503],
  [{ status: 429, code: 'insufficient_quota' }, 'LLM_QUOTA_EXCEEDED', false, 503],
  [{ status: 429, code: 'rate_limit_exceeded' }, 'LLM_RATE_LIMITED', true, 503],
  [{ status: 404 }, 'LLM_MODEL_UNAVAILABLE', false, 503],
  [{ name: 'APIConnectionTimeoutError' }, 'LLM_TIMEOUT', true, 504],
])('provider failure %j remains diagnosable without leaking its error body', async (details, code, retryable, status) => {
  mockCreate.mockRejectedValue(Object.assign(new Error('secret provider body: test-only-key'), details));
  for (const regenerate of [false, true]) {
    const res = await requestNarrative(regenerate);
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code, retryable }) });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('test-only-key');
  }
  expect(JSON.stringify(console.error.mock.calls)).not.toContain('test-only-key');
});

test('fallback receives only the remaining deadline and returns its actual model', async () => {
  process.env.OPENAI_MODEL = 'primary';
  process.env.OPENAI_FALLBACK_MODEL = 'fallback';
  const now = jest.spyOn(Date, 'now').mockReturnValue(0);
  mockCreate.mockImplementationOnce(async () => {
    now.mockReturnValue(21000);
    throw Object.assign(new Error('Request timed out'), { name: 'APIConnectionTimeoutError' });
  }).mockResolvedValueOnce(response());
  expect((await service.generateReportNarratives(context)).model).toBe('actual-model');
  expect(mockCreate.mock.calls[1][0].model).toBe('fallback');
  expect(mockCreate.mock.calls[1][1].timeout).toBe(7000);
});

test.each([401, 429])('account failure %s skips an unnecessary fallback', async status => {
  process.env.OPENAI_FALLBACK_MODEL = 'different-model';
  mockCreate.mockRejectedValue(Object.assign(new Error('Account failure'), { status, code: status === 429 ? 'insufficient_quota' : undefined }));
  await expect(service.generateReportNarratives(context)).rejects.toMatchObject({ status });
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

test.each(['{}', 'null', 'not JSON', '{"narrative":" "}', ''])('invalid narrative %s is rejected instead of silently displaying nothing', async content => {
  mockCreate.mockResolvedValue(response(content));
  const res = await requestNarrative();
  expect(res.status).toHaveBeenCalledWith(502);
  expect(res.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: 'LLM_INVALID_RESPONSE' }) });
});
