const llmService = require('../services/llmService');
const { describeLlmError } = require('../services/llmErrors');

function narrativeFailure(res, error) {
  const { status, ...publicError } = describeLlmError(error);
  // Keep diagnostics useful without logging provider messages that may include
  // credentials or the submitted report content.
  console.error('Narrative generation failed:', {
    code: publicError.code,
    providerStatus: error.status,
    providerCode: error.code,
    requestId: error.requestID,
  });
  return res.status(status).json({ error: publicError });
}

function configurationFailure(res) {
  return narrativeFailure(res, {
    code: llmService.CONFIG.apiKey() ? 'LLM_DISABLED' : 'LLM_NOT_CONFIGURED',
  });
}

/**
 * POST /api/v1/problems/:id/report/narratives
 * Generate LLM-powered narrative sections for the Decision Report.
 */
async function generateNarratives(req, res) {
  try {
    if (!llmService.CONFIG.enabled()) {
      return configurationFailure(res);
    }

    const { id } = req.params;
    const { contextPayload } = req.body;

    if (!contextPayload) {
      return res.status(400).json({
        error: { message: 'Context payload is required' },
      });
    }

    const roundNumber = contextPayload.currentRound || 1;

    // Reset regeneration counter for a fresh session
    llmService.resetRegeneration(req.user.id, id, roundNumber);

    const narratives = await llmService.generateReportNarratives(contextPayload);
    const remaining = llmService.getRegenerationsRemaining(req.user.id, id, roundNumber);

    res.json({
      narratives,
      regenerationsRemaining: remaining,
      model: narratives.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return narrativeFailure(res, error);
  }
}

/**
 * POST /api/v1/problems/:id/report/narratives/regenerate
 * Regenerate narratives (limited to 3 per session).
 */
async function regenerateNarratives(req, res) {
  try {
    if (!llmService.CONFIG.enabled()) {
      return configurationFailure(res);
    }

    const { id } = req.params;
    const { contextPayload } = req.body;

    if (!contextPayload) {
      return res.status(400).json({
        error: { message: 'Context payload is required' },
      });
    }

    const roundNumber = contextPayload.currentRound || 1;

    // Check regeneration limit
    const remaining = llmService.getRegenerationsRemaining(req.user.id, id, roundNumber);
    if (remaining <= 0) {
      return res.status(429).json({
        error: { code: 'REGENERATION_LIMIT', message: 'Regeneration limit reached. You can regenerate up to 3 times per session.', retryable: false },
        regenerationsRemaining: 0,
      });
    }

    const narratives = await llmService.generateReportNarratives(contextPayload);
    const newRemaining = llmService.consumeRegeneration(req.user.id, id, roundNumber);

    res.json({
      narratives,
      regenerationsRemaining: newRemaining,
      model: narratives.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return narrativeFailure(res, error);
  }
}

/**
 * POST /api/v1/problems/:id/validate-structure
 * Run AI-powered validation on the problem hierarchy.
 */
async function validateStructure(req, res) {
  try {
    const { id } = req.params;

    // Cooldown check
    if (!llmService.checkValidationCooldown(req.user.id, id)) {
      return res.status(429).json({
        error: { message: 'Please wait a few seconds before running another review.' },
      });
    }

    const { problemData } = req.body;

    if (!problemData) {
      return res.status(400).json({
        error: { message: 'Problem data is required' },
      });
    }

    const result = await llmService.validateStructure(problemData);
    res.json(result);
  } catch (error) {
    console.error('Validate structure error:', error);
    // Fall back to deterministic-only
    try {
      const { problemData } = req.body;
      const { checks } = llmService.computeDeterministicChecks(
        problemData?.criteria || [],
        problemData?.alternatives || [],
        problemData?.subCriteria || {},
      );
      const summary = {
        warnings: checks.filter(o => o.severity === 'warning').length,
        suggestions: 0,
        info: checks.filter(o => o.severity === 'info').length,
      };
      res.json({ deterministic: checks, aiObservations: [], summary, llmAvailable: false });
    } catch {
      res.status(500).json({
        error: { message: 'Failed to validate problem structure' },
      });
    }
  }
}

/**
 * POST /api/v1/problems/:id/consensus/explain
 * Generate an LLM-powered explanation of consensus results.
 */
async function explainConsensus(req, res) {
  try {
    if (!llmService.CONFIG.enabled()) {
      return res.status(503).json({
        error: { message: 'AI explanation is temporarily unavailable.' },
      });
    }

    const { consensusData } = req.body;
    if (!consensusData) {
      return res.status(400).json({
        error: { message: 'Consensus data is required' },
      });
    }

    const result = await llmService.generateConsensusExplanation(consensusData);
    res.json(result);
  } catch (error) {
    console.error('Explain consensus error:', error);
    res.status(500).json({
      error: { message: 'AI explanation is temporarily unavailable.' },
    });
  }
}

/**
 * GET /api/v1/llm/status
 * Returns LLM configuration status.
 */
function getLlmStatus(req, res) {
  res.json(llmService.getStatus());
}

module.exports = {
  generateNarratives,
  regenerateNarratives,
  validateStructure,
  explainConsensus,
  getLlmStatus,
};
