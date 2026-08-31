const { createServiceError } = require('@pulsecore/common');

const forbidden = () => { throw createServiceError('User role not authorized', 403); };

const assertCanViewInventory = (requester) => {
  if (!['DOCTOR', 'STAFF', 'ADMIN', 'SYSTEM'].includes(requester.role)) forbidden();
};

const prescriptionScope = (requester, patientId) => {
  if (['STAFF', 'ADMIN', 'SYSTEM'].includes(requester.role)) return patientId ? { patientId } : {};
  if (requester.role === 'DOCTOR') return { doctorId: requester.id, ...(patientId ? { patientId } : {}) };
  return forbidden();
};

const assertCanCreate = (requester, doctorId) => {
  if (['ADMIN', 'SYSTEM'].includes(requester.role)) return;
  if (requester.role === 'DOCTOR' && requester.id === doctorId) return;
  forbidden();
};

const assertCanDispense = (requester) => {
  if (!['STAFF', 'ADMIN', 'SYSTEM'].includes(requester.role)) forbidden();
};

module.exports = { assertCanViewInventory, prescriptionScope, assertCanCreate, assertCanDispense };
