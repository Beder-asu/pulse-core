const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { DEMO_IDS } = require('./demo-data');

const normalizeRole = (role) => (role || '').toString().toUpperCase();

const matchesInternalSecret = (provided) => {
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const protect = (req, res, next) => {
  let token;

  // Internal calls receive SYSTEM authority only after proving possession of a
  // service credential. Nginx strips these headers from all public requests.
  if (req.headers['x-internal-call'] === 'true' && matchesInternalSecret(req.headers['x-internal-secret'])) {
    req.user = { role: 'SYSTEM' };
    return next();
  }

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (process.env.ENABLE_DEV_AUTH_BYPASS === 'true' && token === 'dummy-dev-token-xyz') {
        req.user = { id: process.env.DEV_USER_ID || DEMO_IDS.users.patientAmina, role: normalizeRole(process.env.DEV_USER_ROLE || 'PATIENT') };
        return next();
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'JWT_SECRET is not configured' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'access') {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }
      req.user = { ...decoded, role: normalizeRole(decoded.role) };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);
  return (req, res, next) => {
    const userRole = normalizeRole(req.user && req.user.role);
    if (!req.user || (!allowedRoles.includes(userRole) && userRole !== 'SYSTEM')) {
      return res.status(403).json({ message: 'User role not authorized' });
    }
    next();
  };
};

module.exports = { protect, authorize };
