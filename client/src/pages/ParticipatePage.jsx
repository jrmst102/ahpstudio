import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ComparisonWizard from '../components/comparisons/ComparisonWizard';
import CoachingCard from '../components/comparisons/CoachingCard';
import HierarchyMap from '../components/comparisons/HierarchyMap';

const api = axios.create({ baseURL: '/api/v1', withCredentials: true });

function emptyMatrix(n) {
  return Array.from({ length: n }, () => Array(n).fill(1));
}

const ParticipatePage = () => {
  const { problemId, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  // PIN state
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // Wizard state
  const [comparisons, setComparisons] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coaching, setCoaching] = useState([]);
  const [groupIdx, setGroupIdx] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/participate/${problemId}/${token}`);
      const d = res.data;
      if (d.requiresPin) {
        setRequiresPin(true);
        setData(d);
      } else if (d.closed) {
        setData(d);
      } else {
        setData(d);
        setComparisons(d.comparisons || {});
        if (d.status === 'completed') setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load. This link may be invalid.');
    } finally {
      setLoading(false);
    }
  }, [problemId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePinVerify = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinLoading(true);
    try {
      await api.post(`/participate/${problemId}/${token}/verify-pin`, { pin: pinInput });
      setRequiresPin(false);
      setPinInput('');
      await fetchData();
    } catch (err) {
      setPinError(err.response?.data?.error?.message || 'Verification failed');
    } finally {
      setPinLoading(false);
    }
  };

  // Build comparison groups identical to ProblemEditor wizard
  const buildGroups = () => {
    if (!data) return [];
    const { criteria = [], alternatives = [], subCriteria = {} } = data;
    const g = [];

    if (criteria.length >= 2) {
      g.push({
        key: 'criteria',
        label: 'Criteria Comparison',
        question: 'Which criteria matter most for this decision?',
        description: 'Compare how important each criterion is relative to the others.',
        items: criteria,
        matrixKey: 'criteriaMatrix',
      });
    }

    criteria.forEach(c => {
      const subs = subCriteria[c] || [];
      if (subs.length >= 2) {
        g.push({
          key: `sub-${c}`,
          label: `Sub-criteria under "${c}"`,
          question: `Which aspects of "${c}" matter most?`,
          description: `Compare the sub-criteria within "${c}" to determine their relative importance.`,
          items: subs,
          matrixKey: `subCriteriaMatrices.${c}`,
        });
        subs.forEach(sc => {
          g.push({
            key: `${c}::${sc}`,
            label: `Alternatives w.r.t. "${c}" > "${sc}"`,
            question: `Considering "${sc}", which option is best?`,
            description: `Compare the alternatives based on "${sc}" (a sub-criterion of "${c}").`,
            items: alternatives,
            matrixKey: `subCriteriaAltMatrices.${c}::${sc}`,
          });
        });
      } else if (alternatives.length >= 2) {
        g.push({
          key: `alt-${c}`,
          label: `Alternatives w.r.t. "${c}"`,
          question: `Considering "${c}", which option is best?`,
          description: `Compare the alternatives based specifically on how they perform on "${c}".`,
          items: alternatives,
          matrixKey: `altMatrices.${c}`,
        });
      }
    });

    return g;
  };

  const getMatrix = (matrixKey) => {
    const parts = matrixKey.split('.');
    let obj = comparisons;
    for (const p of parts) {
      obj = obj?.[p];
    }
    return obj;
  };

  const setMatrix = (matrixKey, matrix) => {
    const parts = matrixKey.split('.');
    const newComps = JSON.parse(JSON.stringify(comparisons));
    let obj = newComps;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = matrix;
    setComparisons(newComps);
  };

  const handleCellChange = (matrixKey, items, i, j, val) => {
    const current = getMatrix(matrixKey) || emptyMatrix(items.length);
    const m = current.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = 1 / val;
    setMatrix(matrixKey, m);
  };

  const handleSave = async (isSubmit = false) => {
    setSaving(true);
    try {
      const res = await api.put(`/participate/${problemId}/${token}`, {
        comparisons,
        submit: isSubmit,
      });
      if (isSubmit) {
        setCoaching(res.data?.coaching || []);
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // PIN entry screen
  if (requiresPin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-xl font-bold text-purple-900 mb-2">{data?.problemTitle}</h1>
          <p className="text-gray-600 mb-1">Welcome, <strong>{data?.participantName}</strong></p>
          <p className="text-sm text-gray-500 mb-6">Please enter your 4-digit PIN to continue.</p>
          <form onSubmit={handlePinVerify}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full text-center text-2xl tracking-[0.5em] border-2 border-gray-300 rounded-lg p-3 focus:border-purple-600 focus:outline-none"
              placeholder="• • • •"
              autoFocus
            />
            {pinError && <p className="text-red-600 text-sm mt-2">{pinError}</p>}
            <button
              type="submit"
              disabled={pinInput.length < 4 || pinLoading}
              className="w-full mt-4 bg-purple-700 text-white py-3 rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50 transition-colors"
            >
              {pinLoading ? 'Verifying...' : 'Verify PIN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Closed round
  if (data?.closed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Round Closed</h2>
          <p className="text-gray-600">{data.message}</p>
        </div>
      </div>
    );
  }

  // Submitted confirmation
  if (submitted) {
    const inconsistentCoaching = coaching.filter(c => c.cr > 0.1);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Comparisons Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you, <strong>{data?.participantName}</strong>. Your comparisons have been recorded.
          </p>
          {inconsistentCoaching.length > 0 && (
            <div className="text-left mt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Some of your comparison groups may benefit from review:</p>
              {inconsistentCoaching.map((c, idx) => (
                <CoachingCard
                  key={idx}
                  groupLabel={c.groupLabel}
                  cr={c.cr}
                  coachingMessage={c.message}
                  onRevise={() => {
                    setSubmitted(false);
                    setCoaching([]);
                    const groups = buildGroups();
                    const targetIdx = groups.findIndex(g => g.label === c.groupLabel);
                    if (targetIdx >= 0) setGroupIdx(targetIdx);
                  }}
                />
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-4">
            The project admin will share results once the decision is finalised.
          </p>
          <button
            onClick={() => { setSubmitted(false); setCoaching([]); }}
            className="mt-6 text-purple-700 underline text-sm"
          >
            Revise my comparisons
          </button>
        </div>
      </div>
    );
  }

  // Welcome / Wizard
  const groups = buildGroups();
  const currentGroup = groups[Math.min(groupIdx, groups.length - 1)];
  const isLastGroup = groupIdx >= groups.length - 1;

  // If no groups, show message
  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-gray-600">The problem is not yet ready for comparisons. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white py-4 px-6">
        <h1 className="text-lg font-bold">{data?.problemTitle}</h1>
        <p className="text-purple-200 text-sm">
          Participant: {data?.participantName}
          {data?.currentRound > 1 && ` · Round ${data.currentRound}`}
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Group progress */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Step {Math.min(groupIdx, groups.length - 1) + 1} of {groups.length}
          </span>
          <div className="flex gap-1">
            {groups.map((g, idx) => (
              <button
                key={g.key}
                onClick={() => setGroupIdx(idx)}
                className={`h-2 rounded-full transition-colors ${idx === groupIdx ? 'w-6 bg-purple-700' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                title={g.label}
              />
            ))}
          </div>
        </div>

        {/* Delphi reference (round 2+) */}
        {data?.previousRoundPriorities && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Round {data.currentRound}: You can revise your comparisons. The group's previous results are shown for reference.
          </div>
        )}

        {currentGroup && (
          <>
            <HierarchyMap
              criteria={data?.criteria || []}
              subCriteria={data?.subCriteria || {}}
              alternatives={data?.alternatives || []}
              activeGroupKey={currentGroup.key}
              goalLabel={data?.problemTitle}
            />

            <ComparisonWizard
              key={currentGroup.key}
              items={currentGroup.items}
              matrix={getMatrix(currentGroup.matrixKey) || emptyMatrix(currentGroup.items.length)}
              onCellChange={(i, j, val) => handleCellChange(currentGroup.matrixKey, currentGroup.items, i, j, val)}
              contextLabel={currentGroup.question || currentGroup.label}
              contextDescription={currentGroup.description}
              onComplete={() => {
                if (!isLastGroup) setGroupIdx(groupIdx + 1);
              }}
            />
          </>
        )}

        {/* Navigation & actions */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={() => setGroupIdx(Math.max(0, groupIdx - 1))}
            disabled={groupIdx === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            ← Previous Step
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving...' : 'Save & Continue Later'}
            </button>
            {isLastGroup ? (
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 disabled:opacity-50 transition-colors"
              >
                Submit Comparisons
              </button>
            ) : (
              <button
                onClick={() => setGroupIdx(groupIdx + 1)}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-400">
        Powered by AHP Studio
      </div>
    </div>
  );
};

export default ParticipatePage;
