import authService from './authService';
import api from './api';

jest.mock('./api', () => ({ get: jest.fn() }));

test('concurrent session checks share one request and later checks can refresh it', async () => {
  let resolve;
  api.get.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const first = authService.getCurrentUser();
  const second = authService.getCurrentUser();
  expect(api.get).toHaveBeenCalledTimes(1);
  resolve({ data: { user: { id: 'same-session' } } });
  expect(await first).toEqual(await second);
  api.get.mockResolvedValueOnce({ data: { user: { id: 'new-session' } } });
  expect(await authService.getCurrentUser()).toEqual({ user: { id: 'new-session' } });
  expect(api.get).toHaveBeenCalledTimes(2);
});
