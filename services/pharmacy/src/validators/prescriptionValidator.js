const { createServiceError } = require('../errors/serviceError');
const { requireOptionalUuidV7 } = require('@pulsecore/common');

const validateNewPrescription = ({ patientId, medications }) => {
  if (!patientId || !Array.isArray(medications) || medications.length === 0) {
    throw createServiceError('Patient and at least one medication are required', 400);
  }

  for (const medication of medications) {
    if (!medication.medicineId || !medication.dosage || !medication.frequency || !Number.isInteger(Number(medication.durationDays)) || Number(medication.durationDays) <= 0) {
      throw createServiceError('Each medication requires medicineId, dosage, frequency, and a positive durationDays value', 400);
    }
  }
};

const validatePrescriptionPatientFilter = (patientId) => requireOptionalUuidV7(patientId, 'patientId');

module.exports = { validateNewPrescription, validatePrescriptionPatientFilter };
