const { createServiceError } = require('../errors/serviceError');

const assertCanCreate = (requester, userId) => {
  if (['ADMIN', 'STAFF', 'SYSTEM'].includes(requester.role)) return;
  if (requester.role === 'DOCTOR' && requester.id === userId) return;
  throw createServiceError('User role not authorized', 403);
};

module.exports = { assertCanCreate };
