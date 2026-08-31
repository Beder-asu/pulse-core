const test = require('node:test');
const assert = require('node:assert/strict');
const { createNotificationService } = require('./notificationService');
const { createAppointmentCreatedHandler } = require('../messaging/handlers/appointmentCreatedHandler');
const { createLegacyNotificationRepairService } = require('./legacyNotificationRepairService');

test('notification service preserves idempotent appointment persistence data', async () => {
  let upsert;
  const service = createNotificationService({
    notifications: {
      findTypeByName: async () => ({ id: 'type' }),
      findChannelByName: async () => ({ id: 'channel' }),
      upsertByEventId: async (data) => { upsert = data; return data.data; }
    }
  });
  await service.createAppointmentNotification({ eventId: 'event', patientId: 'patient', patientName: 'Amina Hassan', doctorName: 'Omar Nabil', date: '2026-09-01', timeSlot: '10:00' });
  assert.equal(upsert.eventId, 'event');
  assert.equal(upsert.data.userId, 'patient');
  assert.equal(upsert.data.message, 'Appointment for Amina Hassan with Dr. Omar Nabil on 2026-09-01 at 10:00 is confirmed.');
});

test('notification service preserves role scoping and read ownership', async () => {
  const queries = [];
  const service = createNotificationService({
    notifications: {
      findAll: async (userId) => { queries.push(userId); return []; },
      findById: async () => ({ id: 'notification', userId: 'patient' }),
      markAsRead: async () => ({ id: 'notification', isRead: true })
    }
  });
  await service.getNotifications({ id: 'admin', role: 'ADMIN' });
  await service.getNotifications({ id: 'patient', role: 'PATIENT' });
  assert.deepEqual(queries, [undefined, 'patient']);
  await assert.rejects(service.markAsRead({ id: 'notification', requester: { id: 'other', role: 'PATIENT' } }), { message: 'Notification not found', statusCode: 404 });
});

test('appointment handler preserves event filtering and event ID fallback', async () => {
  const calls = [];
  const handler = createAppointmentCreatedHandler({
    notifications: { createAppointmentNotification: async (data) => calls.push(data) },
    serviceLogger: { info: () => {} }
  });
  await handler({ event: 'OtherEvent', payload: {} });
  await handler({ event: 'AppointmentCreated', payload: { appointmentId: 'appointment', patientId: 'patient', patientName: 'Amina', doctorName: 'Omar', date: '2026-09-01', timeSlot: '10:00' } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].eventId, 'appointment');
});

test('legacy repair preserves named-message conversion', async () => {
  let update;
  const service = createLegacyNotificationRepairService({
    notifications: {
      findAppointmentNotificationsForRepair: async () => [{ id: 'notification', patientId: 'patient', message: 'Your appointment with Dr. Omar on 2026-09-01 at 10:00 is confirmed.' }],
      updateMessage: async (id, message) => { update = { id, message }; }
    },
    patients: { isConfigured: () => true, getById: async () => ({ firstName: 'Amina', lastName: 'Hassan' }) },
    doctors: { isConfigured: () => true, getById: async () => null }
  });
  assert.equal(await service.repair(), 1);
  assert.equal(update.message, 'Appointment for Amina Hassan with Dr. Omar on 2026-09-01 at 10:00 is confirmed.');
});
