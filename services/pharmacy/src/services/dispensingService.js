const { logger } = require('@pulsecore/common');
const inventoryRepository = require('../repositories/inventoryRepository');
const prescriptionRepository = require('../repositories/prescriptionRepository');
const { createServiceError } = require('@pulsecore/common');
const pharmacyAccessPolicy = require('../policies/pharmacyAccessPolicy');

const createDispensingService = ({ inventory, prescriptions, access, serviceLogger }) => ({
  dispense: async ({ requester, id }) => {
    access.assertCanDispense(requester);
    const prescription = await prescriptions.findByIdForDispensing(id);
    if (!prescription) throw createServiceError('Prescription not found', 404);
    if (prescription.status.name === 'DISPENSED') throw createServiceError('Prescription already dispensed', 400);

    const dispensedStatus = await prescriptions.findStatusByName('DISPENSED');
    if (!dispensedStatus) throw new Error('DISPENSED status not found');

    const updated = await prescriptions.runTransaction(async (tx) => {
      for (const medication of prescription.medications) {
        const requestedUnits = medication.durationDays;
        const decremented = await inventory.decrementIfAvailable(tx, medication.inventoryId, requestedUnits);
        if (decremented.count !== 1) {
          const item = await inventory.findById(tx, medication.inventoryId);
          throw new Error(`Insufficient stock for ${item?.medicineName || 'prescribed medication'}`);
        }
      }

      return prescriptions.updateInTransaction(tx, id, { statusId: dispensedStatus.id });
    });

    serviceLogger.info(`Prescription dispensed: ${prescription.id}`);
    return updated;
  }
});

module.exports = createDispensingService({
  inventory: inventoryRepository,
  prescriptions: prescriptionRepository,
  access: pharmacyAccessPolicy,
  serviceLogger: logger
});
module.exports.createDispensingService = createDispensingService;
