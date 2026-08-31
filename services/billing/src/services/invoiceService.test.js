const test = require('node:test');
const assert = require('node:assert/strict');
const { createInvoiceService } = require('./invoiceService');

const silentLogger = { info: () => {} };
const fixedNow = new Date('2026-08-28T00:00:00Z');

test('invoice service preserves validation, total, and item mapping', async () => {
  let createData;
  const service = createInvoiceService({
    invoices: {
      findStatusByName: async () => ({ id: 'issued' }),
      create: async (data) => { createData = data; return { id: 'invoice', ...data }; }
    },
    access: { assertOperational: () => {} },
    createId: () => 'generated-id',
    serviceLogger: silentLogger,
    now: () => fixedNow
  });
  const requester = { id: 'admin', role: 'ADMIN' };
  await assert.rejects(service.createInvoice({ requester }), { message: 'Patient and at least one invoice item are required', statusCode: 400 });
  await assert.rejects(service.createInvoice({ requester, patientId: 'patient', items: [{ description: '', amount: -1 }] }), { message: 'Each invoice item requires a description and a positive amount', statusCode: 400 });
  await service.createInvoice({ requester, patientId: 'patient', items: [{ description: 'Visit', amount: '12.50' }] });
  assert.equal(createData.totalAmount, 12.5);
  assert.deepEqual(createData.items.create[0], { sourceId: 'generated-id', sourceType: 'MANUAL', description: 'Visit', amount: 12.5 });
});

test('invoice service preserves patient access and payment behavior', async () => {
  const service = createInvoiceService({
    invoices: {
      findAll: async () => [],
      findById: async () => ({ id: 'invoice', status: { name: 'ISSUED' } }),
      findStatusByName: async () => ({ id: 'paid' }),
      update: async (id, data) => ({ id, ...data })
    },
    access: { assertOperational: (requester) => { if (requester.role === 'PATIENT') throw Object.assign(new Error('User role not authorized'), { statusCode: 403 }); } },
    createId: () => 'id',
    serviceLogger: silentLogger,
    now: () => fixedNow
  });
  assert.throws(() => service.getPatientInvoices({ requester: { id: 'other', role: 'PATIENT' }, patientId: 'patient' }), { statusCode: 403 });
  const paid = await service.payInvoice({ requester: { id: 'staff', role: 'STAFF' }, id: 'invoice' });
  assert.equal(paid.statusId, 'paid');
  assert.equal(paid.paidAt, fixedNow);
});

test('invoice queries reject structured UUID filters before persistence', () => {
  const service = createInvoiceService({
    invoices: { findAll: () => { throw new Error('repository must not be called'); } },
    access: { assertOperational: () => {} },
    createId: () => 'id',
    serviceLogger: silentLogger,
    now: () => fixedNow
  });
  assert.throws(
    () => service.getInvoices({ requester: { id: 'staff', role: 'STAFF' }, patientId: { gte: 'foo' } }),
    { message: 'patientId must be a UUIDv7 string', statusCode: 400 }
  );
});
