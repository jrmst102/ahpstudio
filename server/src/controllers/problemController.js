const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const storageService = require('../services/storageService');
const ahpEngine = require('../services/ahpEngine');
const userService = require('../services/userService');
const { loadTokenIndex, saveTokenIndex } = require('./participationController');

/**
 * Check if the problem has real comparisons (criteria matrix has non-identity values).
 */
function hasCompletedComparisons(data) {
  const mat = data.criteriaMatrix;
  if (!mat || !Array.isArray(mat) || mat.length < 2) return false;
  for (let i = 0; i < mat.length; i++) {
    for (let j = 0; j < mat[i].length; j++) {
      if (i !== j && mat[i][j] !== 1) return true;
    }
  }
  return false;
}

// Problem index key per user – stores metadata for all their problems
function indexKey(userId) {
  return `users/${userId}/problems/index.json`;
}

async function loadIndex(userId) {
  const data = await storageService.getJSON(indexKey(userId));
  return data || [];
}

async function saveIndex(userId, problems) {
  await storageService.putJSON(indexKey(userId), problems);
}

// ── Controllers ───────────────────────────────────────────────────────

async function createProblem(req, res) {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: { message: 'Problem title is required' } });
    }

    const problems = await loadIndex(req.user.id);
    const now = new Date().toISOString();
    const problem = {
      id: uuidv4(),
      userId: req.user.id,
      title,
      description: description || '',
      fileKey: null,
      createdAt: now,
      updatedAt: now,
    };

    problems.push(problem);
    await saveIndex(req.user.id, problems);

    res.status(201).json({ problem });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ error: { message: 'Failed to create problem' } });
  }
}

async function listProblems(req, res) {
  try {
    const problems = await loadIndex(req.user.id);
    problems.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ problems });
  } catch (error) {
    console.error('List problems error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve problems' } });
  }
}

async function getProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    let problem = problems.find(p => p.id === id);

    if (!problem && req.user.role === 'ADMIN') {
      // Admin may access another user's problem – not supported in flat index
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    let problemData = null;
    if (problem.fileKey) {
      try {
        problemData = await storageService.downloadProblemFile(problem.fileKey);
      } catch (err) {
        console.error('Error loading problem file:', err);
      }
    }

    res.json({ problem: { ...problem, data: problemData } });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ error: { message: 'Failed to retrieve problem' } });
  }
}

async function updateProblem(req, res) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const problems = await loadIndex(req.user.id);
    const idx = problems.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    if (title) problems[idx].title = title;
    if (description !== undefined) problems[idx].description = description;
    problems[idx].updatedAt = new Date().toISOString();

    await saveIndex(req.user.id, problems);
    res.json({ problem: problems[idx] });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ error: { message: 'Failed to update problem' } });
  }
}

async function deleteProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    const problem = problems.find(p => p.id === id);
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    if (problem.fileKey) {
      try {
        await storageService.deleteProblemFile(problem.fileKey);
      } catch (err) {
        console.error('Error deleting problem file:', err);
      }
    }

    await saveIndex(req.user.id, problems.filter(p => p.id !== id));
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ error: { message: 'Failed to delete problem' } });
  }
}

async function saveProblem(req, res) {
  try {
    const { id } = req.params;
    const incoming = req.body;
    const problems = await loadIndex(req.user.id);
    const idx = problems.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }

    // Merge with existing file to preserve participant data not sent by the client
    let problemData = incoming;
    const existing = await loadProblemFile(req.user.id, id);
    if (existing) {
      const preserveKeys = ['participants', 'config', 'currentRound', 'roundStatus'];
      for (const key of preserveKeys) {
        if (existing[key] !== undefined && incoming[key] === undefined) {
          problemData[key] = existing[key];
        }
      }
    }

    // If the owner has a participant record and comparisons exist, mark them completed
    if (problemData.participants?.length > 0 && hasCompletedComparisons(problemData)) {
      const user = await userService.findUserById(req.user.id);
      const ownerNames = [req.user.username, user?.fullName].filter(Boolean).map(n => n.toLowerCase());
      const currentRound = String(problemData.currentRound || 1);

      for (const p of problemData.participants) {
        if (ownerNames.includes(p.name?.toLowerCase())) {
          if (!p.roundData) p.roundData = {};
          if (!p.roundData[currentRound]) p.roundData[currentRound] = {};
          if (p.roundData[currentRound].status !== 'completed') {
            p.roundData[currentRound].status = 'completed';
            p.roundData[currentRound].completedAt = new Date().toISOString();
          }
          break;
        }
      }
    }

    const fileKey = await storageService.uploadProblemFile(req.user.id, id, problemData);
    problems[idx].fileKey = fileKey;
    problems[idx].updatedAt = new Date().toISOString();
    await saveIndex(req.user.id, problems);

    res.json({ message: 'Problem saved successfully', fileKey });
  } catch (error) {
    console.error('Save problem error:', error);
    res.status(500).json({ error: { message: 'Failed to save problem' } });
  }
}

async function downloadProblem(req, res) {
  try {
    const { id } = req.params;
    const problems = await loadIndex(req.user.id);
    const problem = problems.find(p => p.id === id);
    if (!problem) {
      return res.status(404).json({ error: { message: 'Problem not found' } });
    }
    if (!problem.fileKey) {
      return res.status(404).json({ error: { message: 'Problem file not found' } });
    }

    const url = await storageService.getSignedUrl(problem.fileKey);
    res.json({ downloadUrl: url });
  } catch (error) {
    console.error('Download problem error:', error);
    res.status(500).json({ error: { message: 'Failed to download problem' } });
  }
}

async function uploadProblem(req, res) {
  try {
    const { problemData } = req.body;
    if (!problemData) {
      return res.status(400).json({ error: { message: 'Problem data is required' } });
    }
    if (!problemData.problem || !problemData.problem.title) {
      return res.status(400).json({ error: { message: 'Invalid .AHP file format' } });
    }

    const problems = await loadIndex(req.user.id);
    const now = new Date().toISOString();
    const problem = {
      id: uuidv4(),
      userId: req.user.id,
      title: problemData.problem.title,
      description: problemData.problem.description || '',
      fileKey: null,
      createdAt: now,
      updatedAt: now,
    };

    const fileKey = await storageService.uploadProblemFile(req.user.id, problem.id, problemData);
    problem.fileKey = fileKey;

    problems.push(problem);
    await saveIndex(req.user.id, problems);

    res.status(201).json({ message: 'Problem imported successfully', problem });
  } catch (error) {
    console.error('Upload problem error:', error);
    res.status(500).json({ error: { message: 'Failed to import problem' } });
  }
}

/* ───────────────── Helpers ───────────────── */

const MAX_PARTICIPANTS = 12;
const ANONYMOUS_LABELS = 'ABCDEFGHIJKL'.split('');

function generatePin() {
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

async function loadProblemFile(userId, problemId) {
  const problems = await loadIndex(userId);
  const problem = problems.find(p => p.id === problemId);
  if (!problem || !problem.fileKey) return null;
  return storageService.getJSON(problem.fileKey);
}

async function saveProblemFile(userId, problemId, data) {
  return storageService.uploadProblemFile(userId, problemId, data);
}

/* ───────────────── Participant Management ───────────────── */

async function listParticipants(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const participants = (data.participants || []).map(p => {
      const currentRound = data.currentRound || 1;
      const rd = p.roundData?.[String(currentRound)] || {};
      return {
        id: p.id,
        name: data.config?.anonymousMode ? p.anonymousLabel : p.name,
        email: data.config?.anonymousMode ? undefined : p.email,
        weight: p.weight,
        anonymousLabel: p.anonymousLabel,
        status: rd.status || 'not_started',
        lastActivity: rd.lastActivity || null,
        completedAt: rd.completedAt || null,
        token: p.token,
        hasPin: !!p.pinHash,
      };
    });

    res.json({ participants, config: data.config || {} });
  } catch (error) {
    console.error('List participants error:', error);
    res.status(500).json({ error: { message: 'Failed to list participants' } });
  }
}

async function addParticipant(req, res) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: { message: 'Name is required' } });
    }

    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const participants = data.participants || [];
    if (participants.length >= MAX_PARTICIPANTS) {
      return res.status(400).json({ error: { message: `Maximum ${MAX_PARTICIPANTS} participants allowed` } });
    }

    if (participants.some(p => p.name === name.trim())) {
      return res.status(400).json({ error: { message: 'A participant with that name already exists' } });
    }

    const token = uuidv4();
    const pinProtection = data.config?.pinProtection || false;
    let pin = null;
    let pinHash = null;

    if (pinProtection) {
      pin = generatePin();
      pinHash = await bcrypt.hash(pin, 10);
    }

    // Assign anonymous label (shuffle-resistant: use next available letter)
    const usedLabels = new Set(participants.map(p => p.anonymousLabel));
    let anonymousLabel = 'Participant';
    for (const letter of ANONYMOUS_LABELS) {
      const label = `Participant ${letter}`;
      if (!usedLabels.has(label)) {
        anonymousLabel = label;
        break;
      }
    }

    const participant = {
      id: uuidv4(),
      name: name.trim(),
      email: email?.trim() || null,
      token,
      pinHash,
      weight: 1.0,
      anonymousLabel,
      roundData: {},
    };

    if (!data.participants) data.participants = [];
    data.participants.push(participant);

    // Initialize config if needed
    if (!data.config) data.config = { anonymousMode: false, pinProtection: false, delphiEnabled: false };
    if (!data.currentRound) data.currentRound = 1;
    if (!data.roundStatus) data.roundStatus = 'open';

    await saveProblemFile(req.user.id, id, data);

    // Update token index
    const tokenIndex = await loadTokenIndex();
    tokenIndex[token] = { userId: req.user.id, problemId: id, participantId: participant.id };
    await saveTokenIndex(tokenIndex);

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const participationLink = `${appUrl}/participate/${id}/${token}`;

    res.status(201).json({
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        weight: participant.weight,
        anonymousLabel: participant.anonymousLabel,
        token,
        status: 'not_started',
      },
      participationLink,
      pin: pin, // shown once to admin; null if PIN not enabled
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ error: { message: 'Failed to add participant' } });
  }
}

async function updateParticipant(req, res) {
  try {
    const { id, pid } = req.params;
    const { name, email, weight } = req.body;

    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const idx = (data.participants || []).findIndex(p => p.id === pid);
    if (idx === -1) return res.status(404).json({ error: { message: 'Participant not found' } });

    if (name) data.participants[idx].name = name.trim();
    if (email !== undefined) data.participants[idx].email = email?.trim() || null;
    if (weight !== undefined) data.participants[idx].weight = Math.max(0, parseFloat(weight) || 1.0);

    await saveProblemFile(req.user.id, id, data);

    res.json({ participant: { ...data.participants[idx], pinHash: undefined } });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ error: { message: 'Failed to update participant' } });
  }
}

async function removeParticipant(req, res) {
  try {
    const { id, pid } = req.params;

    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const participant = (data.participants || []).find(p => p.id === pid);
    if (!participant) return res.status(404).json({ error: { message: 'Participant not found' } });

    // Remove from token index
    const tokenIndex = await loadTokenIndex();
    delete tokenIndex[participant.token];
    await saveTokenIndex(tokenIndex);

    data.participants = data.participants.filter(p => p.id !== pid);

    await saveProblemFile(req.user.id, id, data);

    res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: { message: 'Failed to remove participant' } });
  }
}

async function regeneratePin(req, res) {
  try {
    const { id, pid } = req.params;

    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const idx = (data.participants || []).findIndex(p => p.id === pid);
    if (idx === -1) return res.status(404).json({ error: { message: 'Participant not found' } });

    const pin = generatePin();
    data.participants[idx].pinHash = await bcrypt.hash(pin, 10);

    await saveProblemFile(req.user.id, id, data);

    res.json({ pin });
  } catch (error) {
    console.error('Regenerate PIN error:', error);
    res.status(500).json({ error: { message: 'Failed to regenerate PIN' } });
  }
}

/* ───────────────── Problem Config ───────────────── */

async function updateConfig(req, res) {
  try {
    const { id } = req.params;
    const { anonymousMode, pinProtection, delphiEnabled } = req.body;

    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    if (!data.config) data.config = { anonymousMode: false, pinProtection: false, delphiEnabled: false };

    // Check if any participant has started (blocks turning off anonymous mode)
    const currentRound = data.currentRound || 1;
    const anyStarted = (data.participants || []).some(p => {
      const rd = p.roundData?.[String(currentRound)];
      return rd && rd.status !== 'not_started';
    });

    if (anonymousMode !== undefined) {
      if (anyStarted && data.config.anonymousMode && !anonymousMode) {
        return res.status(400).json({ error: { message: 'Cannot disable anonymous mode after participants have started' } });
      }
      data.config.anonymousMode = !!anonymousMode;
    }
    if (pinProtection !== undefined) data.config.pinProtection = !!pinProtection;
    if (delphiEnabled !== undefined) data.config.delphiEnabled = !!delphiEnabled;

    await saveProblemFile(req.user.id, id, data);

    res.json({ config: data.config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: { message: 'Failed to update configuration' } });
  }
}

/* ───────────────── Round Management ───────────────── */

async function closeRound(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    if (data.roundStatus === 'closed') {
      return res.status(400).json({ error: { message: 'Round is already closed' } });
    }

    data.roundStatus = 'closed';
    const currentRound = data.currentRound || 1;

    // Record round closure
    if (!data.rounds) data.rounds = [];
    let round = data.rounds.find(r => r.roundNumber === currentRound);
    if (!round) {
      round = { roundNumber: currentRound, status: 'closed', openedAt: null, closedAt: null };
      data.rounds.push(round);
    }
    round.status = 'closed';
    round.closedAt = new Date().toISOString();

    await saveProblemFile(req.user.id, id, data);

    // Emit WebSocket event
    try {
      const { emitParticipantEvent } = require('../websocket');
      emitParticipantEvent(id, { type: 'round:closed', roundNumber: currentRound, closedAt: round.closedAt });
    } catch { /* WebSocket not critical */ }

    res.json({ message: 'Round closed', currentRound, roundStatus: 'closed' });
  } catch (error) {
    console.error('Close round error:', error);
    res.status(500).json({ error: { message: 'Failed to close round' } });
  }
}

async function reopenRound(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    if (data.roundStatus !== 'closed') {
      return res.status(400).json({ error: { message: 'Round is not closed' } });
    }
    if (data.finalised) {
      return res.status(400).json({ error: { message: 'Problem has been finalised' } });
    }

    data.roundStatus = 'open';
    const currentRound = data.currentRound || 1;
    const round = (data.rounds || []).find(r => r.roundNumber === currentRound);
    if (round) { round.status = 'open'; round.closedAt = null; }

    await saveProblemFile(req.user.id, id, data);

    try {
      const { emitParticipantEvent } = require('../websocket');
      emitParticipantEvent(id, { type: 'round:opened', roundNumber: currentRound, openedAt: new Date().toISOString() });
    } catch { /* WebSocket not critical */ }

    res.json({ message: 'Round reopened', currentRound, roundStatus: 'open' });
  } catch (error) {
    console.error('Reopen round error:', error);
    res.status(500).json({ error: { message: 'Failed to reopen round' } });
  }
}

async function newRound(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    if (data.roundStatus !== 'closed') {
      return res.status(400).json({ error: { message: 'Current round must be closed before starting a new one' } });
    }
    if (data.finalised) {
      return res.status(400).json({ error: { message: 'Problem has been finalised' } });
    }

    const nextRound = (data.currentRound || 1) + 1;
    data.currentRound = nextRound;
    data.roundStatus = 'open';

    if (!data.rounds) data.rounds = [];
    data.rounds.push({
      roundNumber: nextRound,
      status: 'open',
      openedAt: new Date().toISOString(),
      closedAt: null,
    });

    await saveProblemFile(req.user.id, id, data);

    res.json({ message: `Round ${nextRound} started`, currentRound: nextRound, roundStatus: 'open' });
  } catch (error) {
    console.error('New round error:', error);
    res.status(500).json({ error: { message: 'Failed to start new round' } });
  }
}

async function finalizeProblem(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    data.finalised = true;
    data.roundStatus = 'closed';
    data.finalisedAt = new Date().toISOString();

    await saveProblemFile(req.user.id, id, data);

    res.json({ message: 'Problem finalised' });
  } catch (error) {
    console.error('Finalize problem error:', error);
    res.status(500).json({ error: { message: 'Failed to finalise problem' } });
  }
}

/* ───────────────── Consensus ───────────────── */

async function getConsensus(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const participants = data.participants || [];
    const currentRound = data.currentRound || 1;
    const roundKey = String(currentRound);

    // Get completed participants for current round
    const completed = participants.filter(p => p.roundData?.[roundKey]?.status === 'completed');

    if (completed.length < 2) {
      return res.json({ message: 'At least 2 completed participants needed', consensus: null });
    }

    const criteria = data.criteria || [];
    const alternatives = data.alternatives || [];
    const subCriteria = data.subCriteria || {};
    const consensus = {};

    // Criteria consensus
    if (criteria.length >= 2) {
      const critMatrices = completed.map(p => {
        const rd = p.roundData[roundKey].comparisons;
        return rd?.criteriaMatrix || ahpEngine.createIdentityMatrix(criteria.length);
      });
      const critWeights = completed.map(p => p.weight);
      const critPriorityVectors = [];
      for (const mat of critMatrices) {
        const result = ahpEngine.computePriorities(mat);
        critPriorityVectors.push(result.priorities);
      }
      const ranks = ahpEngine.prioritiesToRanks(critPriorityVectors);
      consensus.criteria = ahpEngine.computeKendallW(ranks);
    }

    // Alternative consensus per criterion
    consensus.alternatives = {};
    if (alternatives.length >= 2) {
      for (const c of criteria) {
        const subs = subCriteria[c] || [];
        if (subs.length >= 2) {
          for (const sc of subs) {
            const key = `${c}::${sc}`;
            const altMatrices = completed.map(p => {
              const rd = p.roundData[roundKey].comparisons;
              return rd?.subCriteriaAltMatrices?.[key] || ahpEngine.createIdentityMatrix(alternatives.length);
            });
            const altPriorityVectors = altMatrices.map(mat => ahpEngine.computePriorities(mat).priorities);
            const ranks = ahpEngine.prioritiesToRanks(altPriorityVectors);
            consensus.alternatives[key] = ahpEngine.computeKendallW(ranks);
          }
        } else {
          const altMatrices = completed.map(p => {
            const rd = p.roundData[roundKey].comparisons;
            return rd?.altMatrices?.[c] || ahpEngine.createIdentityMatrix(alternatives.length);
          });
          const altPriorityVectors = altMatrices.map(mat => ahpEngine.computePriorities(mat).priorities);
          const ranks = ahpEngine.prioritiesToRanks(altPriorityVectors);
          consensus.alternatives[c] = ahpEngine.computeKendallW(ranks);
        }
      }
    }

    // Global consensus (based on global priorities per participant)
    // This requires computing each participant's full synthesis
    // We'll do a simplified version: consensus on final alternative rankings
    if (criteria.length >= 2 && alternatives.length >= 2) {
      const globalPriorityVectors = [];
      for (const p of completed) {
        const rd = p.roundData[roundKey].comparisons;
        const critMat = rd?.criteriaMatrix || ahpEngine.createIdentityMatrix(criteria.length);
        const critRes = ahpEngine.computePriorities(critMat);
        const cWeights = {};
        criteria.forEach((c, i) => { cWeights[c] = critRes.priorities[i]; });

        const aWeights = {};
        for (const c of criteria) {
          const subs = subCriteria[c] || [];
          if (subs.length >= 2) {
            const scMat = rd?.subCriteriaMatrices?.[c] || ahpEngine.createIdentityMatrix(subs.length);
            const scRes = ahpEngine.computePriorities(scMat);
            const effectiveAltWeights = {};
            alternatives.forEach(a => { effectiveAltWeights[a] = 0; });
            for (let si = 0; si < subs.length; si++) {
              const key = `${c}::${subs[si]}`;
              const scAltMat = rd?.subCriteriaAltMatrices?.[key] || ahpEngine.createIdentityMatrix(alternatives.length);
              const scAltRes = ahpEngine.computePriorities(scAltMat);
              alternatives.forEach((a, ai) => {
                effectiveAltWeights[a] += scRes.priorities[si] * scAltRes.priorities[ai];
              });
            }
            aWeights[c] = effectiveAltWeights;
          } else {
            const altMat = rd?.altMatrices?.[c] || ahpEngine.createIdentityMatrix(alternatives.length);
            const altRes = ahpEngine.computePriorities(altMat);
            const w = {};
            alternatives.forEach((a, i) => { w[a] = altRes.priorities[i]; });
            aWeights[c] = w;
          }
        }

        const synth = ahpEngine.synthesize(cWeights, aWeights);
        globalPriorityVectors.push(alternatives.map(a => synth.normalized[a] || 0));
      }

      const globalRanks = ahpEngine.prioritiesToRanks(globalPriorityVectors);
      consensus.global = ahpEngine.computeKendallW(globalRanks);
    }

    res.json({ consensus, completedCount: completed.length, totalCount: participants.length });
  } catch (error) {
    console.error('Get consensus error:', error);
    res.status(500).json({ error: { message: 'Failed to compute consensus' } });
  }
}

/* ───────────────── Aggregate Results ───────────────── */

async function computeAggregateResults(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    const participants = data.participants || [];
    const currentRound = data.currentRound || 1;
    const roundKey = String(currentRound);
    const completed = participants.filter(p => p.roundData?.[roundKey]?.status === 'completed');

    if (completed.length < 1) {
      return res.status(400).json({ error: { message: 'At least 1 participant must have submitted comparisons.' } });
    }

    const criteria = data.criteria || [];
    const alternatives = data.alternatives || [];
    const subCriteria = data.subCriteria || {};

    if (criteria.length < 2) return res.status(400).json({ error: { message: 'Need at least 2 criteria.' } });
    if (alternatives.length < 2) return res.status(400).json({ error: { message: 'Need at least 2 alternatives.' } });

    const weights = completed.map(p => p.weight || 1);

    // Aggregate criteria matrices
    const critMatrices = completed.map(p => {
      const rd = p.roundData[roundKey].comparisons;
      return rd?.criteriaMatrix || ahpEngine.createIdentityMatrix(criteria.length);
    });
    const aggCritMatrix = ahpEngine.aggregateMatrices(critMatrices, weights);
    const cRes = ahpEngine.computePriorities(aggCritMatrix);
    const criteriaWeights = {};
    criteria.forEach((c, i) => { criteriaWeights[c] = cRes.priorities[i]; });

    const n = aggCritMatrix.length;
    const critEig = ahpEngine.computeEigenvector(aggCritMatrix);
    const critLambda = ahpEngine.computeLambdaMax(aggCritMatrix, critEig);
    const critCI = ahpEngine.computeCI(critLambda, n);
    const critCR = ahpEngine.computeCR(critCI, n);
    const criteriaCR = { cr: critCR, isConsistent: critCR <= 0.10, lambdaMax: critLambda, ci: critCI };

    // Aggregate alternative matrices per criterion
    const altWeights = {};
    const altCRs = {};
    for (const c of criteria) {
      const subs = subCriteria[c] || [];
      if (subs.length >= 2) {
        // Sub-criteria aggregation
        const scMatrices = completed.map(p => {
          const rd = p.roundData[roundKey].comparisons;
          return rd?.subCriteriaMatrices?.[c] || ahpEngine.createIdentityMatrix(subs.length);
        });
        const aggScMat = ahpEngine.aggregateMatrices(scMatrices, weights);
        const scRes = ahpEngine.computePriorities(aggScMat);
        const scWeights = {};
        subs.forEach((sc, i) => { scWeights[sc] = scRes.priorities[i]; });

        const effectiveAltWeights = {};
        alternatives.forEach(a => { effectiveAltWeights[a] = 0; });

        for (const sc of subs) {
          const key = `${c}::${sc}`;
          const scAltMatrices = completed.map(p => {
            const rd = p.roundData[roundKey].comparisons;
            return rd?.subCriteriaAltMatrices?.[key] || ahpEngine.createIdentityMatrix(alternatives.length);
          });
          const aggScAltMat = ahpEngine.aggregateMatrices(scAltMatrices, weights);
          const scAltRes = ahpEngine.computePriorities(aggScAltMat);
          alternatives.forEach((a, i) => {
            effectiveAltWeights[a] += scWeights[sc] * scAltRes.priorities[i];
          });
        }
        altWeights[c] = effectiveAltWeights;
      } else {
        const altMatrices = completed.map(p => {
          const rd = p.roundData[roundKey].comparisons;
          return rd?.altMatrices?.[c] || ahpEngine.createIdentityMatrix(alternatives.length);
        });
        const aggAltMat = ahpEngine.aggregateMatrices(altMatrices, weights);
        const aRes = ahpEngine.computePriorities(aggAltMat);
        const w = {};
        alternatives.forEach((a, i) => { w[a] = aRes.priorities[i]; });
        altWeights[c] = w;

        const aN = aggAltMat.length;
        const aEig = ahpEngine.computeEigenvector(aggAltMat);
        const aLambda = ahpEngine.computeLambdaMax(aggAltMat, aEig);
        const aCI = ahpEngine.computeCI(aLambda, aN);
        const aCR = ahpEngine.computeCR(aCI, aN);
        altCRs[c] = { cr: aCR, isConsistent: aCR <= 0.10, lambdaMax: aLambda, ci: aCI };
      }
    }

    // Synthesize
    const synth = ahpEngine.synthesize(criteriaWeights, altWeights);

    // Consensus
    let consensus = null;
    if (completed.length >= 2) {
      try {
        consensus = {};
        const critPriorityVectors = critMatrices.map(mat => ahpEngine.computePriorities(mat).priorities);
        const critRanks = ahpEngine.prioritiesToRanks(critPriorityVectors);
        consensus.criteria = ahpEngine.computeKendallW(critRanks);

        consensus.alternatives = {};
        if (alternatives.length >= 2) {
          for (const c of criteria) {
            const altMats = completed.map(p => {
              const rd = p.roundData[roundKey].comparisons;
              return rd?.altMatrices?.[c] || ahpEngine.createIdentityMatrix(alternatives.length);
            });
            const altPVectors = altMats.map(mat => ahpEngine.computePriorities(mat).priorities);
            const altRanks = ahpEngine.prioritiesToRanks(altPVectors);
            consensus.alternatives[c] = ahpEngine.computeKendallW(altRanks);
          }
        }

        // Global consensus
        const globalPVectors = completed.map(p => {
          const rd = p.roundData[roundKey].comparisons;
          const cm = rd?.criteriaMatrix || ahpEngine.createIdentityMatrix(criteria.length);
          const cr = ahpEngine.computePriorities(cm);
          const cw = {};
          criteria.forEach((c2, i) => { cw[c2] = cr.priorities[i]; });
          const aw = {};
          for (const c2 of criteria) {
            const am = rd?.altMatrices?.[c2] || ahpEngine.createIdentityMatrix(alternatives.length);
            const ar = ahpEngine.computePriorities(am);
            const ww = {};
            alternatives.forEach((a, i) => { ww[a] = ar.priorities[i]; });
            aw[c2] = ww;
          }
          const s = ahpEngine.synthesize(cw, aw);
          return alternatives.map(a => s.normalized[a] || 0);
        });
        const globalRanks = ahpEngine.prioritiesToRanks(globalPVectors);
        consensus.global = ahpEngine.computeKendallW(globalRanks);
      } catch { consensus = null; }
    }

    res.json({
      criteriaWeights,
      criteriaCR,
      altWeights,
      altCRs,
      globalResults: synth,
      consensus,
      completedCount: completed.length,
      totalCount: participants.length,
    });
  } catch (error) {
    console.error('Compute aggregate results error:', error);
    res.status(500).json({ error: { message: 'Failed to compute aggregate results' } });
  }
}

/* ───────────────── Rounds listing ───────────────── */

async function listRounds(req, res) {
  try {
    const { id } = req.params;
    const data = await loadProblemFile(req.user.id, id);
    if (!data) return res.status(404).json({ error: { message: 'Problem not found' } });

    res.json({
      currentRound: data.currentRound || 1,
      roundStatus: data.roundStatus || 'open',
      finalised: data.finalised || false,
      rounds: data.rounds || [],
    });
  } catch (error) {
    console.error('List rounds error:', error);
    res.status(500).json({ error: { message: 'Failed to list rounds' } });
  }
}

module.exports = {
  createProblem, listProblems, getProblem, updateProblem,
  deleteProblem, saveProblem, downloadProblem, uploadProblem,
  listParticipants, addParticipant, updateParticipant, removeParticipant,
  regeneratePin, updateConfig,
  closeRound, reopenRound, newRound, finalizeProblem,
  getConsensus, listRounds,
  computeAggregateResults,
};
