const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const storageService = require('../services/storageService');
const ahpEngine = require('../services/ahpEngine');
const llmService = require('../services/llmService');

// In-memory PIN lockout tracking: { token: { attempts: N, lockedUntil: Date } }
const pinLockouts = new Map();
const MAX_PIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Token index key
const TOKEN_INDEX_KEY = 'data/participation-tokens.json';

async function loadTokenIndex() {
  const data = await storageService.getJSON(TOKEN_INDEX_KEY);
  return data || {};
}

async function saveTokenIndex(index) {
  await storageService.putJSON(TOKEN_INDEX_KEY, index);
}

/**
 * Resolve a participation token to { userId, problemId, participantId }.
 */
async function resolveToken(token) {
  const index = await loadTokenIndex();
  return index[token] || null;
}

/**
 * POST /api/v1/participate/:problemId/:token/verify-pin
 * Verify PIN, return a short-lived session token on success.
 */
async function verifyPin(req, res) {
  try {
    const { problemId, token } = req.params;
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ error: { message: 'PIN is required' } });
    }

    // Check lockout
    const lockoutKey = token;
    const lockout = pinLockouts.get(lockoutKey);
    if (lockout && lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
      const remainingMin = Math.ceil((lockout.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: { message: `Too many attempts. Please try again in ${remainingMin} minutes.` },
      });
    }

    // Resolve token
    const mapping = await resolveToken(token);
    if (!mapping || mapping.problemId !== problemId) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    // Load problem and find participant
    const fileKey = `users/${mapping.userId}/problems/${problemId}.AHP`;
    const problemData = await storageService.getJSON(fileKey);
    if (!problemData) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    const participant = (problemData.participants || []).find(p => p.token === token);
    if (!participant) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    if (!problemData.config?.pinProtection) {
      return res.status(400).json({ error: { message: 'PIN protection is not enabled for this problem.' } });
    }

    // Verify PIN against stored hash
    const pinMatch = await bcrypt.compare(pin, participant.pinHash);
    if (!pinMatch) {
      const entry = pinLockouts.get(lockoutKey) || { attempts: 0, lockedUntil: null };
      entry.attempts += 1;
      if (entry.attempts >= MAX_PIN_ATTEMPTS) {
        entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        entry.attempts = 0;
        pinLockouts.set(lockoutKey, entry);
        return res.status(429).json({
          error: { message: 'Too many attempts. Please try again in 15 minutes.' },
        });
      }
      pinLockouts.set(lockoutKey, entry);
      const remaining = MAX_PIN_ATTEMPTS - entry.attempts;
      return res.status(401).json({
        error: { message: `Incorrect PIN. ${remaining} attempt(s) remaining.` },
      });
    }

    // Clear lockout on success
    pinLockouts.delete(lockoutKey);

    // Issue short-lived session JWT (4 hours)
    const sessionToken = jwt.sign(
      { participantId: participant.id, problemId, token },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.cookie('participant_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000,
    });

    res.json({ message: 'PIN verified successfully' });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ error: { message: 'Failed to verify PIN' } });
  }
}

/**
 * GET /api/v1/participate/:problemId/:token
 * Fetch problem structure and participant's existing comparisons.
 */
async function getParticipation(req, res) {
  try {
    const { problemId, token } = req.params;

    const mapping = await resolveToken(token);
    if (!mapping || mapping.problemId !== problemId) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    const fileKey = `users/${mapping.userId}/problems/${problemId}.AHP`;
    const problemData = await storageService.getJSON(fileKey);
    if (!problemData) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    const participant = (problemData.participants || []).find(p => p.token === token);
    if (!participant) {
      return res.status(404).json({ error: { message: 'This link is no longer valid. Please contact the person who shared it with you.' } });
    }

    // Check PIN protection — require session cookie
    if (problemData.config?.pinProtection) {
      const sessionToken = req.cookies?.participant_session;
      if (!sessionToken) {
        return res.json({
          requiresPin: true,
          problemTitle: problemData.problem?.title || '',
          participantName: participant.name,
        });
      }
      try {
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (decoded.token !== token || decoded.problemId !== problemId) {
          return res.json({
            requiresPin: true,
            problemTitle: problemData.problem?.title || '',
            participantName: participant.name,
          });
        }
      } catch {
        return res.json({
          requiresPin: true,
          problemTitle: problemData.problem?.title || '',
          participantName: participant.name,
        });
      }
    }

    // Check round status
    const currentRound = problemData.currentRound || 1;
    const roundStatus = problemData.roundStatus || 'open';
    const isFinalised = problemData.finalised === true;

    if (roundStatus === 'closed' || isFinalised) {
      return res.json({
        closed: true,
        message: 'This decision round has been closed. Thank you for your participation.',
        participantName: participant.name,
      });
    }

    // Get participant's data for current round
    const roundKey = String(currentRound);
    const roundData = participant.roundData?.[roundKey] || {};

    // Get previous round aggregated priorities (for Delphi rounds 2+)
    let previousRoundPriorities = null;
    if (currentRound > 1 && problemData.config?.delphiEnabled) {
      const prevRound = (problemData.rounds || []).find(r => r.roundNumber === currentRound - 1);
      if (prevRound?.aggregatedPriorities) {
        previousRoundPriorities = prevRound.aggregatedPriorities;
      }
    }

    res.json({
      requiresPin: false,
      closed: false,
      problemTitle: problemData.problem?.title || '',
      problemDescription: problemData.problem?.description || '',
      participantName: participant.name,
      criteria: problemData.criteria || [],
      alternatives: problemData.alternatives || [],
      subCriteria: problemData.subCriteria || {},
      currentRound,
      roundStatus,
      delphiEnabled: problemData.config?.delphiEnabled || false,
      comparisons: roundData.comparisons || {},
      status: roundData.status || 'not_started',
      previousRoundPriorities,
    });
  } catch (error) {
    console.error('Get participation error:', error);
    res.status(500).json({ error: { message: 'Failed to load participation data' } });
  }
}

/**
 * PUT /api/v1/participate/:problemId/:token
 * Save or submit comparisons.
 */
async function saveParticipation(req, res) {
  try {
    const { problemId, token } = req.params;
    const { comparisons, submit } = req.body;

    const mapping = await resolveToken(token);
    if (!mapping || mapping.problemId !== problemId) {
      return res.status(404).json({ error: { message: 'This link is no longer valid.' } });
    }

    const fileKey = `users/${mapping.userId}/problems/${problemId}.AHP`;
    const problemData = await storageService.getJSON(fileKey);
    if (!problemData) {
      return res.status(404).json({ error: { message: 'This link is no longer valid.' } });
    }

    // Check PIN session if required
    if (problemData.config?.pinProtection) {
      const sessionToken = req.cookies?.participant_session;
      if (!sessionToken) {
        return res.status(401).json({ error: { message: 'PIN verification required.' } });
      }
      try {
        const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
        if (decoded.token !== token || decoded.problemId !== problemId) {
          return res.status(401).json({ error: { message: 'Invalid session.' } });
        }
      } catch {
        return res.status(401).json({ error: { message: 'Session expired. Please re-enter your PIN.' } });
      }
    }

    // Check round is open
    const roundStatus = problemData.roundStatus || 'open';
    if (roundStatus === 'closed' || problemData.finalised) {
      return res.status(403).json({ error: { message: 'This decision round has been closed.' } });
    }

    const participantIdx = (problemData.participants || []).findIndex(p => p.token === token);
    if (participantIdx === -1) {
      return res.status(404).json({ error: { message: 'Participant not found.' } });
    }

    const currentRound = problemData.currentRound || 1;
    const roundKey = String(currentRound);

    // Initialize roundData if needed
    if (!problemData.participants[participantIdx].roundData) {
      problemData.participants[participantIdx].roundData = {};
    }
    if (!problemData.participants[participantIdx].roundData[roundKey]) {
      problemData.participants[participantIdx].roundData[roundKey] = {};
    }

    const rd = problemData.participants[participantIdx].roundData[roundKey];
    rd.comparisons = comparisons;
    rd.lastActivity = new Date().toISOString();

    if (submit) {
      rd.status = 'completed';
      rd.completedAt = new Date().toISOString();
    } else {
      if (rd.status !== 'completed') {
        rd.status = 'in_progress';
      }
    }

    await storageService.putJSON(fileKey, problemData);

    // Emit WebSocket event if available
    const { emitParticipantEvent } = require('../websocket');
    if (emitParticipantEvent) {
      const participant = problemData.participants[participantIdx];
      emitParticipantEvent(problemId, {
        type: submit ? 'participant:completed' : 'participant:activityUpdate',
        participantId: participant.id,
        anonymousLabel: participant.anonymousLabel,
        status: rd.status,
        lastActivity: rd.lastActivity,
        name: problemData.config?.anonymousMode ? undefined : participant.name,
      });
    }

    // On submit, compute consistency coaching
    if (submit) {
      const coaching = await computeConsistencyCoaching(problemData, comparisons);
      return res.json({
        message: 'Comparisons submitted successfully',
        status: rd.status,
        coaching,
      });
    }

    res.json({
      message: 'Progress saved',
      status: rd.status,
    });
  } catch (error) {
    console.error('Save participation error:', error);
    res.status(500).json({ error: { message: 'Failed to save comparisons' } });
  }
}

/**
 * Compute consistency coaching for a participant's submission.
 * Identifies inconsistent comparison groups (CR > 0.10), finds the most
 * inconsistent triad in each, and requests coaching messages from the LLM.
 */
async function computeConsistencyCoaching(problemData, comparisons) {
  try {
    const criteria = problemData.criteria || [];
    const alternatives = problemData.alternatives || [];
    const subCriteria = problemData.subCriteria || {};

    // Build comparison groups and check consistency
    const inconsistentGroups = [];

    // Helper: check a matrix for inconsistency
    const checkMatrix = (matrix, items, groupId, groupContext) => {
      if (!matrix || !Array.isArray(matrix) || matrix.length < 3) return;
      try {
        const result = ahpEngine.computePriorities(matrix);
        if (result.cr > 0.10) {
          const triadResult = ahpEngine.findMostInconsistentTriad(matrix);
          if (triadResult) {
            const [i, j, k] = triadResult.indices;
            const judgments = {};

            const pref = (val) => val >= 1
              ? { value: Math.round(val), preferred: items[0] }
              : { value: Math.round(1 / val), preferred: items[1] };

            judgments[`${items[i]} vs ${items[j]}`] = {
              value: matrix[i][j] >= 1 ? Math.round(matrix[i][j]) : Math.round(1 / matrix[i][j]),
              preferred: matrix[i][j] >= 1 ? items[i] : items[j],
            };
            judgments[`${items[j]} vs ${items[k]}`] = {
              value: matrix[j][k] >= 1 ? Math.round(matrix[j][k]) : Math.round(1 / matrix[j][k]),
              preferred: matrix[j][k] >= 1 ? items[j] : items[k],
            };
            judgments[`${items[i]} vs ${items[k]}`] = {
              value: matrix[i][k] >= 1 ? Math.round(matrix[i][k]) : Math.round(1 / matrix[i][k]),
              preferred: matrix[i][k] >= 1 ? items[i] : items[k],
            };

            inconsistentGroups.push({
              groupId,
              groupContext,
              groupLabel: groupContext,
              cr: parseFloat(result.cr.toFixed(4)),
              triad: {
                elements: [items[i], items[j], items[k]],
                judgments,
              },
            });
          }
        }
      } catch {
        // Skip if matrix is invalid
      }
    };

    // Check criteria matrix
    const criteriaMatrix = comparisons.criteriaMatrix;
    if (criteriaMatrix) {
      checkMatrix(criteriaMatrix, criteria, 'criteria',
        `Main criteria for the decision: ${problemData.problem?.title || 'Untitled'}`);
    }

    // Check sub-criteria and alternative matrices
    criteria.forEach(c => {
      const subs = subCriteria[c] || [];
      if (subs.length >= 2) {
        const scMat = comparisons.subCriteriaMatrices?.[c];
        if (scMat) {
          checkMatrix(scMat, subs, `sub-${c}`,
            `Sub-criteria under "${c}"`);
        }
        subs.forEach(sc => {
          const key = `${c}::${sc}`;
          const scAltMat = comparisons.subCriteriaAltMatrices?.[key];
          if (scAltMat) {
            checkMatrix(scAltMat, alternatives, key,
              `Alternatives under "${c}" > "${sc}"`);
          }
        });
      } else {
        const altMat = comparisons.altMatrices?.[c];
        if (altMat) {
          checkMatrix(altMat, alternatives, `alt-${c}`,
            `Alternatives with respect to "${c}"`);
        }
      }
    });

    if (inconsistentGroups.length === 0) return [];

    // Try to get LLM coaching
    if (llmService.CONFIG.enabled()) {
      try {
        const messages = await llmService.generateConsistencyCoaching(inconsistentGroups);
        // Merge coaching messages with CR/group data
        return inconsistentGroups.map(g => {
          const msg = messages.find(m => m.groupId === g.groupId);
          return {
            groupId: g.groupId,
            groupLabel: g.groupLabel,
            cr: g.cr,
            coachingMessage: msg?.coachingMessage || null,
          };
        });
      } catch (err) {
        console.error('Consistency coaching LLM call failed:', err.message);
      }
    }

    // Fallback: return without coaching messages
    return inconsistentGroups.map(g => ({
      groupId: g.groupId,
      groupLabel: g.groupLabel,
      cr: g.cr,
      coachingMessage: null,
    }));
  } catch (err) {
    console.error('Consistency coaching computation error:', err);
    return [];
  }
}

module.exports = {
  verifyPin,
  getParticipation,
  saveParticipation,
  resolveToken,
  loadTokenIndex,
  saveTokenIndex,
};
