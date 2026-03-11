import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProblem } from '../context/ProblemContext';
import { useAuth } from '../context/AuthContext';
import computeService from '../services/computeService';
import problemService from '../services/problemService';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';
import ComparisonWizard from '../components/comparisons/ComparisonWizard';
import HierarchyMap from '../components/comparisons/HierarchyMap';
import ParticipantManager from '../components/participants/ParticipantManager';
import DecisionReport from '../components/report/DecisionReport';
import NarrativePreview from '../components/report/NarrativePreview';
import SetupReviewPanel from '../components/layout/SetupReviewPanel';
import { MAX_CRITERIA, MAX_ALTERNATIVES, CHART_COLORS } from '../utils/constants';

const MAX_SUB_CRITERIA = 6;

/* ───────────────────────── helpers ───────────────────────── */

function emptyMatrix(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : i < j ? 1 : 1))
  );
}

function formatValue(v) {
  if (v >= 1) return String(Math.round(v));
  return '1/' + String(Math.round(1 / v));
}

const SLIDER_LABELS = [
  { val: 9, label: '9' },
  { val: 8, label: '8' },
  { val: 7, label: '7' },
  { val: 6, label: '6' },
  { val: 5, label: '5' },
  { val: 4, label: '4' },
  { val: 3, label: '3' },
  { val: 2, label: '2' },
  { val: 1, label: '1' },
  { val: 1 / 2, label: '1/2' },
  { val: 1 / 3, label: '1/3' },
  { val: 1 / 4, label: '1/4' },
  { val: 1 / 5, label: '1/5' },
  { val: 1 / 6, label: '1/6' },
  { val: 1 / 7, label: '1/7' },
  { val: 1 / 8, label: '1/8' },
  { val: 1 / 9, label: '1/9' },
];

function valToSlider(v) {
  let best = 0;
  let bestDist = Infinity;
  SLIDER_LABELS.forEach((s, i) => {
    const d = Math.abs(s.val - v);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function sliderToVal(i) {
  return SLIDER_LABELS[i].val;
}

/* ───────────────────────── component ────────────────────────── */

const ProblemEditor = () => {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { currentProblem, loadProblem, updateProblem, saveProblem, loading } = useProblem();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('definition');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Local working state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [criteriaMatrix, setCriteriaMatrix] = useState([]);
  const [altMatrices, setAltMatrices] = useState({});
  const [newCriterion, setNewCriterion] = useState('');
  const [newAlternative, setNewAlternative] = useState('');

  // Sub-criteria: { criterionName: [subCrit1, subCrit2, ...] }
  const [subCriteria, setSubCriteria] = useState({});
  // Sub-criteria matrices: { criterionName: matrix }
  const [subCriteriaMatrices, setSubCriteriaMatrices] = useState({});
  // New sub-criterion input per criterion
  const [newSubCriterion, setNewSubCriterion] = useState({});
  // Track which criteria are expanded in the UI
  const [expandedCriteria, setExpandedCriteria] = useState({});
  // Alt matrices under sub-criteria: { "criterion::subCriterion": matrix }
  const [subCriteriaAltMatrices, setSubCriteriaAltMatrices] = useState({});

  // Computed results
  const [criteriaWeights, setCriteriaWeights] = useState(null);
  const [criteriaCR, setCriteriaCR] = useState(null);
  const [altWeights, setAltWeights] = useState({});
  const [altCRs, setAltCRs] = useState({});
  const [globalResults, setGlobalResults] = useState(null);
  const [computing, setComputing] = useState(false);
  const [consensusData, setConsensusData] = useState(null);

  // Sensitivity
  const [sensitivityCriterion, setSensitivityCriterion] = useState('');
  const [sensitivityData, setSensitivityData] = useState(null);

  // Participants (v1.1.5 participant participation)
  const [participantConfig, setParticipantConfig] = useState({});
  const [participantCurrentRound, setParticipantCurrentRound] = useState(1);
  const [participantRoundStatus, setParticipantRoundStatus] = useState('open');

  // LLM features
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [narratives, setNarratives] = useState(null);

  // Wizard / matrix toggle for comparisons
  const [comparisonMode, setComparisonMode] = useState('wizard'); // 'wizard' or 'matrix'

  /* ─── Load problem data ─── */
  useEffect(() => {
    if (problemId) {
      loadProblem(problemId).catch(() => setError('Failed to load problem'));
    }
  }, [problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentProblem) return;
    setTitle(currentProblem.title || '');
    setDescription(currentProblem.description || '');
    const d = currentProblem.data;
    if (d) {
      setCriteria(d.criteria || []);
      setAlternatives(d.alternatives || []);
      setCriteriaMatrix(d.criteriaMatrix || emptyMatrix((d.criteria || []).length));
      setAltMatrices(d.altMatrices || {});
      setSubCriteria(d.subCriteria || {});
      setSubCriteriaMatrices(d.subCriteriaMatrices || {});
      setSubCriteriaAltMatrices(d.subCriteriaAltMatrices || {});
      setParticipantConfig(d.config || {});
      setParticipantCurrentRound(d.currentRound || 1);
      setParticipantRoundStatus(d.roundStatus || 'open');
    } else {
      setCriteria([]);
      setAlternatives([]);
      setCriteriaMatrix([]);
      setAltMatrices({});
      setSubCriteria({});
      setSubCriteriaMatrices({});
      setSubCriteriaAltMatrices({});
      setParticipantConfig({});
      setParticipantCurrentRound(1);
      setParticipantRoundStatus('open');
    }
  }, [currentProblem]);

  /* ─── Auto-save helper ─── */
  const doSave = useCallback(async (crit, alts, cMat, aMats, subCrit, subCritMats, subCritAltMats) => {
    if (!problemId) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        problem: { title, description },
        criteria: crit,
        alternatives: alts,
        criteriaMatrix: cMat,
        altMatrices: aMats,
        subCriteria: subCrit || subCriteria,
        subCriteriaMatrices: subCritMats || subCriteriaMatrices,
        subCriteriaAltMatrices: subCritAltMats || subCriteriaAltMatrices,
      };
      await saveProblem(problemId, payload);
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [problemId, title, description, saveProblem, subCriteria, subCriteriaMatrices, subCriteriaAltMatrices]);

  const handleSave = async () => {
    // Save to server in the background
    doSave(criteria, alternatives, criteriaMatrix, altMatrices);
    // Download locally to the user's computer
    const data = {
      title,
      description,
      criteria,
      alternatives,
      criteriaMatrix,
      altMatrices,
      subCriteria,
      subCriteriaMatrices,
      subCriteriaAltMatrices,
      criteriaWeights,
      altWeights,
      globalResults,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_')}.AHP`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccess('File saved to your computer');
    setTimeout(() => setSuccess(''), 3000);
  };

  /* ─── Definition ─── */
  const handleUpdateDefinition = async () => {
    try {
      await updateProblem(problemId, { title, description });
      setSuccess('Definition updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch {
      setError('Failed to update definition');
    }
  };

  /* ─── Criteria ─── */
  const addCriterion = () => {
    const name = newCriterion.trim();
    if (!name || criteria.includes(name)) return;
    if (criteria.length >= MAX_CRITERIA) { setError(`Maximum ${MAX_CRITERIA} criteria allowed`); return; }
    const updated = [...criteria, name];
    setCriteria(updated);
    const newMat = emptyMatrix(updated.length);
    // copy old values
    for (let i = 0; i < criteriaMatrix.length; i++)
      for (let j = 0; j < criteriaMatrix.length; j++)
        newMat[i][j] = criteriaMatrix[i][j];
    setCriteriaMatrix(newMat);
    setNewCriterion('');
    doSave(updated, alternatives, newMat, altMatrices);
  };

  const removeCriterion = (idx) => {
    const updated = criteria.filter((_, i) => i !== idx);
    setCriteria(updated);
    const newMat = emptyMatrix(updated.length);
    let ri = 0;
    for (let i = 0; i < criteria.length; i++) {
      if (i === idx) continue;
      let ci = 0;
      for (let j = 0; j < criteria.length; j++) {
        if (j === idx) continue;
        newMat[ri][ci] = criteriaMatrix[i][j];
        ci++;
      }
      ri++;
    }
    setCriteriaMatrix(newMat);
    const removedName = criteria[idx];
    const newAltMats = { ...altMatrices };
    delete newAltMats[removedName];
    setAltMatrices(newAltMats);
    const newSubCrit = { ...subCriteria };
    delete newSubCrit[removedName];
    setSubCriteria(newSubCrit);
    const newSubCritMats = { ...subCriteriaMatrices };
    delete newSubCritMats[removedName];
    setSubCriteriaMatrices(newSubCritMats);
    // Clean up sub-criteria alt matrices for the removed criterion
    const newSubCritAltMats = { ...subCriteriaAltMatrices };
    Object.keys(newSubCritAltMats).forEach(key => {
      if (key.startsWith(removedName + '::')) delete newSubCritAltMats[key];
    });
    setSubCriteriaAltMatrices(newSubCritAltMats);
    doSave(updated, alternatives, newMat, newAltMats, newSubCrit, newSubCritMats, newSubCritAltMats);
  };

  /* ─── Sub-criteria ─── */
  const addSubCriterion = (criterionName) => {
    const name = (newSubCriterion[criterionName] || '').trim();
    if (!name) return;
    const existing = subCriteria[criterionName] || [];
    if (existing.includes(name)) return;
    if (existing.length >= MAX_SUB_CRITERIA) { setError(`Maximum ${MAX_SUB_CRITERIA} sub-criteria per criterion`); return; }
    const updated = [...existing, name];
    const newSubCrit = { ...subCriteria, [criterionName]: updated };
    setSubCriteria(newSubCrit);

    // Build new sub-criteria matrix
    const oldMat = subCriteriaMatrices[criterionName] || emptyMatrix(existing.length);
    const newMat = emptyMatrix(updated.length);
    for (let i = 0; i < oldMat.length; i++)
      for (let j = 0; j < oldMat.length; j++)
        newMat[i][j] = oldMat[i][j];
    const newSubCritMats = { ...subCriteriaMatrices, [criterionName]: newMat };
    setSubCriteriaMatrices(newSubCritMats);

    setNewSubCriterion({ ...newSubCriterion, [criterionName]: '' });
    doSave(criteria, alternatives, criteriaMatrix, altMatrices, newSubCrit, newSubCritMats);
  };

  const removeSubCriterion = (criterionName, idx) => {
    const removedSubName = (subCriteria[criterionName] || [])[idx];
    const existing = subCriteria[criterionName] || [];
    const updated = existing.filter((_, i) => i !== idx);
    const newSubCrit = { ...subCriteria, [criterionName]: updated };
    if (updated.length === 0) delete newSubCrit[criterionName];
    setSubCriteria(newSubCrit);

    // Rebuild sub-criteria matrix
    const oldMat = subCriteriaMatrices[criterionName] || emptyMatrix(existing.length);
    const newMat = emptyMatrix(updated.length);
    let ri = 0;
    for (let i = 0; i < existing.length; i++) {
      if (i === idx) continue;
      let ci = 0;
      for (let j = 0; j < existing.length; j++) {
        if (j === idx) continue;
        newMat[ri][ci] = oldMat[i][j];
        ci++;
      }
      ri++;
    }
    const newSubCritMats = { ...subCriteriaMatrices, [criterionName]: newMat };
    if (updated.length === 0) delete newSubCritMats[criterionName];
    setSubCriteriaMatrices(newSubCritMats);

    // Remove alt matrix for the removed sub-criterion
    const newSubCritAltMats = { ...subCriteriaAltMatrices };
    if (removedSubName) delete newSubCritAltMats[`${criterionName}::${removedSubName}`];
    setSubCriteriaAltMatrices(newSubCritAltMats);

    doSave(criteria, alternatives, criteriaMatrix, altMatrices, newSubCrit, newSubCritMats, newSubCritAltMats);
  };

  const setSubCriteriaCell = (criterionName, i, j, val) => {
    const subs = subCriteria[criterionName] || [];
    const old = subCriteriaMatrices[criterionName] || emptyMatrix(subs.length);
    const m = old.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = 1 / val;
    setSubCriteriaMatrices({ ...subCriteriaMatrices, [criterionName]: m });
  };

  const setSubCritAltCell = (criterionName, subCritName, i, j, val) => {
    const key = `${criterionName}::${subCritName}`;
    const old = subCriteriaAltMatrices[key] || emptyMatrix(alternatives.length);
    const m = old.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = 1 / val;
    setSubCriteriaAltMatrices({ ...subCriteriaAltMatrices, [key]: m });
  };

  /* ─── Alternatives ─── */
  const addAlternative = () => {
    const name = newAlternative.trim();
    if (!name || alternatives.includes(name)) return;
    if (alternatives.length >= MAX_ALTERNATIVES) { setError(`Maximum ${MAX_ALTERNATIVES} alternatives allowed`); return; }
    const updated = [...alternatives, name];
    setAlternatives(updated);
    // extend alt matrices
    const newAltMats = {};
    criteria.forEach(c => {
      const old = altMatrices[c] || emptyMatrix(alternatives.length);
      const m = emptyMatrix(updated.length);
      for (let i = 0; i < old.length; i++)
        for (let j = 0; j < old.length; j++)
          m[i][j] = old[i][j];
      newAltMats[c] = m;
    });
    setAltMatrices(newAltMats);
    // Extend sub-criteria alt matrices
    const newSubCritAltMats = { ...subCriteriaAltMatrices };
    Object.keys(newSubCritAltMats).forEach(key => {
      const old = newSubCritAltMats[key] || emptyMatrix(alternatives.length);
      const m = emptyMatrix(updated.length);
      for (let i = 0; i < old.length; i++)
        for (let j = 0; j < old.length; j++)
          m[i][j] = old[i][j];
      newSubCritAltMats[key] = m;
    });
    setSubCriteriaAltMatrices(newSubCritAltMats);
    setNewAlternative('');
    doSave(criteria, updated, criteriaMatrix, newAltMats, undefined, undefined, newSubCritAltMats);
  };

  const removeAlternative = (idx) => {
    const updated = alternatives.filter((_, i) => i !== idx);
    setAlternatives(updated);
    const newAltMats = {};
    criteria.forEach(c => {
      const old = altMatrices[c] || emptyMatrix(alternatives.length);
      const m = emptyMatrix(updated.length);
      let ri = 0;
      for (let i = 0; i < alternatives.length; i++) {
        if (i === idx) continue;
        let ci = 0;
        for (let j = 0; j < alternatives.length; j++) {
          if (j === idx) continue;
          m[ri][ci] = old[i][j];
          ci++;
        }
        ri++;
      }
      newAltMats[c] = m;
    });
    setAltMatrices(newAltMats);
    // Shrink sub-criteria alt matrices
    const newSubCritAltMats = { ...subCriteriaAltMatrices };
    Object.keys(newSubCritAltMats).forEach(key => {
      const old = newSubCritAltMats[key] || emptyMatrix(alternatives.length);
      const m = emptyMatrix(updated.length);
      let ri = 0;
      for (let ii = 0; ii < alternatives.length; ii++) {
        if (ii === idx) continue;
        let ci = 0;
        for (let jj = 0; jj < alternatives.length; jj++) {
          if (jj === idx) continue;
          m[ri][ci] = old[ii][jj];
          ci++;
        }
        ri++;
      }
      newSubCritAltMats[key] = m;
    });
    setSubCriteriaAltMatrices(newSubCritAltMats);
    doSave(criteria, updated, criteriaMatrix, newAltMats, undefined, undefined, newSubCritAltMats);
  };

  /* ─── Matrix editing ─── */
  const setCriteriaCell = (i, j, val) => {
    const m = criteriaMatrix.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = 1 / val;
    setCriteriaMatrix(m);
  };

  const setAltCell = (criterion, i, j, val) => {
    const old = altMatrices[criterion] || emptyMatrix(alternatives.length);
    const m = old.map(r => [...r]);
    m[i][j] = val;
    m[j][i] = 1 / val;
    setAltMatrices({ ...altMatrices, [criterion]: m });
  };

  /* ─── Compute ─── */
  const handleCompute = async () => {
    if (criteria.length < 2) { setError('Need at least 2 criteria'); return; }
    if (alternatives.length < 2) { setError('Need at least 2 alternatives'); return; }
    setComputing(true);
    setError('');
    try {
      let effectiveCriteriaMatrix = criteriaMatrix;
      let effectiveAltMatrices = { ...altMatrices };
      let effectiveSubCriteriaMatrices = { ...subCriteriaMatrices };
      let effectiveSubCriteriaAltMatrices = { ...subCriteriaAltMatrices };

      // 1. Criteria weights
      const cRes = await computeService.computePriorities(effectiveCriteriaMatrix);
      const cWeights = {};
      criteria.forEach((c, i) => { cWeights[c] = cRes.priorities[i]; });
      setCriteriaWeights(cWeights);

      const cCons = await computeService.computeConsistency(effectiveCriteriaMatrix);
      setCriteriaCR(cCons);

      // 2. Alt weights per criterion (with sub-criteria support)
      const aWeights = {};
      const aCRs = {};
      for (const c of criteria) {
        const subs = subCriteria[c] || [];
        if (subs.length >= 2) {
          const scMat = effectiveSubCriteriaMatrices[c] || emptyMatrix(subs.length);
          const scRes = await computeService.computePriorities(scMat);
          const scWeights = {};
          subs.forEach((sc, i) => { scWeights[sc] = scRes.priorities[i]; });

          const scCons = await computeService.computeConsistency(scMat);
          aCRs[`${c} (sub-criteria)`] = scCons;

          const effectiveAltWeights = {};
          alternatives.forEach(a => { effectiveAltWeights[a] = 0; });

          for (const sc of subs) {
            const key = `${c}::${sc}`;
            const scAltMat = effectiveSubCriteriaAltMatrices[key] || emptyMatrix(alternatives.length);
            const scAltRes = await computeService.computePriorities(scAltMat);

            const scAltCons = await computeService.computeConsistency(scAltMat);
            aCRs[`${c} > ${sc}`] = scAltCons;

            alternatives.forEach((a, i) => {
              effectiveAltWeights[a] += scWeights[sc] * scAltRes.priorities[i];
            });
          }
          aWeights[c] = effectiveAltWeights;
        } else {
          const mat = effectiveAltMatrices[c] || emptyMatrix(alternatives.length);
          const aRes = await computeService.computePriorities(mat);
          const w = {};
          alternatives.forEach((a, i) => { w[a] = aRes.priorities[i]; });
          aWeights[c] = w;

          const aCons = await computeService.computeConsistency(mat);
          aCRs[c] = aCons;
        }
      }
      setAltWeights(aWeights);
      setAltCRs(aCRs);

      // 3. Synthesize
      const synth = await computeService.synthesize(cWeights, aWeights);
      setGlobalResults(synth);

      // Save matrices too
      await doSave(criteria, alternatives, criteriaMatrix, altMatrices);

      // Auto-compute consensus if participants exist
      try {
        const consensusRes = await problemService.getConsensus(problemId);
        setConsensusData(consensusRes.consensus || null);
      } catch (consensusErr) {
        console.warn('Consensus computation skipped:', consensusErr?.response?.data?.error?.message || consensusErr.message);
      }

      setActiveTab('results');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Computation failed');
    } finally {
      setComputing(false);
    }
  };

  /* ─── Sensitivity ─── */
  const handleSensitivity = async () => {
    if (!criteriaWeights || !altWeights || !sensitivityCriterion) return;
    try {
      const data = await computeService.sensitivityAnalysis(
        criteriaWeights, altWeights, sensitivityCriterion, 20
      );
      setSensitivityData(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Sensitivity analysis failed');
    }
  };

  /* ───────────────────────── Render ───────────────────────── */
  const tabs = [
    { id: 'definition', label: 'Definition', icon: '📝' },
    { id: 'criteria', label: 'Criteria', icon: '📊' },
    { id: 'alternatives', label: 'Alternatives', icon: '🎯' },
    { id: 'participants', label: 'Participants', icon: '👥' },
    { id: 'comparisons', label: 'Comparisons', icon: '⚖️' },
    { id: 'results', label: 'Results', icon: '📈' },
    { id: 'sensitivity', label: 'Sensitivity', icon: '🔍' },
    { id: 'report', label: 'Report', icon: '📄' },
  ];

  if (loading && !currentProblem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nyu-violet mx-auto"></div>
          <p className="mt-4 text-nyu-text-secondary">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!currentProblem && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message="Problem not found" />
      </div>
    );
  }

  /* ── Matrix renderer ── */
  const renderMatrix = (items, matrix, setCell) => {
    if (items.length < 2) return <p className="text-nyu-text-secondary italic">Add at least 2 items to make comparisons.</p>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-gray-200 bg-nyu-violet text-white text-sm"></th>
              {items.map((item, j) => (
                <th key={j} className="p-2 border border-gray-200 bg-nyu-violet text-white text-sm font-medium">{item}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((rowItem, i) => (
              <tr key={i}>
                <td className="p-2 border border-gray-200 bg-nyu-violet-ultra font-medium text-sm">{rowItem}</td>
                {items.map((colItem, j) => {
                  if (i === j) {
                    return <td key={j} className="p-2 border border-gray-200 bg-gray-100 text-center text-sm font-mono">1</td>;
                  }
                  if (i > j) {
                    return <td key={j} className="p-2 border border-gray-200 bg-gray-50 text-center text-sm font-mono text-gray-500">{formatValue(matrix[i]?.[j] || 1)}</td>;
                  }
                  const val = matrix[i]?.[j] || 1;
                  const sliderIdx = valToSlider(val);
                  // Map slider 0..16 to display -8..+8 where negative = row preferred, positive = column preferred
                  const displayVal = sliderIdx - 8;
                  const label = displayVal < 0
                    ? `← ${SLIDER_LABELS[sliderIdx].label} (${rowItem})`
                    : displayVal > 0
                      ? `${SLIDER_LABELS[sliderIdx].label} (${colItem}) →`
                      : '1 (Equal)';
                  return (
                    <td key={j} className="p-2 border border-gray-200 text-center">
                      <div className="flex flex-col items-center gap-1 min-w-[160px]">
                        <span className={`text-xs font-semibold ${displayVal < 0 ? 'text-blue-700' : displayVal > 0 ? 'text-orange-700' : 'text-gray-600'}`}>
                          {label}
                        </span>
                        <div className="flex items-center gap-1 w-full">
                          <span className="text-[10px] text-blue-600 whitespace-nowrap">◀ Row</span>
                          <input
                            type="range"
                            min={0}
                            max={16}
                            value={sliderIdx}
                            onChange={e => setCell(i, j, sliderToVal(Number(e.target.value)))}
                            className="flex-1 accent-nyu-violet"
                          />
                          <span className="text-[10px] text-orange-600 whitespace-nowrap">Col ▶</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {formatValue(val)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-nyu-text-primary mb-1">
            {currentProblem?.title || 'Untitled Problem'}
          </h2>
          {currentProblem?.description && (
            <p className="text-nyu-text-secondary">{currentProblem.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm text-nyu-text-secondary">Saving…</span>}
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewPanelOpen(true)}
            disabled={criteria.length === 0 || alternatives.length === 0}
            title="Get AI-powered feedback on your problem structure."
          >
            🔍 Review My Setup
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>Save</Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-nyu-violet text-white'
                  : 'text-nyu-text-secondary hover:bg-nyu-violet-ultra'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="card min-h-[500px]">

        {/* ──────────── DEFINITION TAB ──────────── */}
        {activeTab === 'definition' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">Problem Definition</h3>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-nyu-text-primary mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input w-full"
                  placeholder="Decision problem title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-nyu-text-primary mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="input w-full"
                  placeholder="Describe the decision goal…"
                />
              </div>
              <Button onClick={handleUpdateDefinition}>Update Definition</Button>
            </div>
          </div>
        )}

        {/* ──────────── CRITERIA TAB ──────────── */}
        {activeTab === 'criteria' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-2">Criteria</h3>
            <p className="text-nyu-text-secondary mb-4">
              Add your decision criteria (up to {MAX_CRITERIA}). These are the factors by which alternatives will be judged.
            </p>

            {/* Add form */}
            <div className="flex gap-2 mb-6 max-w-md">
              <input
                type="text"
                value={newCriterion}
                onChange={e => setNewCriterion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCriterion()}
                className="input flex-1"
                placeholder="Criterion name"
                maxLength={60}
              />
              <Button onClick={addCriterion} disabled={!newCriterion.trim() || criteria.length >= MAX_CRITERIA}>Add</Button>
            </div>

            {/* List */}
            {criteria.length === 0 ? (
              <p className="text-gray-400 italic">No criteria added yet.</p>
            ) : (
              <ul className="space-y-3 max-w-lg">
                {criteria.map((c, i) => {
                  const subs = subCriteria[c] || [];
                  const isExpanded = expandedCriteria[c];
                  return (
                    <li key={i}>
                      <div className="flex items-center justify-between bg-nyu-violet-ultra rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedCriteria({ ...expandedCriteria, [c]: !isExpanded })}
                            className="text-nyu-violet hover:text-nyu-violet-dark text-sm font-bold w-6"
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                          <span className="font-medium text-nyu-text-primary">{i + 1}. {c}</span>
                          {subs.length > 0 && (
                            <span className="text-xs text-nyu-text-secondary">({subs.length} sub-criteria)</span>
                          )}
                        </div>
                        <button onClick={() => removeCriterion(i)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                      </div>

                      {isExpanded && (
                        <div className="ml-8 mt-2 space-y-2">
                          {subs.map((sc, si) => (
                            <div key={si} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                              <span className="text-sm text-nyu-text-primary">{i + 1}.{si + 1} {sc}</span>
                              <button onClick={() => removeSubCriterion(c, si)} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                            </div>
                          ))}
                          {subs.length < MAX_SUB_CRITERIA && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSubCriterion[c] || ''}
                                onChange={e => setNewSubCriterion({ ...newSubCriterion, [c]: e.target.value })}
                                onKeyDown={e => e.key === 'Enter' && addSubCriterion(c)}
                                className="input flex-1 text-sm"
                                placeholder={`Add sub-criterion under "${c}"`}
                                maxLength={60}
                              />
                              <Button size="sm" onClick={() => addSubCriterion(c)} disabled={!(newSubCriterion[c] || '').trim()}>Add</Button>
                            </div>
                          )}
                          <p className="text-xs text-nyu-text-secondary">{subs.length}/{MAX_SUB_CRITERIA} sub-criteria</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-sm text-nyu-text-secondary">{criteria.length}/{MAX_CRITERIA} criteria</p>
          </div>
        )}

        {/* ──────────── ALTERNATIVES TAB ──────────── */}
        {activeTab === 'alternatives' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-2">Alternatives</h3>
            <p className="text-nyu-text-secondary mb-4">
              Add the alternatives you are evaluating (up to {MAX_ALTERNATIVES}).
            </p>

            <div className="flex gap-2 mb-6 max-w-md">
              <input
                type="text"
                value={newAlternative}
                onChange={e => setNewAlternative(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAlternative()}
                className="input flex-1"
                placeholder="Alternative name"
                maxLength={60}
              />
              <Button onClick={addAlternative} disabled={!newAlternative.trim() || alternatives.length >= MAX_ALTERNATIVES}>Add</Button>
            </div>

            {alternatives.length === 0 ? (
              <p className="text-gray-400 italic">No alternatives added yet.</p>
            ) : (
              <ul className="space-y-2 max-w-md">
                {alternatives.map((a, i) => (
                  <li key={i} className="flex items-center justify-between bg-nyu-violet-ultra rounded-lg px-4 py-3">
                    <span className="font-medium text-nyu-text-primary">{i + 1}. {a}</span>
                    <button onClick={() => removeAlternative(i)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-nyu-text-secondary">{alternatives.length}/{MAX_ALTERNATIVES} alternatives</p>
          </div>
        )}

        {/* ──────────── PARTICIPANTS TAB ──────────── */}
        {activeTab === 'participants' && problemId && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              💡 You can add yourself as a participant if you also want to provide comparisons, or use this purely to collect input from others.
            </div>
            <ParticipantManager
              problemId={problemId}
              config={participantConfig}
              currentRound={participantCurrentRound}
              roundStatus={participantRoundStatus}
              onDataChange={() => loadProblem(problemId)}
              ownerName={user?.fullName || user?.username}
              ownerEmail={user?.email}
              problemTitle={title}
              criteriaNames={criteria}
              alternativeNames={alternatives}
            />
          </div>
        )}
        {activeTab === 'participants' && !problemId && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-nyu-text-secondary">Save the problem first to manage participants.</p>
          </div>
        )}

        {/* ──────────── COMPARISONS TAB ──────────── */}
        {activeTab === 'comparisons' && (() => {
          const participants = currentProblem?.data?.participants || [];
          const ownerEmail = user?.email?.toLowerCase();
          const ownerName = user?.fullName?.toLowerCase() || user?.username?.toLowerCase();
          const isOwnerParticipant = participants.some(p =>
            (ownerEmail && p.email?.toLowerCase() === ownerEmail) ||
            (ownerName && p.name?.toLowerCase() === ownerName)
          );

          if (!isOwnerParticipant) {
            return (
              <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-4xl mb-4">🔒</p>
                <h3 className="text-xl font-semibold text-nyu-text-primary mb-2">Comparisons Locked</h3>
                <p className="text-nyu-text-secondary mb-4">
                  To make pairwise comparisons, add yourself as a participant first.
                </p>
                <Button onClick={() => setActiveTab('participants')}>Go to Participants</Button>
              </div>
            );
          }

          return (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-nyu-text-primary">Pairwise Comparisons</h3>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setComparisonMode('wizard')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${comparisonMode === 'wizard' ? 'bg-nyu-violet text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    🧙 Wizard
                  </button>
                  <button
                    onClick={() => setComparisonMode('matrix')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${comparisonMode === 'matrix' ? 'bg-nyu-violet text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    📊 Matrix
                  </button>
                </div>
              </div>

            <p className="text-nyu-text-secondary mb-1">
              {comparisonMode === 'wizard'
                ? 'Compare items one pair at a time. Use the slider to indicate preference and intensity.'
                : 'Use sliders to compare items using Saaty\'s 1–9 scale.'}
            </p>
            <p className="text-xs text-nyu-text-secondary mb-6">
              1 = Equal &nbsp;|&nbsp; 3 = Moderate &nbsp;|&nbsp; 5 = Strong &nbsp;|&nbsp; 7 = Very Strong &nbsp;|&nbsp; 9 = Extreme
            </p>

            {criteria.length < 2 || alternatives.length < 2 ? (
              <Alert type="warning" message="Add at least 2 criteria and 2 alternatives before making comparisons." />
            ) : comparisonMode === 'wizard' ? (
              /* ── WIZARD MODE ── */
              <WizardComparisons
                criteria={criteria}
                alternatives={alternatives}
                subCriteria={subCriteria}
                criteriaMatrix={criteriaMatrix}
                altMatrices={altMatrices}
                subCriteriaMatrices={subCriteriaMatrices}
                subCriteriaAltMatrices={subCriteriaAltMatrices}
                onCriteriaCellChange={setCriteriaCell}
                onAltCellChange={setAltCell}
                onSubCriteriaCellChange={setSubCriteriaCell}
                onSubCritAltCellChange={setSubCritAltCell}
                onSave={() => doSave(criteria, alternatives, criteriaMatrix, altMatrices)}
                onCompute={handleCompute}
                saving={saving}
                computing={computing}
                emptyMatrix={emptyMatrix}
              />
            ) : (
              /* ── MATRIX MODE ── */
              <>
                {/* Criteria vs criteria */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">Criteria Comparison</h4>
                  {renderMatrix(criteria, criteriaMatrix, setCriteriaCell)}
                </div>

                {/* Sub-criteria comparisons */}
                {criteria.map(c => {
                  const subs = subCriteria[c] || [];
                  if (subs.length < 2) return null;
                  return (
                    <div key={`sub-${c}`} className="mb-8">
                      <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">
                        Sub-criteria under <span className="text-nyu-violet">"{c}"</span>
                      </h4>
                      {renderMatrix(
                        subs,
                        subCriteriaMatrices[c] || emptyMatrix(subs.length),
                        (i, j, val) => setSubCriteriaCell(c, i, j, val)
                      )}
                    </div>
                  );
                })}

                {/* Alternatives per criterion (or per sub-criterion when sub-criteria exist) */}
                {criteria.map(c => {
                  const subs = subCriteria[c] || [];
                  if (subs.length >= 2) {
                    // Show alt comparisons per sub-criterion
                    return subs.map(sc => (
                      <div key={`${c}::${sc}`} className="mb-8">
                        <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">
                          Alternatives w.r.t. <span className="text-nyu-violet">"{c}" &gt; "{sc}"</span>
                        </h4>
                        {renderMatrix(
                          alternatives,
                          subCriteriaAltMatrices[`${c}::${sc}`] || emptyMatrix(alternatives.length),
                          (i, j, val) => setSubCritAltCell(c, sc, i, j, val)
                        )}
                      </div>
                    ));
                  }
                  // No sub-criteria: compare alternatives directly
                  return (
                    <div key={c} className="mb-8">
                      <h4 className="text-lg font-semibold text-nyu-text-primary mb-3">
                        Alternatives w.r.t. <span className="text-nyu-violet">"{c}"</span>
                      </h4>
                      {renderMatrix(
                        alternatives,
                        altMatrices[c] || emptyMatrix(alternatives.length),
                        (i, j, val) => setAltCell(c, i, j, val)
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-3 mt-4">
                  <Button onClick={handleSave} variant="outline" disabled={saving}>Save Comparisons</Button>
                  <Button onClick={handleCompute} disabled={computing}>
                    {computing ? 'Computing…' : 'Compute Results'}
                  </Button>
                </div>
              </>
            )}
          </div>
          );
        })()}

        {/* ──────────── RESULTS TAB ──────────── */}
        {activeTab === 'results' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">Analysis Results</h3>

            {!globalResults ? (() => {
              const participants = currentProblem?.data?.participants || [];
              const currentRound = currentProblem?.data?.currentRound || 1;
              const roundKey = String(currentRound);
              const completedCount = participants.filter(p => p.roundData?.[roundKey]?.status === 'completed').length;

              if (problemId && completedCount > 0) {
                return (
                  <div className="text-center py-12">
                    <p className="text-nyu-text-secondary mb-2">
                      {completedCount} participant{completedCount !== 1 ? 's have' : ' has'} submitted comparisons.
                    </p>
                    <p className="text-nyu-text-secondary mb-4 text-sm">
                      Compute aggregated results from participant submissions, or complete your own comparisons first.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Button
                        disabled={computing}
                        onClick={async () => {
                          setComputing(true);
                          setError('');
                          try {
                            const res = await problemService.getAggregateResults(problemId);
                            setCriteriaWeights(res.criteriaWeights);
                            setCriteriaCR(res.criteriaCR);
                            setAltWeights(res.altWeights);
                            setAltCRs(res.altCRs);
                            setGlobalResults(res.globalResults);
                            setConsensusData(res.consensus);
                          } catch (err) {
                            setError(err.response?.data?.error?.message || 'Failed to compute aggregate results');
                          } finally {
                            setComputing(false);
                          }
                        }}
                      >
                        {computing ? 'Computing…' : `Compute from ${completedCount} Participant${completedCount !== 1 ? 's' : ''}`}
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('comparisons')}>
                        Do My Own Comparisons
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="text-center py-12">
                  <p className="text-nyu-text-secondary mb-4">No results computed yet. Complete your comparisons or invite participants first.</p>
                  <div className="flex justify-center gap-3">
                    <Button onClick={() => setActiveTab('comparisons')}>Go to Comparisons</Button>
                    {problemId && (
                      <Button variant="outline" onClick={() => setActiveTab('participants')}>Invite Participants</Button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="space-y-8">
                {/* Criteria Weights */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Criteria Weights</h4>
                  {criteriaCR && (
                    <p className={`text-sm mb-2 ${criteriaCR.isConsistent ? 'text-green-700' : 'text-red-700'}`}>
                      Consistency Ratio (CR) = {(criteriaCR.cr * 100).toFixed(2)}% — {criteriaCR.isConsistent ? '✓ Consistent' : '✗ Inconsistent (> 10%)'}
                    </p>
                  )}
                  <div className="space-y-2 max-w-lg">
                    {criteria.map((c, i) => {
                      const w = criteriaWeights?.[c] || 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-32 text-sm font-medium truncate">{c}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-5 relative">
                            <div
                              className="h-5 rounded-full"
                              style={{ width: `${(w * 100).toFixed(1)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                          <span className="w-16 text-sm text-right font-mono">{(w * 100).toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Alt weights per criterion */}
                {criteria.map(c => (
                  <div key={c}>
                    <h4 className="text-md font-semibold mb-1">Alternatives w.r.t. "{c}"</h4>
                    {altCRs[c] && (
                      <p className={`text-xs mb-2 ${altCRs[c].isConsistent ? 'text-green-700' : 'text-red-700'}`}>
                        CR = {(altCRs[c].cr * 100).toFixed(2)}% — {altCRs[c].isConsistent ? '✓' : '✗ Inconsistent'}
                      </p>
                    )}
                    <div className="space-y-1 max-w-lg">
                      {alternatives.map((a, i) => {
                        const w = altWeights[c]?.[a] || 0;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-32 text-sm truncate">{a}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                              <div className="h-4 rounded-full" style={{ width: `${(w * 100).toFixed(1)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            </div>
                            <span className="w-16 text-sm text-right font-mono">{(w * 100).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Global ranking */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Final Ranking (Global Priorities)</h4>
                  <div className="space-y-2 max-w-lg">
                    {Object.entries(globalResults.normalized || {})
                      .sort(([, a], [, b]) => b - a)
                      .map(([alt, w], i) => (
                        <div key={alt} className="flex items-center gap-3">
                          <span className="w-8 text-lg font-bold text-nyu-violet">#{i + 1}</span>
                          <span className="w-32 text-sm font-medium truncate">{alt}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div
                              className="h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(w * 100).toFixed(1)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            >
                              <span className="text-xs text-white font-semibold">{(w * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Consensus (Kendall's W) — shown when participants exist */}
                {problemId && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">Consensus (Kendall&apos;s W)</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const res = await problemService.getConsensus(problemId);
                            setConsensusData(res.consensus || null);
                            if (!res.consensus) {
                              setError(res.message || 'At least 2 completed participants needed for consensus.');
                            }
                          } catch (err) {
                            setError(err?.response?.data?.error?.message || 'Failed to compute consensus');
                          }
                        }}
                      >
                        {consensusData ? 'Refresh' : 'Compute Consensus'}
                      </Button>
                    </div>
                    {consensusData ? (
                      <div className="space-y-2">
                        {consensusData.criteria && (
                          <ConsensusDisplay label="Main Criteria" data={consensusData.criteria} />
                        )}
                        {consensusData.alternatives && Object.entries(consensusData.alternatives).map(([crit, data]) => (
                          <ConsensusDisplay key={crit} label={`Alternatives w.r.t. ${crit}`} data={data} />
                        ))}
                        {consensusData.global && (
                          <ConsensusDisplay label="Global Alternatives" data={consensusData.global} />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">At least 2 participants must submit their comparisons before consensus can be measured. Click "Compute Consensus" after participants have submitted.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──────────── SENSITIVITY TAB ──────────── */}
        {activeTab === 'sensitivity' && (
          <div>
            <h3 className="text-xl font-semibold text-nyu-text-primary mb-4">Sensitivity Analysis</h3>

            {!criteriaWeights ? (
              <div className="text-center py-12">
                <p className="text-nyu-text-secondary mb-4">Compute results first to run sensitivity analysis.</p>
                <Button onClick={() => setActiveTab('comparisons')}>Go to Comparisons</Button>
              </div>
            ) : (
              <>
                <div className="flex gap-3 items-end mb-6 max-w-md">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-nyu-text-primary mb-1">Criterion to Vary</label>
                    <select
                      value={sensitivityCriterion}
                      onChange={e => setSensitivityCriterion(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Select a criterion…</option>
                      {criteria.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <Button onClick={handleSensitivity} disabled={!sensitivityCriterion}>Analyze</Button>
                </div>

                {sensitivityData && (
                  <div>
                    <h4 className="text-md font-semibold mb-3">
                      Rankings as "{sensitivityCriterion}" weight varies from 0 to 1
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="p-2 border border-gray-200 bg-nyu-violet text-white">Weight</th>
                            {alternatives.map(a => (
                              <th key={a} className="p-2 border border-gray-200 bg-nyu-violet text-white">{a}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(sensitivityData.dataPoints || []).map((dp, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-2 border border-gray-200 font-mono text-center">{(dp.weight * 100).toFixed(0)}%</td>
                              {alternatives.map(a => (
                                <td key={a} className="p-2 border border-gray-200 font-mono text-center">
                                  {((dp.priorities?.[a] || 0) * 100).toFixed(1)}%
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sensitivityData.rankReversals && sensitivityData.rankReversals.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="font-semibold text-yellow-800 mb-1">Rank Reversals Detected</p>
                        {sensitivityData.rankReversals.map((rr, i) => (
                          <p key={i} className="text-sm text-yellow-700">
                            At weight {(rr.weight * 100).toFixed(0)}%: {rr.description || `${rr.alternative1} and ${rr.alternative2} swap positions`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ──────────── REPORT TAB ──────────── */}
        {activeTab === 'report' && (
          <div>
            {problemId && globalResults && (
              <NarrativePreview
                problemId={problemId}
                contextPayload={{
                  problemTitle: title,
                  problemDescription: description,
                  criteria,
                  alternatives,
                  criteriaWeights,
                  globalRankings: globalResults.globalPriorities,
                  criteriaCR,
                  altCRs,
                  sensitivityData,
                  consensus: consensusData,
                }}
                onNarrativesReady={setNarratives}
              />
            )}
            <DecisionReport
              title={title}
              description={description}
              criteria={criteria}
              alternatives={alternatives}
              subCriteria={subCriteria}
              criteriaWeights={criteriaWeights}
              criteriaCR={criteriaCR}
              altWeights={altWeights}
              altCRs={altCRs}
              globalResults={globalResults}
              sensitivityData={sensitivityData}
              sensitivityCriterion={sensitivityCriterion}
              consensus={consensusData}
              anonymousMode={participantConfig.anonymousMode}
              currentRound={participantCurrentRound}
              narratives={narratives}
            />
          </div>
        )}
      </div>

      {/* Setup Review Panel */}
      {problemId && (
        <SetupReviewPanel
          problemId={problemId}
          problemData={{
            title,
            description,
            criteria,
            alternatives,
            subCriteria,
          }}
          isOpen={reviewPanelOpen}
          onClose={() => setReviewPanelOpen(false)}
        />
      )}
    </div>
  );
};

/* ───────────────────────── WizardComparisons ───────────────────────── */
/**
 * Sub-component that walks through all comparison groups in wizard mode.
 * Groups: criteria matrix, sub-criteria matrices, alt matrices per criterion/sub-criterion.
 */
const WizardComparisons = ({
  criteria, alternatives, subCriteria,
  criteriaMatrix, altMatrices, subCriteriaMatrices, subCriteriaAltMatrices,
  onCriteriaCellChange, onAltCellChange, onSubCriteriaCellChange, onSubCritAltCellChange,
  onSave, onCompute, saving, computing, emptyMatrix,
}) => {
  const [groupIdx, setGroupIdx] = React.useState(0);

  // Build ordered list of comparison groups
  const groups = React.useMemo(() => {
    const g = [];

    // 1. Criteria comparison
    if (criteria.length >= 2) {
      g.push({
        key: 'criteria',
        label: 'Criteria Comparison',
        question: 'Which criteria matter most for your decision?',
        description: 'Compare how important each criterion is relative to the others.',
        items: criteria,
        matrix: criteriaMatrix,
        onCellChange: (i, j, val) => onCriteriaCellChange(i, j, val),
      });
    }

    // 2. Sub-criteria and alt comparisons per criterion
    criteria.forEach(c => {
      const subs = subCriteria[c] || [];
      if (subs.length >= 2) {
        g.push({
          key: `sub-${c}`,
          label: `Sub-criteria under "${c}"`,
          question: `Which aspects of "${c}" matter most?`,
          description: `Compare the sub-criteria within "${c}" to determine their relative importance.`,
          items: subs,
          matrix: subCriteriaMatrices[c] || emptyMatrix(subs.length),
          onCellChange: (i, j, val) => onSubCriteriaCellChange(c, i, j, val),
        });
        subs.forEach(sc => {
          g.push({
            key: `${c}::${sc}`,
            label: `Alternatives w.r.t. "${c}" > "${sc}"`,
            question: `Considering "${sc}", which option is best?`,
            description: `Compare the alternatives based on "${sc}" (a sub-criterion of "${c}").`,
            items: alternatives,
            matrix: subCriteriaAltMatrices[`${c}::${sc}`] || emptyMatrix(alternatives.length),
            onCellChange: (i, j, val) => onSubCritAltCellChange(c, sc, i, j, val),
          });
        });
      } else if (alternatives.length >= 2) {
        g.push({
          key: `alt-${c}`,
          label: `Alternatives w.r.t. "${c}"`,
          question: `Considering "${c}", which option is best?`,
          description: `Compare the alternatives based specifically on how they perform on "${c}".`,
          items: alternatives,
          matrix: altMatrices[c] || emptyMatrix(alternatives.length),
          onCellChange: (i, j, val) => onAltCellChange(c, i, j, val),
        });
      }
    });

    return g;
  }, [criteria, alternatives, subCriteria, criteriaMatrix, altMatrices, subCriteriaMatrices, subCriteriaAltMatrices, emptyMatrix, onCriteriaCellChange, onAltCellChange, onSubCriteriaCellChange, onSubCritAltCellChange]);

  if (groups.length === 0) {
    return <p className="text-nyu-text-secondary italic">Add at least 2 criteria and 2 alternatives to begin comparisons.</p>;
  }

  const currentGroup = groups[Math.min(groupIdx, groups.length - 1)];
  const isLastGroup = groupIdx >= groups.length - 1;

  return (
    <div>
      {/* Group progress */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-nyu-text-secondary">
          Step {Math.min(groupIdx, groups.length - 1) + 1} of {groups.length}: {currentGroup.question || currentGroup.label}
        </span>
        <div className="flex gap-1">
          {groups.map((g, idx) => (
            <button
              key={g.key}
              onClick={() => setGroupIdx(idx)}
              className={`h-2 rounded-full transition-colors ${idx === groupIdx ? 'w-6 bg-nyu-violet' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
              title={g.label}
            />
          ))}
        </div>
      </div>

      <HierarchyMap
        criteria={criteria}
        subCriteria={subCriteria}
        alternatives={alternatives}
        activeGroupKey={currentGroup.key}
      />

      <ComparisonWizard
        key={currentGroup.key}
        items={currentGroup.items}
        matrix={currentGroup.matrix}
        onCellChange={currentGroup.onCellChange}
        contextLabel={currentGroup.question || currentGroup.label}
        contextDescription={currentGroup.description}
        onComplete={() => {
          if (isLastGroup) {
            // All done
          } else {
            setGroupIdx(groupIdx + 1);
          }
        }}
      />

      {/* Group navigation + actions */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => setGroupIdx(Math.max(0, groupIdx - 1))}
          disabled={groupIdx === 0}
        >
          ← Previous Step
        </Button>
        <div className="flex gap-3">
          <Button onClick={onSave} variant="outline" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {isLastGroup && (
            <Button onClick={onCompute} disabled={computing}>
              {computing ? 'Computing…' : 'Compute Results'}
            </Button>
          )}
          {!isLastGroup && (
            <Button onClick={() => setGroupIdx(groupIdx + 1)}>
              Next Step →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── ConsensusDisplay ───────────────────────── */

const CONSENSUS_LABELS = [
  { min: 0, max: 0.2, label: 'Very Low Agreement', cls: 'text-red-700 bg-red-100' },
  { min: 0.2, max: 0.4, label: 'Low Agreement', cls: 'text-orange-700 bg-orange-100' },
  { min: 0.4, max: 0.6, label: 'Moderate Agreement', cls: 'text-yellow-700 bg-yellow-100' },
  { min: 0.6, max: 0.8, label: 'High Agreement', cls: 'text-green-700 bg-green-100' },
  { min: 0.8, max: 1.01, label: 'Very High Agreement', cls: 'text-emerald-700 bg-emerald-100' },
];

const ConsensusDisplay = ({ label, data }) => {
  if (!data || data.W === undefined) return null;
  const info = CONSENSUS_LABELS.find(l => data.W >= l.min && data.W < l.max) || CONSENSUS_LABELS[0];
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">W = {data.W.toFixed(3)}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>
        <span className="text-xs text-gray-500">χ²={data.chiSquared?.toFixed(2)} p={data.pValue?.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default ProblemEditor;
