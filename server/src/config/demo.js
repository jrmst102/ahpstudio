const { randomBytes, createHmac } = require('crypto');

// Presentation mode is the default. Set DEMO_MODE=false for account-based use.
const isDemoMode = () => process.env.DEMO_MODE !== 'false';
const demoSigningSecret = randomBytes(32).toString('hex');
const participationSecret = () => {
  if (!isDemoMode()) return process.env.JWT_SECRET;
  const sharedSecret = process.env.JWT_SECRET || process.env.SPACES_SECRET;
  return sharedSecret
    ? createHmac('sha256', sharedSecret).update('ahp-demo-participation').digest('hex')
    : demoSigningSecret;
};
const hasSharedStorage = () => Boolean(
  process.env.SPACES_ENDPOINT && process.env.SPACES_BUCKET &&
  process.env.SPACES_KEY && process.env.SPACES_SECRET
);

module.exports = { isDemoMode, participationSecret, hasSharedStorage };
