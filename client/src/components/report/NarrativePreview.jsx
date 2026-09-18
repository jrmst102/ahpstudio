import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import llmService from '../../services/llmService';

/**
 * NarrativePreview – allows the admin to preview, edit, and regenerate
 * LLM-generated narrative sections before generating the PDF report.
 */
const NarrativePreview = ({ problemId, contextPayload, onNarrativesReady }) => {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenerationsRemaining, setRegenerationsRemaining] = useState(3);
  const [llmAvailable, setLlmAvailable] = useState(true);
  const [modelUsed, setModelUsed] = useState('');
  const [retryable, setRetryable] = useState(true);

  useEffect(() => {
    generateNarratives();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateNarratives = async () => {
    setLoading(true);
    setError('');
    setLlmAvailable(true);
    setRetryable(true);
    try {
      const result = await llmService.generateNarratives(problemId, contextPayload);
      const text = result.narratives?.narrative || null;
      setNarrative(text);
      setRegenerationsRemaining(result.regenerationsRemaining);
      if (result.model) setModelUsed(result.model);
      setLlmAvailable(true);
      if (onNarrativesReady) onNarrativesReady(result.narratives);
    } catch (err) {
      const serverMsg = err.response?.data?.error?.message;
      const status = err.response?.status;
      let msg;
      if (serverMsg) {
        msg = serverMsg;
      } else if (status) {
        msg = `Server returned status ${status}. Please try again.`;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Request timed out. The AI service may be busy — please try again.';
      } else {
        msg = 'Could not connect to the AI service. Please try again.';
      }
      setError(msg);
      setLlmAvailable(false);
      setRetryable(err.response?.data?.error?.retryable !== false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await llmService.regenerateNarratives(problemId, contextPayload);
      const text = result.narratives?.narrative || null;
      setNarrative(text);
      setRegenerationsRemaining(result.regenerationsRemaining);
      if (result.model) setModelUsed(result.model);
      if (onNarrativesReady) onNarrativesReady(result.narratives);
    } catch (err) {
      if (err.response?.data?.error?.code === 'REGENERATION_LIMIT') {
        setRegenerationsRemaining(0);
        setError('Regeneration limit reached.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to regenerate narratives.');
      }
      setRetryable(err.response?.data?.error?.retryable !== false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (value) => {
    setNarrative(value);
    if (onNarrativesReady) onNarrativesReady({ narrative: value });
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 mt-4">
        <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">AI-Generated Narrative</h4>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
          <span className="ml-3 text-gray-500">Generating AI narrative...</span>
        </div>
      </div>
    );
  }

  if ((!llmAvailable || error) && !narrative) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 mt-4">
        <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">AI-Generated Narrative</h4>
        <p className="text-gray-500 text-sm mb-3">
          {error || 'AI narrative unavailable — the report will include a standard summary.'}
        </p>
        {retryable && <Button size="sm" variant="outline" onClick={generateNarratives}>
          Retry
        </Button>}
      </div>
    );
  }

  if (!narrative) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-6 mt-4">
      <h4 className="text-lg font-semibold text-nyu-text-primary mb-4">AI-Generated Narrative</h4>

      {error && <p role="alert" className="text-gray-500 text-sm mb-3">{error} Your existing narrative is kept.</p>}

      <textarea
        value={narrative}
        onChange={(e) => handleEdit(e.target.value)}
        rows={8}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div>
          <span className="text-xs text-gray-400">
            You can edit the text above before generating the PDF.
          </span>
          {modelUsed && (
            <p className="text-xs text-gray-300 mt-1">Generated using {modelUsed}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
          disabled={loading || regenerationsRemaining <= 0 || !retryable}
        >
          Regenerate ({regenerationsRemaining} left)
        </Button>
      </div>
    </div>
  );
};

export default NarrativePreview;
