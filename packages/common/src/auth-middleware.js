const jwt = require('jsonwebtoken');
const logger = require('./logger');

const authenticate = (req, res, next) => {
  // Allow internal service-to-service calls to skip JWT validation
  if (req.headers['x-internal-call'] === 'true') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', service: process.env.SERVICE_NAME }
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, patientId (optional), iat, exp }
    next();
  } catch (error) {
    logger.warn('Token verification failed', { error: error.message });
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', service: process.env.SERVICE_NAME }
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // If it's an internal call, we assume it's authorized for the action
    if (req.headers['x-internal-call'] === 'true') {
      return next();
    }
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions', service: process.env.SERVICE_NAME }
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
