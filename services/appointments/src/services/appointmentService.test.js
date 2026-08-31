const test = require('node:test');
const assert = require('node:assert/strict');
const { createAppointmentService } = require('./appointmentService');
const { createAppointmentCreatedPublisher } = require('../messaging/publishers/appointmentCreatedPublisher');

const silentLogger = { info: () => {}, warn: () => {} };

test('appointment service preserves operation order and publication data', async () => {
  const calls = [];
  let published;
  const service = createAppointmentService({
    doctors: { getById: async () => { calls.push('doctor'); return { firstName: 'Omar', lastName: 'Nabil' }; } },
    patients: { getById: async () => { calls.push('patient'); return { firstName: 'Amina', lastName: 'Hassan' }; } },
    appointments: {
      findStatusByName: async () => { calls.push('status'); return { id: 'scheduled' }; },
      findActiveSlot: async () => { calls.push('slot'); return null; },
      create: async (data) => { calls.push('create'); return { id: 'appointment', ...data, status: { name: 'SCHEDULED' } }; }
    },
    publisher: { publish: async (event) => { calls.push('publish'); published = event; } },
    access: { assertCanBook: () => {} },
    serviceLogger: silentLogger,
    kafkaRequired: () => false
  });
  const result = await service.bookAppointment({ requester: { id: 'patient', role: 'PATIENT' }, patientId: 'patient', doctorId: 'doctor', date: '2026-09-01', timeSlot: '10:00', reasonForVisit: 'Checkup' });
  assert.deepEqual(calls, ['doctor', 'patient', 'status', 'slot', 'create', 'publish']);
  assert.deepEqual(published, { appointmentId: 'appointment', patientId: 'patient', patientName: 'Amina Hassan', doctorId: 'doctor', doctorName: 'Omar Nabil', date: '2026-09-01', timeSlot: '10:00' });
  assert.equal(result.notificationQueued, true);
});

test('appointment service preserves optional Kafka failure behavior', async () => {
  const service = createAppointmentService({
    doctors: { getById: async () => ({ firstName: 'Omar' }) },
    patients: { getById: async () => ({ firstName: 'Amina' }) },
    appointments: {
      findStatusByName: async () => ({ id: 'scheduled' }),
      findActiveSlot: async () => null,
      create: async (data) => ({ id: 'appointment', ...data })
    },
    publisher: { publish: async () => { throw new Error('Kafka unavailable'); } },
    access: { assertCanBook: () => {} },
    serviceLogger: silentLogger,
    kafkaRequired: () => false
  });
  const result = await service.bookAppointment({ requester: { id: 'patient', role: 'PATIENT' }, patientId: 'patient', doctorId: 'doctor', date: '2026-09-01', timeSlot: '10:00', reasonForVisit: 'Checkup' });
  assert.equal(result.notificationQueued, false);
});

test('appointment queries reject structured UUID filters before persistence', () => {
  const service = createAppointmentService({
    appointments: { findAll: () => { throw new Error('repository must not be called'); } },
    access: { listScope: () => ({}) },
    doctors: {}, patients: {}, publisher: {}, serviceLogger: silentLogger, kafkaRequired: () => false
  });
  assert.throws(
    () => service.getAppointments({ requester: { id: 'staff', role: 'STAFF' }, filters: { doctorId: { user: {} } } }),
    { message: 'doctorId must be a UUIDv7 string', statusCode: 400 }
  );
});

test('appointment publisher preserves topic and exact event envelope', async () => {
  let sent;
  const publisher = createAppointmentCreatedPublisher({
    broker: { publish: async (topic, event) => { sent = { topic, event }; } },
    createId: () => 'event-id'
  });
  await publisher.publish({ appointmentId: 'appointment', patientId: 'patient', patientName: 'Amina', doctorId: 'doctor', doctorName: 'Omar', date: '2026-09-01', timeSlot: '10:00' });
  assert.deepEqual(sent, {
    topic: 'hospital.events',
    event: {
      eventId: 'event-id',
      event: 'AppointmentCreated',
      payload: { appointmentId: 'appointment', patientId: 'patient', patientName: 'Amina', doctorId: 'doctor', doctorName: 'Omar', date: '2026-09-01', timeSlot: '10:00' }
    }
  });
});
