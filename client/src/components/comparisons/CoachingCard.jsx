import React from 'react';

/**
 * CoachingCard – displays an LLM-generated consistency coaching message
 * on the post-submission confirmation screen.
 */
const CoachingCard = ({ groupLabel, cr, coachingMessage, onRevise }) => {
  return (
    <div
      className="rounded-lg p-4 mb-3"
      style={{
        backgroundColor: '#FFF8E1',
        borderLeft: '4px solid #FFB300',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0" role="img" aria-label="lightbulb">💡</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm text-gray-800">{groupLabel}</span>
            <span className="text-xs text-red-600 font-mono">CR = {(cr * 100).toFixed(1)}%</span>
          </div>

          {coachingMessage ? (
            <p className="text-sm text-gray-700 leading-relaxed">{coachingMessage}</p>
          ) : (
            <p className="text-sm text-gray-500 italic">Detailed guidance is temporarily unavailable.</p>
          )}

          {onRevise && (
            <button
              onClick={onRevise}
              className="mt-2 text-sm text-purple-700 hover:text-purple-900 underline font-medium"
            >
              Revise This Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachingCard;
