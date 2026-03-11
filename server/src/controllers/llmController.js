const llmService = require('../services/llmService');
const storageService = require('../services/storageService');

/**
 * POST /api/v1/problems/:id/report/narratives
 * Generate LLM-powered narrative sections for the Decision Report.
 */
async function generateNarratives(req, res) {
  try {
    if (!llmService.CONFIG.enabled()) {
      return res.status(503).json({
        error: { message: 'AI-generated narrative is temporarily unavailable. The report will use a standard summary.' },
      });
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
      model: llmService.CONFIG.model(),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate narratives error:', error.message || error);
    const isTimeout = error.message?.includes('timeout') || error.message?.includes('time budget') || error.code === 'ETIMEDOUT';
    const status = isTimeout ? 504 : 500;
    const message = isTimeout
      ? 'The AI service took too long to respond. Please try again.'
      : 'AI-generated narrative is temporarily unavailable. The report will use a standard summary.';
    res.status(status).json({
      error: { message },
    });
  }
}

/**
 * POST /api/v1/problems/:id/report/narratives/regenerate
 * Regenerate narratives (limited to 3 per session).
 */
async function regenerateNarratives(req, res) {
  try {
    if (!llmService.CONFIG.enabled()) {
      return res.status(503).json({
        error: { message: 'AI-generated narrative is temporarily unavailable.' },
      });
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
        error: { message: 'Regeneration limit reached. You can regenerate up to 3 times per session.' },
        regenerationsRemaining: 0,
      });
    }

    const narratives = await llmService.generateReportNarratives(contextPayload);
    const newRemaining = llmService.consumeRegeneration(req.user.id, id, roundNumber);

    res.json({
      narratives,
      regenerationsRemaining: newRemaining,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Regenerate narratives error:', error);
    res.status(500).json({
      error: { message: 'AI-generated narrative is temporarily unavailable. The report will use a standard summary.' },
    });
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
