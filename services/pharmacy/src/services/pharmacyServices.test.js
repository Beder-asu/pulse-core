const test = require('node:test');
const assert = require('node:assert/strict');
const { createPrescriptionService } = require('./prescriptionService');
const { createDispensingService } = require('./dispensingService');

const silentLogger = { info: () => {} };

test('prescription service preserves validation, defaults, and medication mapping', async () => {
  let createData;
  const service = createPrescriptionService({
    prescriptions: {
      findStatusByName: async () => ({ id: 'pending' }),
      create: async (data) => { createData = data; return { id: 'prescription', ...data }; }
    },
    access: { assertCanCreate: () => {} },
    serviceLogger: silentLogger
  });
  const requester = { id: 'doctor', role: 'DOCTOR' };
  await assert.rejects(service.createPrescription({ requester }), { message: 'Patient and at least one medication are required', statusCode: 400 });
  await assert.rejects(service.createPrescription({ requester, patientId: 'patient', medications: [{ medicineId: 'medicine', dosage: '1 tablet' }] }), { message: 'Each medication requires medicineId, dosage, frequency, and a positive durationDays value', statusCode: 400 });
  await service.createPrescription({ requester, patientId: 'patient', doctorId: 'doctor', medications: [{ medicineId: 'medicine', dosage: '1 tablet', frequency: 'daily', durationDays: 2 }] });
  assert.equal(createData.statusId, 'pending');
  assert.deepEqual(createData.medications.create[0], { inventoryId: 'medicine', dosage: '1 tablet', frequency: 'daily', durationDays: 2 });
});

test('prescription queries reject structured UUID filters before persistence', () => {
  const service = createPrescriptionService({
    prescriptions: { findAll: () => { throw new Error('repository must not be called'); } },
    access: { prescriptionScope: () => ({}) },
    serviceLogger: silentLogger
  });
  assert.throws(
    () => service.getPrescriptions({ requester: { id: 'staff', role: 'STAFF' }, patientId: { gte: 'foo' } }),
    { message: 'patientId must be a UUIDv7 string', statusCode: 400 }
  );
});

test('dispensing service keeps all inventory updates inside one transaction', async () => {
  const transactionClient = { transaction: true };
  const calls = [];
  const service = createDispensingService({
    inventory: {
      decrementIfAvailable: async (tx, id, units) => { calls.push(['decrement', tx, id, units]); return { count: 1 }; },
      findById: async () => ({ medicineName: 'Medicine' })
    },
    access: { assertCanDispense: () => {} },
    prescriptions: {
      findByIdForDispensing: async () => ({ id: 'prescription', status: { name: 'PENDING' }, medications: [{ inventoryId: 'medicine', durationDays: 2 }] }),
      findStatusByName: async () => ({ id: 'dispensed' }),
      runTransaction: async (operation) => operation(transactionClient),
      updateInTransaction: async (tx, id, data) => { calls.push(['update', tx, id, data]); return { id, statusId: data.statusId }; }
    },
    serviceLogger: silentLogger
  });
  const result = await service.dispense({ requester: { id: 'staff', role: 'STAFF' }, id: 'prescription' });
  assert.equal(result.statusId, 'dispensed');
  assert.equal(calls[0][1], transactionClient);
  assert.equal(calls[1][1], transactionClient);
});

test('dispensing service stops before status update when stock is insufficient', async () => {
  let updated = false;
  const service = createDispensingService({
    inventory: {
      decrementIfAvailable: async () => ({ count: 0 }),
      findById: async () => ({ medicineName: 'Amoxicillin' })
    },
    access: { assertCanDispense: () => {} },
    prescriptions: {
      findByIdForDispensing: async () => ({ id: 'prescription', status: { name: 'PENDING' }, medications: [{ inventoryId: 'medicine', durationDays: 999 }] }),
      findStatusByName: async () => ({ id: 'dispensed' }),
      runTransaction: async (operation) => operation({}),
      updateInTransaction: async () => { updated = true; }
    },
    serviceLogger: silentLogger
  });
  await assert.rejects(service.dispense({ requester: { id: 'staff', role: 'STAFF' }, id: 'prescription' }), { message: 'Insufficient stock for Amoxicillin' });
  assert.equal(updated, false);
});
