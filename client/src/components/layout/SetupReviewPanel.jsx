import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import llmService from '../../services/llmService';

const SEVERITY_STYLES = {
  warning: {
    border: 'border-l-red-500',
    bg: 'bg-red-50',
    icon: '⚠️',
    badge: 'bg-red-100 text-red-700',
  },
  suggestion: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50',
    icon: '💡',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50',
    icon: 'ℹ️',
    badge: 'bg-blue-100 text-blue-700',
  },
};

/**
 * SetupReviewPanel – displays AI-powered and deterministic validation
 * results for the problem structure.
 */
const SetupReviewPanel = ({ problemId, problemData, isOpen, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (isOpen && !results) {
      runValidation();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const runValidation = async () => {
    setLoading(true);
    setError('');
    setDismissed(new Set());
    try {
      const data = await llmService.validateStructure(problemId, problemData);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to run validation.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (idx) => {
    setDismissed(prev => new Set([...prev, idx]));
  };

  if (!isOpen) return null;

  const allObservations = results
    ? [...(results.deterministic || []), ...(results.aiObservations || [])]
    : [];

  const visibleObservations = allObservations.filter((_, i) => !dismissed.has(i));

  // Sort by severity: warnings first, then suggestions, then info
  const severityOrder = { warning: 0, suggestion: 1, info: 2 };
  visibleObservations.sort((a, b) =>
    (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  const allDismissed = visibleObservations.length === 0 && allObservations.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-nyu-text-primary">Setup Review</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700" />
              <span className="ml-3 text-gray-500">Analyzing your setup...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {results && !loading && (
            <>
              {/* Summary */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                {results.summary.warnings + results.summary.suggestions + results.summary.info === 0 ? (
                  <p className="text-green-700 text-sm font-medium">
                    ✓ No issues detected. Your problem structure looks good.
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">
                      {results.summary.warnings > 0 && `${results.summary.warnings} warning${results.summary.warnings > 1 ? 's' : ''}`}
                      {results.summary.warnings > 0 && results.summary.suggestions > 0 && ', '}
                      {results.summary.suggestions > 0 && `${results.summary.suggestions} suggestion${results.summary.suggestions > 1 ? 's' : ''}`}
                      {(results.summary.warnings > 0 || results.summary.suggestions > 0) && results.summary.info > 0 && ', '}
                      {results.summary.info > 0 && `${results.summary.info} info`}
                    </span>
                    {' — Review these before opening the round.'}
                  </p>
                )}
              </div>

              {!results.llmAvailable && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700 text-sm">
                    AI-powered suggestions are temporarily unavailable. Showing structural checks only.
                  </p>
                </div>
              )}

              {/* Observations */}
              {allDismissed ? (
                <p className="text-gray-400 text-sm italic text-center py-8">All observations reviewed.</p>
              ) : (
                <div className="space-y-3">
                  {allObservations.map((obs, idx) => {
                    if (dismissed.has(idx)) return null;
                    const style = SEVERITY_STYLES[obs.severity] || SEVERITY_STYLES.info;
                    return (
                      <div
                        key={idx}
                        className={`rounded-lg p-4 border-l-4 ${style.border} ${style.bg}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span>{style.icon}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                                {obs.category.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="font-semibold text-sm text-gray-800">{obs.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{obs.message}</p>
                            {obs.affectedElements?.length > 0 && (
                              <p className="text-xs text-gray-400 mt-1">
                                Affected: {obs.affectedElements.join(', ')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDismiss(idx)}
                            className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
                            title="Dismiss"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <Button size="sm" variant="outline" onClick={runValidation} disabled={loading}>
            {loading ? 'Analyzing...' : 'Re-run Review'}
          </Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default SetupReviewPanel;
