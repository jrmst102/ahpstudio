import React, { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Alert from '../common/Alert';

const MAX_RESPONDENTS = 6;

/**
 * RespondentManager – manage respondents for a problem.
 *
 * Props:
 *   respondents          – array of { id, name, weight, rank }
 *   onRespondentsChange  – (updatedRespondents) => void
 *   onSelectRespondent   – (respondentId | null) => void – opens wizard for that respondent
 *   activeRespondentId   – currently selected respondent id (or null for owner)
 *   criteria             – array of criteria names (to show completion status)
 *   alternatives         – array of alternatives
 *   respondentData       – { respondentId: { criteriaMatrix, altMatrices, ... } }
 */
const RespondentManager = ({
  respondents = [],
  onRespondentsChange,
  onSelectRespondent,
  activeRespondentId,
  criteria = [],
  alternatives = [],
  respondentData = {},
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const addRespondent = () => {
    const name = newName.trim();
    if (!name) return;
    if (respondents.some(r => r.name === name)) {
      setError('A respondent with that name already exists');
      return;
    }
    if (respondents.length >= MAX_RESPONDENTS) {
      setError(`Maximum ${MAX_RESPONDENTS} respondents allowed`);
      return;
    }
    const updated = [
      ...respondents,
      {
        id: `resp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        weight: 1,
        rank: respondents.length + 1,
      },
    ];
    onRespondentsChange(updated);
    setNewName('');
    setShowAddModal(false);
  };

  const removeRespondent = (id) => {
    if (!window.confirm('Remove this respondent and all their comparison data?')) return;
    const updated = respondents.filter(r => r.id !== id);
    // Recompute ranks
    updated.forEach((r, i) => { r.rank = i + 1; });
    onRespondentsChange(updated);
    if (activeRespondentId === id) onSelectRespondent(null);
  };

  const updateWeight = (id, weight) => {
    const w = Math.max(0, Math.min(10, parseFloat(weight) || 0));
    const updated = respondents.map(r => r.id === id ? { ...r, weight: w } : r);
    onRespondentsChange(updated);
  };

  const updateRank = (id, rank) => {
    const r = Math.max(1, Math.min(respondents.length, parseInt(rank) || 1));
    const updated = respondents.map(resp => resp.id === id ? { ...resp, rank: r } : resp);
    onRespondentsChange(updated);
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const updated = [...respondents];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    updated.forEach((r, i) => { r.rank = i + 1; });
    onRespondentsChange(updated);
  };

  const moveDown = (idx) => {
    if (idx >= respondents.length - 1) return;
    const updated = [...respondents];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    updated.forEach((r, i) => { r.rank = i + 1; });
    onRespondentsChange(updated);
  };

  // Compute completion status for a respondent
  const getCompletionStatus = (respId) => {
    const data = respondentData[respId];
    if (!data) return { completed: 0, total: 0 };
    let total = 0;
    let completed = 0;

    // Criteria matrix pairs
    if (criteria.length >= 2) {
      const n = criteria.length;
      total += n * (n - 1) / 2;
      if (data.criteriaMatrix) {
        for (let i = 0; i < n; i++)
          for (let j = i + 1; j < n; j++)
            if (data.criteriaMatrix[i]?.[j] !== undefined) completed++;
      }
    }

    // Alternative matrices
    if (alternatives.length >= 2) {
      criteria.forEach(c => {
        const m = alternatives.length;
        total += m * (m - 1) / 2;
        const mat = data.altMatrices?.[c];
        if (mat) {
          for (let i = 0; i < m; i++)
            for (let j = i + 1; j < m; j++)
              if (mat[i]?.[j] !== undefined) completed++;
        }
      });
    }

    return { completed, total };
  };

  // Normalize weights for display
  const totalWeight = respondents.reduce((s, r) => s + r.weight, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-nyu-text-primary">Respondents</h3>
          <p className="text-sm text-nyu-text-secondary">
            Optionally add respondents to gather multiple perspectives. Each respondent completes comparisons via the wizard.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          disabled={respondents.length >= MAX_RESPONDENTS}
        >
          + Add Respondent
        </Button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {respondents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-nyu-text-secondary mb-2">No respondents added yet.</p>
          <p className="text-sm text-gray-400">
            Respondents are optional. You can add up to {MAX_RESPONDENTS} respondents to gather multiple perspectives.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {respondents.map((resp, idx) => {
            const status = getCompletionStatus(resp.id);
            const normalizedWeight = totalWeight > 0 ? ((resp.weight / totalWeight) * 100).toFixed(1) : '0.0';
            const isActive = activeRespondentId === resp.id;
            return (
              <div
                key={resp.id}
                className={`border rounded-lg p-4 transition-colors ${isActive ? 'border-nyu-violet bg-purple-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Rank controls */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-nyu-violet disabled:opacity-30 text-xs"
                      >▲</button>
                      <span className="text-sm font-bold text-nyu-violet text-center">#{resp.rank}</span>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx >= respondents.length - 1}
                        className="text-gray-400 hover:text-nyu-violet disabled:opacity-30 text-xs"
                      >▼</button>
                    </div>
                    <div>
                      <span className="font-semibold text-nyu-text-primary">{resp.name}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-nyu-text-secondary">
                          Weight: 
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={resp.weight}
                          onChange={e => updateWeight(resp.id, e.target.value)}
                          className="w-16 text-xs border rounded px-1 py-0.5"
                        />
                        <span className="text-xs text-gray-400">
                          ({normalizedWeight}% effective)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status.total > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${status.completed === status.total ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {status.completed}/{status.total} pairs
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={isActive ? 'primary' : 'outline'}
                      onClick={() => onSelectRespondent(isActive ? null : resp.id)}
                    >
                      {isActive ? 'Editing…' : 'Enter Data'}
                    </Button>
                    <button
                      onClick={() => removeRespondent(resp.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-sm text-nyu-text-secondary">
        {respondents.length}/{MAX_RESPONDENTS} respondents
      </p>

      {/* Add respondent modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewName(''); }}
        title="Add Respondent"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowAddModal(false); setNewName(''); }}>Cancel</Button>
            <Button onClick={addRespondent} disabled={!newName.trim()}>Add</Button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-nyu-text-primary mb-1">Respondent Name</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRespondent()}
            className="input w-full"
            placeholder="e.g., Dr. Smith"
            maxLength={60}
            autoFocus
          />
          <p className="text-xs text-nyu-text-secondary mt-2">
            Each respondent will provide their own set of pairwise comparisons via the wizard interface.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RespondentManager;
