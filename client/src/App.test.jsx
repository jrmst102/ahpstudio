import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import authService from './services/authService';
import problemService from './services/problemService';

jest.mock('./services/authService');
jest.mock('./services/problemService');
jest.mock('axios', () => ({ create: jest.fn(() => ({ get: jest.fn(), put: jest.fn() })) }));
jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const user = {
  id: 'demo-presenter', fullName: 'Demo Presenter', username: 'presenter',
  role: 'STUDENT', isDemo: true, sampleProblemId: 'sample-laptop',
};
const problem = {
  id: user.sampleProblemId, title: 'Sample: Choosing a Laptop', description: 'Demo problem',
  updatedAt: '2026-09-18T00:00:00Z',
  data: {
    criteria: ['Cost', 'Performance', 'Portability'],
    alternatives: ['Budget Laptop', 'Performance Laptop', 'Lightweight Laptop'],
    criteriaMatrix: [[1, 2, 4], [0.5, 1, 2], [0.25, 0.5, 1]],
    participants: [{ id: 'presenter', name: user.fullName }],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  authService.getCurrentUser.mockResolvedValue({ user });
  problemService.getProblem.mockResolvedValue({ problem });
  problemService.listProblems.mockResolvedValue({ problems: [problem] });
  problemService.restoreSample.mockResolvedValue({ problem });
});

test.each(['/', '/login'])('%s opens the sample without showing login or account controls', async (path) => {
  window.history.replaceState({}, '', path);
  render(<App />);
  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  expect(await screen.findByDisplayValue(problem.title)).toBeInTheDocument();
  expect(screen.getByText('Presentation mode')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /logout|settings|admin panel/i })).not.toBeInTheDocument();
  expect(problemService.getProblem).toHaveBeenCalledWith(user.sampleProblemId);
  fireEvent.click(screen.getByRole('button', { name: /comparisons/i }));
  expect(screen.queryByText('Comparisons Locked')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Compute sample results' })).toBeEnabled();
});

test('account settings redirects to the dashboard, where the sample can be restored', async () => {
  window.history.replaceState({}, '', '/settings');
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  try {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Restore sample problem' }));
    await waitFor(() => expect(problemService.restoreSample).toHaveBeenCalledTimes(1));
    expect(await screen.findByDisplayValue(problem.title)).toBeInTheDocument();
  } finally {
    confirm.mockRestore();
  }
});

test('an editor link from a previous demo session opens the fresh sample', async () => {
  window.history.replaceState({}, '', '/editor/expired-sample');
  problemService.getProblem.mockRejectedValueOnce({ response: { status: 404 } });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(<App />);
    expect(await screen.findByDisplayValue(problem.title)).toBeInTheDocument();
    expect(window.location.pathname).toBe(`/editor/${user.sampleProblemId}`);
  } finally {
    log.mockRestore();
  }
});

test('the Participants tab loads the preloaded presenter', async () => {
  window.history.replaceState({}, '', '/');
  problemService.listParticipants.mockResolvedValue({
    participants: [{ ...problem.data.participants[0], weight: 1, status: 'completed' }],
  });
  problemService.listRounds.mockResolvedValue({ rounds: [] });
  const socket = jest.spyOn(window, 'WebSocket').mockImplementation(() => ({ close: jest.fn() }));
  try {
    render(<App />);
    await screen.findByDisplayValue(problem.title);
    fireEvent.click(screen.getByRole('button', { name: /participants/i }));
    expect(await screen.findByText('Demo Presenter')).toBeInTheDocument();
    expect(screen.queryByText('Problem not found')).not.toBeInTheDocument();
    expect(screen.queryByText('No participants added yet.')).not.toBeInTheDocument();
  } finally {
    socket.mockRestore();
  }
});
