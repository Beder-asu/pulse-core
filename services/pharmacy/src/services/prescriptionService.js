const { logger } = require('@pulsecore/common');
const prescriptionRepository = require('../repositories/prescriptionRepository');
const { validateNewPrescription, validatePrescriptionPatientFilter } = require('../validators/prescriptionValidator');
const pharmacyAccessPolicy = require('../policies/pharmacyAccessPolicy');

const createPrescriptionService = ({ prescriptions, access, serviceLogger }) => ({
  getPrescriptions: ({ requester, patientId }) => {
    const validatedPatientId = validatePrescriptionPatientFilter(patientId);
    return prescriptions.findAll(access.prescriptionScope(requester, validatedPatientId));
  },

  createPrescription: async ({ requester, patientId, doctorId, medications, notes, statusId }) => {
    access.assertCanCreate(requester, doctorId);
    validateNewPrescription({ patientId, medications });

    let activeStatusId = statusId;
    if (!activeStatusId) {
      const pendingStatus = await prescriptions.findStatusByName('PENDING');
      if (!pendingStatus) throw new Error('PENDING status not found');
      activeStatusId = pendingStatus.id;
    }

    const prescription = await prescriptions.create({
      patientId,
      doctorId,
      notes,
      statusId: activeStatusId,
      medications: {
        create: medications.map((medication) => ({
          inventoryId: medication.medicineId,
          dosage: medication.dosage,
          frequency: medication.frequency,
          durationDays: medication.durationDays
        }))
      }
    });
    serviceLogger.info(`Prescription created: ${prescription.id} by doctor ${doctorId}`);
    return prescription;
  }
});

module.exports = createPrescriptionService({ prescriptions: prescriptionRepository, access: pharmacyAccessPolicy, serviceLogger: logger });
module.exports.createPrescriptionService = createPrescriptionService;
