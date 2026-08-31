const assert = require('assert');
const { isUuidV7 } = require('../packages/common/src/uuid');
const { DEMO_IDS } = require('../packages/common/src/demo-data');

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost/api';
const demoPassword = process.env.DEMO_USER_PASSWORD;
const runTimestamp = Date.now();
const unique = new Date(runTimestamp).toISOString().replace(/[-:.TZ]/g, '');
let patientId;
const appointmentDate = new Date(runTimestamp + (30 + (runTimestamp % 1000)) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const appointmentHour = 8 + (runTimestamp % 9);
const appointmentMinute = [0, 15, 30, 45][Math.floor(runTimestamp / 10) % 4];
const appointmentTimeSlot = `${String(appointmentHour).padStart(2, '0')}:${String(appointmentMinute).padStart(2, '0')}`;

let token;

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { response, body };
};

const expectOk = async (path, options) => {
  const result = await request(path, options);
  assert(
    result.response.ok,
    `${options?.method || 'GET'} ${path} failed with ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
};

const expectStatus = async (status, path, options) => {
  const result = await request(path, options);
  assert.strictEqual(
    result.response.status,
    status,
    `${options?.method || 'GET'} ${path} expected ${status}, got ${result.response.status}: ${JSON.stringify(result.body)}`
  );
  return result.body;
};

const main = async () => {
  assert(demoPassword, 'DEMO_USER_PASSWORD must be set before running the gateway E2E test');

  for (const service of ['auth', 'patients', 'doctors', 'appointments', 'lab', 'pharmacy', 'billing', 'notifications']) {
    const health = await expectOk(`/${service}/health`);
    assert.match(health.status, /OK$/);
  }

  await expectStatus(401, '/patients');

  const login = await expectOk('/auth/login', {
    method: 'POST',
    body: { email: 'admin@hospital.com', password: demoPassword }
  });
  assert(login.token, 'login response must include a JWT');
  token = login.token;

  const doctors = await expectOk('/doctors');
  assert(doctors.some((doctor) => doctor.userId === DEMO_IDS.users.doctorOmar), 'seeded doctor must be available');

  const registeredPatient = await expectOk('/auth/register', {
    method: 'POST',
    body: {
      email: `e2e.patient.${unique}@hospital.test`,
      password: demoPassword,
      role: 'PATIENT'
    }
  });
  patientId = registeredPatient.id;
  assert.strictEqual(registeredPatient.role, 'PATIENT', 'account provisioning must ignore privileged role input');
  assert(isUuidV7(patientId), 'registered patient ID must be UUIDv7');

  const inventory = await expectOk('/pharmacy/inventory');
  assert(inventory.length > 0, 'seeded pharmacy inventory must be available');
  const medicine = inventory[0];
  assert(isUuidV7(medicine.id), 'inventory ID must be UUIDv7');

  const patient = await expectOk('/patients/profile', {
    method: 'POST',
    body: {
      userId: patientId,
      firstName: 'Automated',
      lastName: `Patient ${unique}`,
      dateOfBirth: '1990-01-01',
      contactNumber: '+20 100 000 0000',
      address: 'E2E Test Ward',
      bloodGroup: 'A+'
    }
  });
  assert.strictEqual(patient.userId, patientId);
  assert(isUuidV7(patient.id), 'patient profile ID must be UUIDv7');

  const appointment = await expectOk('/appointments', {
    method: 'POST',
    body: {
      patientId,
      doctorId: DEMO_IDS.users.doctorOmar,
      date: appointmentDate,
      timeSlot: appointmentTimeSlot,
      reasonForVisit: 'Automated end-to-end verification'
    }
  });
  assert.strictEqual(appointment.patientId, patientId);
  assert(isUuidV7(appointment.id), 'appointment ID must be UUIDv7');
  assert.strictEqual(appointment.notificationQueued, true, 'appointment notification must be queued');
  await expectStatus(400, '/appointments', {
    method: 'POST',
    body: {
      patientId,
      doctorId: DEMO_IDS.users.doctorOmar,
      date: appointmentDate,
      timeSlot: appointment.timeSlot,
      reasonForVisit: 'Duplicate slot should fail'
    }
  });

  const lab = await expectOk('/lab/orders', {
    method: 'POST',
    body: { patientId, testName: 'CBC', notes: 'E2E order' }
  });
  assert.strictEqual(lab.patientId, patientId);
  assert(isUuidV7(lab.id), 'lab order ID must be UUIDv7');
  const completedLab = await expectOk(`/lab/orders/${lab.id}/result`, {
    method: 'PUT',
    body: { result: 'Within expected range' }
  });
  assert.strictEqual(completedLab.status.name, 'COMPLETED');

  await expectStatus(400, '/pharmacy/prescriptions', {
    method: 'POST',
    body: { patientId, medications: [{ medicineId: medicine.id, dosage: '1 tablet' }] }
  });
  const prescription = await expectOk('/pharmacy/prescriptions', {
    method: 'POST',
    body: {
      patientId,
      notes: 'E2E prescription',
      medications: [{
        medicineId: medicine.id,
        dosage: '1 tablet',
        frequency: 'daily',
        durationDays: 1
      }]
    }
  });
  assert(isUuidV7(prescription.id), 'prescription ID must be UUIDv7');
  assert(prescription.medications.every((item) => isUuidV7(item.id)), 'prescription item IDs must be UUIDv7');
  const dispensed = await expectOk(`/pharmacy/prescriptions/${prescription.id}/dispense`, { method: 'PUT' });
  assert.strictEqual(dispensed.status.name, 'DISPENSED');

  await expectStatus(400, '/billing/invoices', {
    method: 'POST',
    body: { patientId, items: [{ description: '', amount: -1 }] }
  });
  const invoice = await expectOk('/billing/invoices', {
    method: 'POST',
    body: { patientId, items: [{ description: 'E2E invoice item', amount: 123.45 }] }
  });
  assert(isUuidV7(invoice.id), 'invoice ID must be UUIDv7');
  assert(invoice.items.every((item) => isUuidV7(item.id) && isUuidV7(item.sourceId)), 'invoice item and source IDs must be UUIDv7');
  assert.strictEqual(invoice.status.name, 'ISSUED');
  const paid = await expectOk(`/billing/invoices/${invoice.id}/pay`, { method: 'PUT' });
  assert.strictEqual(paid.status.name, 'PAID');

  const [patientRecord, appointments, labs, prescriptions, invoices] = await Promise.all([
    expectOk(`/patients/${patientId}`),
    expectOk(`/appointments?patientId=${patientId}`),
    expectOk(`/lab/orders?patientId=${patientId}`),
    expectOk(`/pharmacy/prescriptions?patientId=${patientId}`),
    expectOk(`/billing/invoices?patientId=${patientId}`)
  ]);

  assert.strictEqual(patientRecord.userId, patientId);
  assert(appointments.some((item) => item.id === appointment.id));
  assert(labs.some((item) => item.id === lab.id));
  assert(prescriptions.some((item) => item.id === prescription.id));
  assert(invoices.some((item) => item.id === invoice.id));

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const notifications = await expectOk('/notifications');
  const appointmentNotification = notifications.find((item) => item.patientId === patientId);
  assert(appointmentNotification, 'Kafka appointment notification must be persisted');
  assert(isUuidV7(appointmentNotification.id), 'notification ID must be UUIDv7');
  assert(isUuidV7(appointmentNotification.eventId), 'notification event ID must be UUIDv7');
  assert(appointmentNotification.message.includes(`Automated Patient ${unique}`), 'notification must display the patient name');
  assert(appointmentNotification.message.includes('Dr. Omar Nabil'), 'notification must display the doctor name');
  assert(!appointmentNotification.message.includes(DEMO_IDS.users.doctorOmar), 'notification must not display the doctor UUID');

  console.log(`E2E gateway test passed for ${patientId}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
