const test = require('node:test');
const assert = require('node:assert/strict');
const { createLabOrderService } = require('./labOrderService');

const silentLogger = { info: () => {} };

test('lab order service preserves defaults and patient authorization', async () => {
  const calls = [];
  const service = createLabOrderService({
    orders: {
      findStatusByName: async (name) => { calls.push(name); return { id: `${name}-id` }; },
      findPriorityByName: async (name) => { calls.push(name); return { id: `${name}-id` }; },
      create: async (data) => ({ id: 'order-id', ...data }),
      findAll: async (patientId) => [{ patientId }]
    },
    access: {
      assertCanCreate: () => {},
      assertCanReadPatient: (requester, patientId) => {
        if (requester.role === 'PATIENT' && requester.id !== patientId) throw Object.assign(new Error('Not authorized to view these records'), { statusCode: 403 });
      }
    },
    serviceLogger: silentLogger
  });

  const requester = { id: 'doctor', role: 'DOCTOR' };
  await assert.rejects(service.createOrder({ requester }), { message: 'Patient and test name are required', statusCode: 400 });
  await assert.rejects(
    service.createOrder({ requester, patientId: 'patient', doctorId: 'doctor', testName: 'CBC', priority: 'INVALID' }),
    { message: 'priority is not supported; use priorityId', statusCode: 400 }
  );
  const order = await service.createOrder({ requester, patientId: 'patient', doctorId: 'doctor', testName: 'CBC' });
  assert.deepEqual(calls, ['PENDING', 'ROUTINE']);
  assert.equal(order.statusId, 'PENDING-id');
  assert.throws(() => service.getPatientOrders({ requester: { id: 'other', role: 'PATIENT' }, patientId: 'patient' }), { statusCode: 403 });
});

test('lab order queries reject structured UUID filters before persistence', () => {
  const service = createLabOrderService({
    orders: { findAll: () => { throw new Error('repository must not be called'); } },
    access: { listScope: () => ({}) },
    serviceLogger: silentLogger
  });
  assert.throws(
    () => service.getOrders({ requester: { id: 'staff', role: 'STAFF' }, filters: { patientId: { gte: 'foo' } } }),
    { message: 'patientId must be a UUIDv7 string', statusCode: 400 }
  );
});

test('lab result update preserves values and completion behavior', async () => {
  let updateData;
  const service = createLabOrderService({
    orders: {
      findById: async () => ({ id: 'order', statusId: 'pending', result: null, resultFileUrl: 'old-url' }),
      findStatusByName: async () => ({ id: 'completed' }),
      update: async (id, data) => { updateData = data; return { id, ...data }; }
    },
    access: {},
    serviceLogger: silentLogger
  });
  await service.updateOrderResult({ id: 'order', result: 'Normal' });
  assert.deepEqual(updateData, { statusId: 'completed', result: 'Normal', resultFileUrl: 'old-url' });
});
