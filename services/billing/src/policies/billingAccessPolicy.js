const { createServiceError } = require('../errors/serviceError');

const assertOperational = (requester) => {
  if (!['ADMIN', 'STAFF', 'SYSTEM'].includes(requester.role)) {
    throw createServiceError('User role not authorized', 403);
  }
};

module.exports = { assertOperational };
