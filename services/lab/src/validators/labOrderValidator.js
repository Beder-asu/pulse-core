const { createServiceError } = require('../errors/serviceError');
const { requireOptionalUuidV7 } = require('@pulsecore/common');

const validateNewOrder = ({ patientId, testName, priority }) => {
  if (!patientId || !testName) {
    throw createServiceError('Patient and test name are required', 400);
  }
  if (priority !== undefined) {
    throw createServiceError('priority is not supported; use priorityId', 400);
  }
};

const validateOrderFilters = ({ patientId } = {}) => ({
  patientId: requireOptionalUuidV7(patientId, 'patientId')
});

module.exports = { validateNewOrder, validateOrderFilters };
