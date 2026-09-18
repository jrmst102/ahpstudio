import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NarrativePreview from './NarrativePreview';
import llmService from '../../services/llmService';

jest.mock('../../services/llmService', () => ({ generateNarratives: jest.fn(), regenerateNarratives: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test('configuration failures explain the issue without offering a futile retry', async () => {
  llmService.generateNarratives.mockRejectedValue({ response: {
    status: 503, data: { error: { message: 'AI narratives are not configured for this deployment.', retryable: false } },
  } });
  render(<NarrativePreview problemId="sample" contextPayload={{}} />);
  expect(await screen.findByText('AI narratives are not configured for this deployment.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
});

test('a transient failure can be retried successfully', async () => {
  llmService.generateNarratives.mockRejectedValueOnce({ response: {
    status: 504, data: { error: { message: 'The AI service took too long to respond.', retryable: true } },
  } }).mockResolvedValueOnce({ narratives: { narrative: 'Generated report.' }, regenerationsRemaining: 3, model: 'actual-model' });
  render(<NarrativePreview problemId="sample" contextPayload={{}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
  expect(await screen.findByDisplayValue('Generated report.')).toBeInTheDocument();
  expect(screen.getByText('Generated using actual-model')).toBeInTheDocument();
});

test('provider rate limiting during regeneration retains the existing narrative and remaining attempts', async () => {
  llmService.generateNarratives.mockResolvedValue({ narratives: { narrative: 'Existing report.' }, regenerationsRemaining: 3 });
  llmService.regenerateNarratives.mockRejectedValue({ response: {
    status: 503, data: { error: { code: 'LLM_RATE_LIMITED', message: 'The AI service is busy.', retryable: true } },
  } });
  render(<NarrativePreview problemId="sample" contextPayload={{}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Regenerate (3 left)' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('The AI service is busy.');
  expect(screen.getByDisplayValue('Existing report.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Regenerate (3 left)' })).toBeEnabled();
});
