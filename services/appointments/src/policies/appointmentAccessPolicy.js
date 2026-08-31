const { createServiceError } = require('../errors/serviceError');

const forbidden = () => { throw createServiceError('User role not authorized', 403); };
const operational = (role) => ['ADMIN', 'STAFF', 'SYSTEM'].includes(role);

const assertCanBook = (requester, patientId) => {
  if (operational(requester.role)) return;
  if (requester.role === 'PATIENT' && requester.id === patientId) return;
  forbidden();
};

/** Caller-provided filters are accepted only for global operational roles. */
const listScope = (requester, requested = {}) => {
  if (operational(requester.role)) return { patientId: requested.patientId, doctorId: requested.doctorId };
  if (requester.role === 'PATIENT') return { patientId: requester.id };
  if (requester.role === 'DOCTOR') return { doctorId: requester.id, patientId: requested.patientId };
  return forbidden();
};

const assertCanReadPatient = (requester, patientId) => {
  if (operational(requester.role)) return;
  if (requester.role === 'PATIENT' && requester.id === patientId) return;
  forbidden();
};

const assertCanReadDoctor = (requester, doctorId) => {
  if (operational(requester.role)) return;
  if (requester.role === 'DOCTOR' && requester.id === doctorId) return;
  forbidden();
};

module.exports = { assertCanBook, listScope, assertCanReadPatient, assertCanReadDoctor };
