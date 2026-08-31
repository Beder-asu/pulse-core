const { createServiceError } = require('../errors/serviceError');

const operationalRoles = new Set(['ADMIN', 'STAFF', 'DOCTOR', 'SYSTEM']);
const forbidden = () => { throw createServiceError('User role not authorized', 403); };

/** Returns the narrowest Prisma scope the requester is allowed to query. */
const readScope = (requester) => {
  if (operationalRoles.has(requester.role)) return {};
  if (requester.role === 'PATIENT') return { userId: requester.id };
  return forbidden();
};

const assertCanCreate = (requester, userId) => {
  if (['ADMIN', 'STAFF', 'SYSTEM'].includes(requester.role)) return;
  if (requester.role === 'PATIENT' && requester.id === userId) return;
  forbidden();
};

const assertCanReadProfile = (requester, profile) => {
  if (operationalRoles.has(requester.role)) return;
  if (requester.role === 'PATIENT' && requester.id === profile.userId) return;
  forbidden();
};

module.exports = { readScope, assertCanCreate, assertCanReadProfile };
