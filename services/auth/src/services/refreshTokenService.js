const crypto = require('crypto');

const REFRESH_TOKEN_BYTES = 48;
const DEFAULT_REFRESH_DAYS = 30;

/**
 * Refresh credentials are random rather than JWTs. The raw value exists only
 * in the browser cookie; services and the database work with a deterministic
 * hash so a leaked database cannot be used to mint access tokens.
 */
const generate = () => crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');
const expiresAt = (now = new Date()) => {
  const days = Number(process.env.JWT_REFRESH_DAYS || DEFAULT_REFRESH_DAYS);
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

module.exports = { generate, hash, expiresAt };
