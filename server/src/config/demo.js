const { randomBytes } = require('crypto');

// Presentation mode is the default. Set DEMO_MODE=false for account-based use.
const isDemoMode = () => process.env.DEMO_MODE !== 'false';
const demoSigningSecret = randomBytes(32).toString('hex');
const participationSecret = () => isDemoMode() ? demoSigningSecret : process.env.JWT_SECRET;

module.exports = { isDemoMode, participationSecret };
