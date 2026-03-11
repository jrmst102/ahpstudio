import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import llmService from '../../services/llmService';

/**
 * NarrativePreview – allows the admin to preview, edit, and regenerate
 * LLM-generated narrative sections before generating the PDF report.
 */
const NarrativePreview = ({ problemId, contextPayload, onNarrativesReady }) => {
  const [editedNarratives, setEditedNarratives] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenerationsRemaining, setRegenerationsRemaining] = useState(3);
  const [llmAvailable, setLlmAvailable] = useState(true);

  const sections = [
    { key: 'decisionRationale', label: 'Decision Rationale' },
    { key: 'consensusSummary', label: 'Consensus Summary' },
    { key: 'sensitivityCommentary', label: 'Sensitivity Commentary' },
    { key: 'limitationsAndCaveats', label: 'Limitations and Caveats' },
  ];

  useEffect(() => {
    generateNarratives();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generateNarratives = async () => {
    setLoading(true);
    setError('');
    setLlmAvailable(true);
    try {
      const result = await llmService.generateNarratives(problemId, contextPayload);
      setEditedNarratives({ ...result.narratives });
      setRegenerationsRemaining(result.regenerationsRemaining);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await llmService.regenerateNarratives(problemId, contextPayload);
      setEditedNarratives({ ...result.narratives });
      setRegenerationsRemaining(result.regenerationsRemaining);
      if (onNarrativesReady) onNarrativesReady(result.narratives);
    } catch (err) {
      if (err.response?.status === 429) {
        setRegenerationsRemaining(0);
        setError('Regeneration limit reached.');
      } else {
        setError('Failed to regenerate narratives.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key, value) => {
    const updated = { ...editedNarratives, [key]: value };
    setEditedNarratives(updated);
    if (onNarrativesReady) onNarrativesReady(updated);
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

  if (!llmAvailable || error) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 mt-4">
        <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">AI-Generated Narrative</h4>
        <p className="text-gray-500 text-sm mb-3">
          {error || 'AI narrative unavailable — the report will include a standard summary.'}
        </p>
        <Button size="sm" variant="outline" onClick={generateNarratives}>
          Retry
        </Button>
      </div>
    );
  }

  if (!editedNarratives) return null;

  return (
    <div className="border border-gray-200 rounded-lg p-6 mt-4">
      <h4 className="text-lg font-semibold text-nyu-text-primary mb-4">AI-Generated Narrative</h4>

      <div className="space-y-4">
        {sections.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-nyu-text-primary mb-1">{label}</label>
            {editedNarratives[key] ? (
              <textarea
                value={editedNarratives[key]}
                onChange={(e) => handleEdit(key, e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            ) : (
              <p className="text-gray-400 text-sm italic p-3 bg-gray-50 rounded-lg">
                AI-generated narrative unavailable for this section.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          You can edit the text above before generating the PDF.
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRegenerate}
          disabled={loading || regenerationsRemaining <= 0}
        >
          Regenerate ({regenerationsRemaining} left)
        </Button>
      </div>
    </div>
  );
};

export default NarrativePreview;
