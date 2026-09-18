let mockReject;
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: (success, reject) => { mockReject = reject; } },
    },
  }),
}));

beforeAll(() => { require('./api'); });

test('expired demos reopen without redirecting to login; unrelated 404s stay visible', async () => {
  const originalLocation = window.location;
  delete window.location;
  window.location = { pathname: '/editor/sample', replace: jest.fn() };
  try {
    const missing = { response: { status: 404, data: { error: { message: 'Problem not found' } } } };
    await expect(mockReject(missing)).rejects.toBe(missing);
    expect(window.location.replace).not.toHaveBeenCalled();
    const expired = { response: { status: 409, data: { error: { code: 'DEMO_SESSION_EXPIRED' } } } };
    await expect(mockReject(expired)).rejects.toBe(expired);
    expect(window.location.replace).toHaveBeenCalledWith('/');
  } finally {
    window.location = originalLocation;
  }
});
