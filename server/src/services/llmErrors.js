// Public messages deliberately exclude provider error bodies and credentials.
function describeLlmError(error) {
  const providerCode = error?.code || error?.error?.code;
  const entry = (code, message, retryable = false, status = 503) => ({ status, code, message, retryable });
  if (providerCode === 'LLM_NOT_CONFIGURED') return entry(providerCode, 'AI narratives are not configured for this deployment. The report can still use a standard summary.');
  if (providerCode === 'LLM_DISABLED') return entry(providerCode, 'AI narratives are disabled for this deployment. The report can still use a standard summary.');
  if (error?.status === 401) return entry('LLM_AUTHENTICATION_FAILED', 'The AI service credentials were rejected. The app administrator needs to update them.');
  if (['insufficient_quota', 'billing_hard_limit_reached', 'project_spend_limit_exceeded', 'organization_usage_limit_exceeded'].includes(providerCode)) {
    return entry('LLM_QUOTA_EXCEEDED', 'The AI service has reached its billing or usage limit. The app administrator needs to check the API account.');
  }
  if (error?.status === 403 || error?.status === 404) return entry('LLM_MODEL_UNAVAILABLE', 'The configured AI model is unavailable or access was denied. The app administrator needs to check model access.');
  if (error?.status === 429) return entry('LLM_RATE_LIMITED', 'The AI service is busy. Wait a moment, then try again.', true);
  if (['LLM_TIMEOUT', 'ETIMEDOUT'].includes(providerCode) || ['APIConnectionTimeoutError', 'APIUserAbortError'].includes(error?.name)) {
    return entry('LLM_TIMEOUT', 'The AI service took too long to respond. Please try again.', true, 504);
  }
  if (providerCode === 'LLM_INVALID_RESPONSE' || error instanceof SyntaxError) return entry('LLM_INVALID_RESPONSE', 'The AI service returned an incomplete narrative. Please try again.', true, 502);
  if (error?.status === 400 || error?.status === 422) return entry('LLM_REQUEST_REJECTED', 'The AI service rejected the request. The app administrator needs to check the model configuration.');
  return entry('LLM_UNAVAILABLE', 'Could not reach the AI service. Please try again. The report can still use a standard summary.', true, 502);
}

module.exports = { describeLlmError };
