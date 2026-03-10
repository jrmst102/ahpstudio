import React from 'react';

/**
 * HierarchyMap – compact visual tree showing the AHP decision structure
 * with the current comparison group highlighted.
 *
 * Props:
 *   criteria       – array of criterion names
 *   subCriteria    – { criterion: [sub1, sub2, ...] }
 *   alternatives   – array of alternative names
 *   activeGroupKey – key of the current group (e.g. 'criteria', 'sub-Cost', 'alt-Cost', 'Cost::DevCost')
 *   goalLabel      – optional label for the root node (defaults to "Your Decision")
 */
const HierarchyMap = ({ criteria = [], subCriteria = {}, alternatives = [], activeGroupKey, goalLabel }) => {
  const active = parseGroupKey(activeGroupKey);

  const isGoalActive = active.level === 'criteria';

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm overflow-x-auto">
      {/* Goal / root */}
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${isGoalActive ? 'bg-nyu-violet' : 'bg-gray-300'}`} />
        <span className={`font-medium ${isGoalActive ? 'text-nyu-violet' : 'text-gray-500'}`}>
          {goalLabel || 'Your Decision'}
        </span>
        {isGoalActive && <span className="text-xs text-nyu-violet ml-1">◀ comparing criteria</span>}
      </div>

      {/* Criteria */}
      {criteria.map((c, ci) => {
        const subs = subCriteria[c] || [];
        const hasSubs = subs.length >= 2;
        const isCriterionActive =
          (active.level === 'subCriteria' && active.criterion === c) ||
          (active.level === 'alternatives' && active.criterion === c);
        const isLast = ci === criteria.length - 1;

        return (
          <div key={c} className="ml-3">
            {/* Branch line + criterion */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-300 flex-shrink-0">{isLast ? '└' : '├'}</span>
              <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCriterionActive ? 'bg-nyu-violet' : 'bg-gray-300'}`} />
              <span className={`${isCriterionActive ? 'text-nyu-violet font-semibold' : 'text-gray-600'}`}>
                {c}
              </span>
              {isCriterionActive && !hasSubs && (
                <span className="text-xs text-nyu-violet ml-1">◀ comparing alternatives</span>
              )}
              {isCriterionActive && hasSubs && active.level === 'subCriteria' && (
                <span className="text-xs text-nyu-violet ml-1">◀ comparing sub-criteria</span>
              )}
            </div>

            {/* Sub-criteria (only if they exist) */}
            {hasSubs && subs.map((sc, si) => {
              const isSubActive = active.level === 'subAlt' && active.criterion === c && active.subCriterion === sc;
              const isSubLast = si === subs.length - 1;

              return (
                <div key={sc} className={`ml-5 ${!isLast ? '' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-300 flex-shrink-0">{isSubLast ? '└' : '├'}</span>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSubActive ? 'bg-nyu-violet' : 'bg-gray-300'}`} />
                    <span className={`${isSubActive ? 'text-nyu-violet font-semibold' : 'text-gray-500'}`}>
                      {sc}
                    </span>
                    {isSubActive && (
                      <span className="text-xs text-nyu-violet ml-1">◀ comparing alternatives</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

function parseGroupKey(key) {
  if (!key) return {};
  if (key === 'criteria') return { level: 'criteria' };
  if (key.startsWith('sub-')) return { level: 'subCriteria', criterion: key.slice(4) };
  if (key.startsWith('alt-')) return { level: 'alternatives', criterion: key.slice(4) };
  if (key.includes('::')) {
    const [c, sc] = key.split('::');
    return { level: 'subAlt', criterion: c, subCriterion: sc };
  }
  return {};
}

export default HierarchyMap;
