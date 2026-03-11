import api from './api';

/**
 * Get LLM service status
 */
export async function getLlmStatus() {
  const res = await api.get('/llm/status');
  return res.data;
}

/**
 * Generate report narrative sections
 */
export async function generateNarratives(problemId, contextPayload) {
  const res = await api.post(`/problems/${problemId}/report/narratives`, { contextPayload });
  return res.data;
}

/**
 * Regenerate report narrative sections (limited to 3 per session)
 */
export async function regenerateNarratives(problemId, contextPayload) {
  const res = await api.post(`/problems/${problemId}/report/narratives/regenerate`, { contextPayload });
  return res.data;
}

/**
 * Validate problem structure with AI-powered review
 */
export async function validateStructure(problemId, problemData) {
  const res = await api.post(`/problems/${problemId}/validate-structure`, { problemData });
  return res.data;
}

/**
 * Generate LLM explanation of consensus results
 */
export async function explainConsensus(problemId, consensusData) {
  const res = await api.post(`/problems/${problemId}/consensus/explain`, { consensusData });
  return res.data;
}

const llmService = {
  getLlmStatus,
  generateNarratives,
  regenerateNarratives,
  validateStructure,
  explainConsensus,
};

export default llmService;
