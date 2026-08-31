const { createServiceError } = require('../errors/serviceError');
const { requireOptionalUuidV7 } = require('@pulsecore/common');

const validateNewInvoice = ({ patientId, items }) => {
  if (!patientId || !Array.isArray(items) || items.length === 0) {
    throw createServiceError('Patient and at least one invoice item are required', 400);
  }

  for (const item of items) {
    if (!item.description || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0) {
      throw createServiceError('Each invoice item requires a description and a positive amount', 400);
    }
  }
};

const validateInvoicePatientFilter = (patientId) => requireOptionalUuidV7(patientId, 'patientId');

module.exports = { validateNewInvoice, validateInvoicePatientFilter };
