const { createServiceError } = require('@pulsecore/common');

const forbidden = () => { throw createServiceError('User role not authorized', 403); };

const assertCanCreate = (requester, doctorId) => {
  if (['ADMIN', 'SYSTEM'].includes(requester.role)) return;
  if (requester.role === 'DOCTOR' && requester.id === doctorId) return;
  forbidden();
};

const listScope = (requester, requested = {}) => {
  if (['ADMIN', 'STAFF', 'SYSTEM'].includes(requester.role)) {
    return requested.patientId ? { patientId: requested.patientId } : {};
  }
  if (requester.role === 'PATIENT') return { patientId: requester.id };
  if (requester.role === 'DOCTOR') return { doctorId: requester.id, ...(requested.patientId ? { patientId: requested.patientId } : {}) };
  return forbidden();
};

const assertCanReadPatient = (requester, patientId) => {
  if (['ADMIN', 'STAFF', 'DOCTOR', 'SYSTEM'].includes(requester.role)) return;
  if (requester.role === 'PATIENT' && requester.id === patientId) return;
  forbidden();
};

module.exports = { assertCanCreate, listScope, assertCanReadPatient };
