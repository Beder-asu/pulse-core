const jwt = require('jsonwebtoken');

/**
 * Access tokens are deliberately short lived and contain only authorization
 * identity. Refresh tokens use a separate opaque-token service and therefore
 * can never pass bearer-token verification in downstream services.
 */
const generate = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id, role, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TTL || '15m'
  });
};

module.exports = { generate };
